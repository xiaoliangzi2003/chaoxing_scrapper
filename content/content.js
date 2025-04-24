// 检测是否为题库页面
function isQuestionBankPage() {
  return window.location.href.includes('work/view');
}

// 创建悬浮窗
function createFloatingWindow() {
  const floatDiv = document.createElement('div');
  floatDiv.id = 'cx-scrapper-float';
  floatDiv.className = 'cx-scrapper-container cx-scrapper-minimized';
  
  floatDiv.innerHTML = `
    <div class="cx-scrapper-icon"></div>
    <div class="cx-scrapper-header">
      <h3>超星题库爬取</h3>
      <span class="cx-scrapper-close">✖</span>
    </div>
    <div class="cx-scrapper-body">
      <div class="cx-header-icon">
        <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="Logo">
        <h2>题库爬取器</h2>
      </div>
      <button id="cx-start-scrape" class="cx-scrapper-btn">开始爬取</button>
      <div id="cx-progress-container" style="display: none;">
        <div class="cx-progress-label">爬取进度</div>
        <progress id="cx-progress-bar" value="0" max="100"></progress>
        <span id="cx-progress-text">0%</span>
      </div>
      <div id="cx-export-container" style="display: none;">
        <p class="cx-result-text">爬取完成，共<span id="cx-total-questions">0</span>道题</p>
        <div class="cx-export-title">选择导出格式</div>
        <div class="cx-export-options">
          <button id="cx-export-txt" class="cx-scrapper-btn"><span class="cx-btn-icon">📄</span>TXT</button>
          <button id="cx-export-md" class="cx-scrapper-btn"><span class="cx-btn-icon">📝</span>MD</button>
          <button id="cx-export-doc" class="cx-scrapper-btn"><span class="cx-btn-icon">📃</span>DOC</button>
          <button id="cx-export-pdf" class="cx-scrapper-btn"><span class="cx-btn-icon">📎</span>PDF</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(floatDiv);
  
  // 设置图标背景 - 修复图标路径
  const iconElement = floatDiv.querySelector('.cx-scrapper-icon');
  iconElement.style.backgroundImage = `url(${chrome.runtime.getURL('icons/icon48.png')})`;
  
  // 点击图标展开窗口
  iconElement.addEventListener('click', () => {
    floatDiv.classList.remove('cx-scrapper-minimized');
  });
  
  // 点击关闭按钮最小化窗口
  document.querySelector('.cx-scrapper-close').addEventListener('click', () => {
    floatDiv.classList.add('cx-scrapper-minimized');
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
  document.getElementById('cx-export-pdf').addEventListener('click', () => exportData('pdf'));
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
  
  // 获取题干 - 移除题型和分值部分
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
  
  // 组装问题数据 - 需保存题型信息用于判断题答案处理，但不包含在导出内容中
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
  
  if (format === 'pdf') {
    exportToPDF(title, questions);
    return;
  }
  
  let content = '';
  
  if (format === 'txt' || format === 'md') {
    questions.forEach((q) => {
      // 题号和题目内容（删除题型和分值信息）
      content += `${q.number}. ${q.content}\n`;
      
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
      // 修改Word格式的导出，删除题型和分值信息
      content += `<p><strong>${q.number}.</strong> ${q.content}</p>\n`;
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

// PDF导出功能
function exportToPDF(title, questions) {
  try {
    // 创建jsPDF实例 - A4大小，纵向
    const pdf = new jspdf.jsPDF();
    
    // 设置字体大小和样式
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    
    // 添加标题
    pdf.text(title, 20, 20);
    
    // 重置字体
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    
    let y = 30; // 起始Y坐标
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    
    // 处理每个问题
    questions.forEach((q, index) => {
      // 检查是否需要换页
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      
      // 添加题号和内容
      const questionText = `${q.number}. ${q.content}`;
      const splitTitle = pdf.splitTextToSize(questionText, pageWidth - margin * 2);
      pdf.text(splitTitle, margin, y);
      y += splitTitle.length * lineHeight;
      
      // 添加选项
      q.options.forEach(option => {
        // 检查是否需要换页
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        
        const splitOption = pdf.splitTextToSize(option, pageWidth - margin * 2 - 5);
        pdf.text(splitOption, margin, y);
        y += splitOption.length * lineHeight;
      });
      
      // 添加正确答案
      if (q.answer) {
        // 检查是否需要换页
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFont("helvetica", "bold");
        pdf.text(`正确答案：${q.answer}`, margin, y);
        pdf.setFont("helvetica", "normal");
        y += lineHeight;
      }
      
      // 题目间隔
      y += lineHeight;
      
      // 添加分隔线（除了最后一题）
      if (index < questions.length - 1) {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        } else {
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, y - lineHeight/2, pageWidth - margin, y - lineHeight/2);
          y += lineHeight;
        }
      }
    });
    
    // 保存PDF
    pdf.save(`${title}.pdf`);
  } catch (error) {
    console.error('PDF导出错误:', error);
    alert('PDF导出失败，请检查控制台获取详细错误信息');
  }
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
