// 检测是否为题库页面
function isQuestionBankPage() {
  return window.location.href.includes('work/view');
}

// 创建悬浮窗
function createFloatingWindow() {
  const floatDiv = document.createElement('div');
  floatDiv.id = 'cx-scrapper-float';
  floatDiv.className = 'cx-scrapper-container';
  
  floatDiv.innerHTML = `
    <div class="cx-scrapper-header">
      <h3>超星题库爬取</h3>
      <span class="cx-scrapper-close">✖</span>
    </div>
    <div class="cx-scrapper-body">
      <button id="cx-start-scrape" class="cx-scrapper-btn">开始爬取</button>
      <div id="cx-progress-container" style="display: none;">
        <progress id="cx-progress-bar" value="0" max="100"></progress>
        <span id="cx-progress-text">0%</span>
      </div>
      <div id="cx-export-container" style="display: none;">
        <p>爬取完成，共<span id="cx-total-questions">0</span>道题</p>
        <div class="cx-export-options">
          <button id="cx-export-txt" class="cx-scrapper-btn">导出TXT</button>
          <button id="cx-export-md" class="cx-scrapper-btn">导出MD</button>
          <button id="cx-export-doc" class="cx-scrapper-btn">导出DOC</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(floatDiv);
  
  // 添加事件监听
  document.querySelector('.cx-scrapper-close').addEventListener('click', () => {
    floatDiv.classList.toggle('cx-scrapper-minimized');
  });
  
  // 拖拽功能
  let isDragging = false;
  let offsetX, offsetY;
  
  document.querySelector('.cx-scrapper-header').addEventListener('mousedown', function(e) {
    isDragging = true;
    offsetX = e.clientX - floatDiv.getBoundingClientRect().left;
    offsetY = e.clientY - floatDiv.getBoundingClientRect().top;
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    floatDiv.style.left = (e.clientX - offsetX) + 'px';
    floatDiv.style.top = (e.clientY - offsetY) + 'px';
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
  
  document.getElementById('cx-start-scrape').addEventListener('click', startScraping);
  document.getElementById('cx-export-txt').addEventListener('click', () => exportData('txt'));
  document.getElementById('cx-export-md').addEventListener('click', () => exportData('md'));
  document.getElementById('cx-export-doc').addEventListener('click', () => exportData('doc'));
}

// 爬取题目数据
async function startScraping() {
  // 显示进度条
  document.getElementById('cx-progress-container').style.display = 'block';
  document.getElementById('cx-start-scrape').disabled = true;
  
  // 爬取标题
  const title = getTitle();
  
  // 获取所有题目
  const questions = document.querySelectorAll('.questionLi');
  const totalQuestions = questions.length;
  const scrapedData = [];
  
  // 开始爬取
  for(let i = 0; i < totalQuestions; i++) {
    const question = questions[i];
    const questionData = parseQuestion(question);
    scrapedData.push(questionData);
    
    // 更新进度
    const progress = Math.round((i + 1) / totalQuestions * 100);
    document.getElementById('cx-progress-bar').value = progress;
    document.getElementById('cx-progress-text').textContent = progress + '%';
    
    // 避免浏览器冻结，每爬取5题让出主线程
    if(i % 5 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  // 保存数据
  saveScrapedData(title, scrapedData);
  
  // 显示导出选项
  document.getElementById('cx-export-container').style.display = 'block';
  document.getElementById('cx-total-questions').textContent = totalQuestions;
}

// 获取标题
function getTitle() {
  const titleElement = document.querySelector('.mark_title');
  return titleElement ? titleElement.textContent.trim() : '超星题库';
}

// 解析题目
function parseQuestion(questionElement) {
  // 获取题号和题型
  const titleElement = questionElement.querySelector('.mark_name');
  const titleText = titleElement.textContent;
  const questionTypeMatch = titleText.match(/\((.+?),\s*(\d+)分\)/);
  
  const questionNumber = parseInt(titleText.match(/^\d+/)[0]);
  const questionType = questionTypeMatch ? questionTypeMatch[1] : '';
  const questionScore = questionTypeMatch ? questionTypeMatch[2] : '';
  
  // 获取题干
  const contentElement = questionElement.querySelector('.qtContent');
  const content = contentElement ? contentElement.textContent.trim() : '';
  
  // 获取选项
  const options = [];
  const optionElements = questionElement.querySelectorAll('.mark_letter li');
  optionElements.forEach(option => {
    options.push(option.textContent.trim());
  });
  
  // 获取正确答案
  const rightAnswerElement = questionElement.querySelector('.rightAnswerContent');
  let rightAnswer = '';
  
  if (rightAnswerElement) {
    rightAnswer = rightAnswerElement.textContent.trim();
    
    // 判断题答案转换为"A"或"B"
    if (questionType === "判断题") {
      if (rightAnswer === "对") {
        rightAnswer = "A";
      } else if (rightAnswer === "错") {
        rightAnswer = "B";
      }
    }
  }
  
  // 组装问题数据
  return {
    number: questionNumber,
    type: questionType,
    score: questionScore,
    content: content,
    options: options,
    answer: rightAnswer
  };
}

// 保存爬取数据
function saveScrapedData(title, data) {
  window.scrapedQuestionData = {
    title: title,
    questions: data
  };
}

// 导出数据
function exportData(format) {
  if (!window.scrapedQuestionData) return;
  
  const { title, questions } = window.scrapedQuestionData;
  let content = '';
  
  if (format === 'txt' || format === 'md') {
    questions.forEach((q) => {
      // 题号和题型
      content += `${q.number}. (${q.type}, ${q.score}分)${q.content}\n`;
      
      // 选项
      q.options.forEach(option => {
        content += `${option}\n`;
      });
      
      // 答案（如果有）
      if (q.answer) {
        content += `\n正确答案：${q.answer}\n`;
      }
      
      // 题目间隔
      content += '\n';
    });
  } else if (format === 'doc') {
    // 创建一个简单的Word文档格式 (HTML格式，可以在Word中打开)
    content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'SimSun', serif; }
        p { margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
    `;
    
    questions.forEach((q) => {
      content += `<p><strong>${q.number}. (${q.type}, ${q.score}分)</strong>${q.content}</p>\n`;
      content += '<p>';
      q.options.forEach(option => {
        content += `${option}<br>\n`;
      });
      content += '</p>\n';
      
      if (q.answer) {
        content += `<p><strong>正确答案：</strong>${q.answer}</p>\n`;
      }
      
      content += '<br>\n';
    });
    
    content += '</body></html>';
  }
  
  // 创建下载链接
  const blob = new Blob([content], { type: format === 'doc' ? 'application/msword' : 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.${format}`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// 初始化
function init() {
  if (isQuestionBankPage()) {
    // 等待页面加载完成
    setTimeout(() => {
      createFloatingWindow();
    }, 1000);
  }
}

// 当页面加载完成后初始化
window.addEventListener('load', init);

// 监听URL变化，以处理SPA页面
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (isQuestionBankPage()) {
      setTimeout(() => {
        // 如果已经有悬浮窗，则不再创建
        if (!document.getElementById('cx-scrapper-float')) {
          createFloatingWindow();
        }
      }, 1000);
    }
  }
}).observe(document, {subtree: true, childList: true});
