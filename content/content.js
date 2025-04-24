// 检测是否为题库页面
function isQuestionBankPage() {
  const url = window.location.href;
  if (url.includes('work/view')) {
    return 'view'; // Viewing mode, can export but cannot answer
  } else if (url.includes('work/dowork')) {
    return 'dowork'; // Doing work mode, can answer but cannot export
  }
  return false; // Not a question bank page
}

// 创建悬浮窗
function createFloatingWindow() {
  const floatDiv = document.createElement('div');
  floatDiv.id = 'cx-scrapper-float';
  floatDiv.className = 'cx-scrapper-container cx-scrapper-minimized';
  const style = document.createElement('style');
   style.textContent = `
    .cx-scrapper-body {
      max-height: 70vh; /* Limit to 70% of viewport height */
      overflow-y: auto; /* Enable vertical scrolling */
    }
    
    .cx-log-container {
      max-height: 200px; /* Limit log container height */
      overflow-y: auto; /* Enable vertical scrolling for logs */
    }
    
    .cx-tab-content {
      max-height: calc(70vh - 80px); /* Leave room for header */
      overflow-y: auto; /* Enable vertical scrolling */
    }
  `;
  document.head.appendChild(style);
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
      <div class="cx-tab-container">
        <div class="cx-tabs">
          <div class="cx-tab active" data-tab="scrape">爬取题库</div>
          <div class="cx-tab" data-tab="auto-answer">自动答题</div>
          <div class="cx-tab" data-tab="settings">设置</div>
        </div>
        <div class="cx-tab-content">
          <div class="cx-tab-pane active" id="scrape-tab">
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
              </div>
            </div>
          </div>
          <div class="cx-tab-pane" id="auto-answer-tab">
            <div class="cx-info-box">
              <p>自动答题将通过言溪题库API查询并填写答案</p>
            </div>
            <div class="cx-btn-group">
              <button id="cx-auto-answer" class="cx-scrapper-btn cx-primary-btn">开始自动答题</button>
              <button id="cx-pause-answer" class="cx-scrapper-btn cx-secondary-btn" style="display:none;">暂停</button>
            </div>
            <div id="cx-answer-progress" class="cx-progress-box" style="display: none;">
              <div class="cx-progress-label">查询进度</div>
              <progress id="cx-answer-progress-bar" value="0" max="100"></progress>
              <span id="cx-answer-progress-text">0%</span>
            </div>
            <div id="cx-answer-results" style="display: none;">
              <p class="cx-result-text">答题完成，共查询<span id="cx-total-answered">0</span>道题，成功<span id="cx-success-answered">0</span>道</p>
              <p class="cx-api-info">API剩余次数：<span id="cx-api-times">--</span></p>
            </div>
            <div id="cx-answer-logs" class="cx-log-container">
              <div class="cx-log-title">查询日志</div>
              <div id="cx-logs" class="cx-logs"></div>
            </div>
          </div>
          <div class="cx-tab-pane" id="settings-tab">
            <div class="cx-setting-group">
              <label for="cx-apitoken" class="cx-setting-label">言溪题库Token:</label>
              <div class="cx-input-group">
                <input type="password" id="cx-apitoken" class="cx-input" placeholder="请输入Token">
                <button id="cx-save-apitoken" class="cx-scrapper-btn cx-sm-btn">保存</button>
              </div>
              <p class="cx-setting-hint">获取Token请访问 <a href="https://tk.enncy.cn" target="_blank">言溪题库官网</a></p>
            </div>
            <div class="cx-setting-group">
              <div class="cx-check-group">
                <input type="checkbox" id="cx-show-logs" class="cx-checkbox" checked>
                <label for="cx-show-logs">显示查询日志</label>
              </div>
              <div class="cx-check-group">
                <input type="checkbox" id="cx-debug-mode" class="cx-checkbox">
                <label for="cx-debug-mode">调试模式</label>
              </div>
              <div class="cx-check-group">
                <input type="checkbox" id="cx-show-requests" class="cx-checkbox">
                <label for="cx-show-requests">显示请求内容</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(floatDiv);
  // Check page type and hide appropriate tabs
  const pageType = isQuestionBankPage();
    
  if (pageType === 'view') {
    // On view pages: hide auto-answer tab
    const autoAnswerTab = floatDiv.querySelector('.cx-tab[data-tab="auto-answer"]');
    const autoAnswerPane = floatDiv.querySelector('#auto-answer-tab');
    
    if (autoAnswerTab) autoAnswerTab.style.display = 'none';
    if (autoAnswerPane) autoAnswerPane.style.display = 'none';
    
    // Make scrape tab active
    floatDiv.querySelector('.cx-tab[data-tab="scrape"]').classList.add('active');
    floatDiv.querySelector('#scrape-tab').classList.add('active');
  } 
  else if (pageType === 'dowork' || pageType.includes('dowork')) {
    // On dowork pages: hide scrape tab
    const scrapeTab = floatDiv.querySelector('.cx-tab[data-tab="scrape"]');
    const scrapePane = floatDiv.querySelector('#scrape-tab');
    
    if (scrapeTab) scrapeTab.style.display = 'none';
    if (scrapePane) scrapePane.style.display = 'none';
    
    // Make auto-answer tab active
    floatDiv.querySelector('.cx-tab[data-tab="auto-answer"]').classList.add('active');
    floatDiv.querySelector('#auto-answer-tab').classList.add('active');
  }
  
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
  
  // 标签切换功能
  const tabs = document.querySelectorAll('.cx-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // 激活当前标签
      document.querySelectorAll('.cx-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // 显示对应内容
      document.querySelectorAll('.cx-tab-pane').forEach(p => p.classList.remove('active'));
      document.getElementById(tabName + '-tab').classList.add('active');
    });
  });
  
  // 爬取功能按钮
  document.getElementById('cx-start-scrape').addEventListener('click', startScraping);
  document.getElementById('cx-export-txt').addEventListener('click', () => exportData('txt'));
  document.getElementById('cx-export-md').addEventListener('click', () => exportData('md'));
  document.getElementById('cx-export-doc').addEventListener('click', () => exportData('doc'));
  
  // 自动答题功能按钮
  document.getElementById('cx-auto-answer').addEventListener('click', startAutoAnswering);
  document.getElementById('cx-pause-answer').addEventListener('click', togglePauseAnswering);
  
  // 设置功能按钮
  document.getElementById('cx-save-apitoken').addEventListener('click', saveAPIToken);
  document.getElementById('cx-show-logs').addEventListener('change', toggleLogsVisibility);
  document.getElementById('cx-debug-mode').addEventListener('change', function() {
    chrome.storage.sync.set({ 'debugMode': this.checked });
  });
  document.getElementById('cx-show-requests').addEventListener('change', function() {
    chrome.storage.sync.set({ 'showRequests': this.checked });
  });
  
  // 加载设置
  loadSettings();
}

// 保存API Token
function saveAPIToken() {
  const apiToken = document.getElementById('cx-apitoken').value.trim();
  
  if (!apiToken) {
    showNotification('请输入有效的Token', 'error');
    return;
  }
  
  chrome.storage.sync.set({ 'yanxiAPIToken': apiToken }, function() {
    showNotification('Token保存成功', 'success');
  });
}

// 加载设置
function loadSettings() {
  chrome.storage.sync.get(['yanxiAPIToken', 'showLogs', 'debugMode', 'showRequests'], function(result) {
    if (result.yanxiAPIToken) {
      document.getElementById('cx-apitoken').value = result.yanxiAPIToken;
    }
    
    if (result.showLogs !== undefined) {
      document.getElementById('cx-show-logs').checked = result.showLogs;
    } else {
      // 默认开启日志
      document.getElementById('cx-show-logs').checked = true;
    }
    
    if (result.debugMode !== undefined) {
      document.getElementById('cx-debug-mode').checked = result.debugMode;
    }
    
    if (result.showRequests !== undefined) {
      document.getElementById('cx-show-requests').checked = result.showRequests;
    }
    
    toggleLogsVisibility();
  });
}

// 切换日志显示
function toggleLogsVisibility() {
  const showLogs = document.getElementById('cx-show-logs').checked;
  chrome.storage.sync.set({ 'showLogs': showLogs });
  
  document.getElementById('cx-answer-logs').style.display = showLogs ? 'block' : 'none';
}

// 显示通知
function showNotification(message, type = 'info') {
  // 检查是否已有通知，有则移除
  const existingNotification = document.getElementById('cx-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // 创建新通知
  const notification = document.createElement('div');
  notification.id = 'cx-notification';
  notification.className = `cx-notification ${type}`;
  notification.innerHTML = `
    <span class="cx-notification-message">${message}</span>
    <span class="cx-notification-close">×</span>
  `;
  
  document.body.appendChild(notification);
  
  // 添加关闭按钮功能
  notification.querySelector('.cx-notification-close').addEventListener('click', () => {
    notification.remove();
  });
  
  // 自动消失
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add('cx-notification-hide');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 3000);
}

// 增强版日志添加函数
function addLog(questionNumber, question, result, status, details = null) {
  const logsContainer = document.getElementById('cx-logs');
  const logEntry = document.createElement('div');
  logEntry.className = `cx-log-entry ${status}`;
  
  // 简化问题文本，最多显示30个字符
  const shortQuestion = question.length > 30 ? question.substring(0, 30) + '...' : question;
  
  let logHTML = `
    <span class="cx-log-number">${questionNumber}</span>
    <span class="cx-log-question" title="${question}">${shortQuestion}</span>
    <span class="cx-log-result">${result}</span>
  `;
  
  // 如果有详细信息并且处于调试模式，则添加详细信息按钮
  if (details && document.getElementById('cx-debug-mode').checked) {
    logHTML += `<span class="cx-log-details-toggle">详情</span>`;
  }
  
  logEntry.innerHTML = logHTML;
  
  logsContainer.appendChild(logEntry);
  
  // 如果有详细信息并处于调试模式，则添加详细信息区域
  if (details && document.getElementById('cx-debug-mode').checked) {
    const detailsEl = document.createElement('div');
    detailsEl.className = 'cx-log-details';
    detailsEl.style.display = 'none';
    detailsEl.innerHTML = `<pre>${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}</pre>`;
    
    logsContainer.appendChild(detailsEl);
    
    // 添加点击事件来切换详细信息的显示
    const toggleBtn = logEntry.querySelector('.cx-log-details-toggle');
    toggleBtn.addEventListener('click', function() {
      if (detailsEl.style.display === 'none') {
        detailsEl.style.display = 'block';
        this.textContent = '收起';
      } else {
        detailsEl.style.display = 'none';
        this.textContent = '详情';
      }
    });
  }
  
  // 自动滚动到底部
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

// 暂停/继续答题的状态变量和控制函数
let isPaused = false;
let currentQuestionIndex = 0;
let totalQuestionsGlobal = 0;
let questionsGlobal = [];
let apiTokenGlobal = '';
let successCountGlobal = 0;
let remainingTimesGlobal = 0;

function togglePauseAnswering() {
  const pauseBtn = document.getElementById('cx-pause-answer');
  
  if (isPaused) {
    // 继续答题
    isPaused = false;
    pauseBtn.textContent = '暂停';
    showNotification('已继续自动答题', 'info');
    
    // 继续处理剩余题目
    continueAutoAnswering();
  } else {
    // 暂停答题
    isPaused = true;
    pauseBtn.textContent = '继续';
    showNotification('已暂停自动答题', 'info');
  }
}

// 继续自动答题的函数
async function continueAutoAnswering() {
  try {
    // 检查是否有有效题目
    if (!questionsGlobal || !Array.isArray(questionsGlobal) || questionsGlobal.length === 0) {
      console.error("全局题目数组无效");
      showNotification("无法继续答题：未找到有效的题目", "error");
      resetAnsweringState();
      return;
    }

    // 从当前暂停的题目索引继续
    for (let i = currentQuestionIndex; i < totalQuestionsGlobal; i++) {
      // 检查是否暂停
      if (isPaused) {
        currentQuestionIndex = i;
        return;
      }
      
      const question = questionsGlobal[i];
      
      // 解析问题
      const questionData = parseQuestion(question);
      
      // 更新进度条
      updateProgress(i + 1, totalQuestionsGlobal);
      
      // 添加日志条目
      addLog(questionData.number || i + 1, questionData.content, '查询中...', 'processing');
      
      // 检查是否有足够的时间调用API
      if (remainingTimesGlobal === 0) {
        updateLastLog(questionData.number || i + 1, questionData.content, 'API次数已用完', 'error');
        continue;
      }
      
      try {
        // 调用言溪题库API
        const result = await queryYanxiAPI(
          questionData.content, 
          apiTokenGlobal, 
          questionData.type,
          questionData.options  // 传递选项数据
        );
        
        // 解析API返回的结果
        if (result.code === 1 && result.data) {
          // API请求成功
          remainingTimesGlobal = parseInt(result.data.times) || 0;
          
          // 检查是否有答案
          if (result.data.answer) {
            // 将文本答案与选项匹配
            let answerOption = '';
            
            // 判断题特别处理
            if (questionData.type === "判断题") {
              const answer = result.data.answer.toLowerCase().trim();
              if (answer.includes('对') || answer.includes('正确') || answer.includes('是') || answer.includes('√')) {
                answerOption = 'A';
              } else if (answer.includes('错') || answer.includes('错误') || answer.includes('否') || answer.includes('×')) {
                answerOption = 'B';
              } else {
                // 尝试直接匹配
                answerOption = result.data.answer;
              }
            } else {
              // 单选题和多选题用匹配函数处理
              answerOption = matchAnswerWithOptions(result.data.answer, questionData.options);
              
              // 如果匹配失败但API直接返回了ABCD形式的答案
              if (!answerOption && /^[A-D]+$/.test(result.data.answer.toUpperCase())) {
                answerOption = result.data.answer.toUpperCase();
              }
            }
            
            if (answerOption) {
              // 填写答案
              const success = fillAnswer(question, answerOption, questionData.type);
              
              if (success) {
                updateLastLog(questionData.number || i + 1, questionData.content, `答案: ${answerOption}`, 'success', {
                  apiResponse: result,
                  parsedAnswer: answerOption,
                  originalAnswer: result.data.answer
                });
                successCountGlobal++;
              } else {
                updateLastLog(questionData.number || i + 1, questionData.content, `填写失败: ${answerOption}`, 'error', {
                  apiResponse: result,
                  parsedAnswer: answerOption,
                  originalAnswer: result.data.answer
                });
              }
            } else {
              updateLastLog(questionData.number || i + 1, questionData.content, `无法匹配答案: ${result.data.answer}`, 'warning', result);
            }
          } else {
            updateLastLog(questionData.number || i + 1, questionData.content, '题库中无此题', 'warning', result);
          }
        } else {
          // API请求失败
          updateLastLog(questionData.number || i + 1, questionData.content, `查询失败: ${result.message}`, 'error', result);
        }
      } catch (error) {
        updateLastLog(questionData.number || i + 1, questionData.content, `出错: ${error.message}`, 'error', error);
      }
      
      // 添加随机延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500));
    }
    
    // 显示结果
    const resultsElement = document.getElementById('cx-answer-results');
    const totalAnsweredElement = document.getElementById('cx-total-answered');
    const successAnsweredElement = document.getElementById('cx-success-answered');
    const apiTimesElement = document.getElementById('cx-api-times');
    const autoAnswerButton = document.getElementById('cx-auto-answer');
    const pauseAnswerButton = document.getElementById('cx-pause-answer');
    
    if (resultsElement) resultsElement.style.display = 'block';
    if (totalAnsweredElement) totalAnsweredElement.textContent = totalQuestionsGlobal;
    if (successAnsweredElement) successAnsweredElement.textContent = successCountGlobal;
    if (apiTimesElement) apiTimesElement.textContent = remainingTimesGlobal;
    if (autoAnswerButton) autoAnswerButton.disabled = false;
    if (pauseAnswerButton) pauseAnswerButton.style.display = 'none';
    
    showNotification(`答题完成，成功填写${successCountGlobal}道题`, 'success');
    
    // 重置全局变量
    resetAnsweringState();
  } catch (error) {
    console.error("自动答题过程中发生错误:", error);
    showNotification(`答题过程中发生错误: ${error.message}`, "error");
    
    // 重置状态
    const autoAnswerButton = document.getElementById('cx-auto-answer');
    const pauseAnswerButton = document.getElementById('cx-pause-answer');
    
    if (autoAnswerButton) autoAnswerButton.disabled = false;
    if (pauseAnswerButton) pauseAnswerButton.style.display = 'none';
    
    resetAnsweringState();
  }
}

// 更新进度条函数
function updateProgress(current, total) {
  const progressBar = document.getElementById('cx-answer-progress-bar');
  const progressText = document.getElementById('cx-answer-progress-text');
  
  if (progressBar && progressText) {
    const percentage = Math.round((current / total) * 100);
    progressBar.value = percentage;
    progressText.textContent = percentage + '%';
  }
}
// 重置答题状态
function resetAnsweringState() {
  isPaused = false;
  currentQuestionIndex = 0;
  totalQuestionsGlobal = 0;
  questionsGlobal = [];
  apiTokenGlobal = '';
  successCountGlobal = 0;
  remainingTimesGlobal = 0;
}

// 添加检查API获取障碍的函数
function checkApiAvailability(apiToken) {
  return new Promise(async (resolve) => {
    try {
      // 测试一个简单请求
      const testUrl = `https://tk.enncy.cn/info?token=${encodeURIComponent(apiToken)}`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // 检查状态
      if (!response.ok) {
        resolve({
          success: false,
          message: `HTTP错误: ${response.status}`
        });
        return;
      }
      
      // 尝试读取响应
      const text = await response.text();
      
      // 检查是否返回HTML
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        resolve({
          success: false,
          message: `API返回了HTML页面，可能需要登录或Token已过期`
        });
        return;
      }
      
      // 尝试解析为JSON
      try {
        const data = JSON.parse(text);
        resolve({
          success: true,
          data: data
        });
      } catch (e) {
        resolve({
          success: false,
          message: `无法解析API响应: ${e.message}`
        });
      }
    } catch (error) {
      resolve({
        success: false,
        message: `API检查失败: ${error.message}`
      });
    }
  });
}

// 修改开始自动答题函数以使用检查函数
async function startAutoAnswering() {
  // 获取API Token
  const apiToken = document.getElementById('cx-apitoken').value.trim();
  
  if (!apiToken) {
    showNotification('请先在设置中输入有效的Token', 'error');
    return;
  }
  
  // 显示进度条和日志
  document.getElementById('cx-answer-progress').style.display = 'block';
  document.getElementById('cx-answer-results').style.display = 'none';
  document.getElementById('cx-auto-answer').disabled = true;
  document.getElementById('cx-pause-answer').style.display = 'inline-block';
  
  // 清空日志
  document.getElementById('cx-logs').innerHTML = '';
  const showLogs = document.getElementById('cx-show-logs').checked;
  document.getElementById('cx-answer-logs').style.display = showLogs ? 'block' : 'none';
  
  // 获取所有题目 - 添加更多选择器增强兼容性
  let questions = document.querySelectorAll('.questionLi');
  if (!questions || questions.length === 0) {
    questions = document.querySelectorAll('.question-item, .question, .quest-item');
  }
  if (!questions || questions.length === 0) {
    questions = document.querySelectorAll('.stem_question');  // 新增选择器
  }
  if (!questions || questions.length === 0) {
    questions = document.querySelectorAll('.questionBox, .work-question');  // 新增选择器
  }
  if (!questions || questions.length === 0) {
    questions = document.querySelectorAll('#submitTest .Py-mian1');  // 新增选择器
  }
  if (!questions || questions.length === 0) {
    questions = document.querySelectorAll('#mainhw .quizBox');  // 新增选择器
  }
  
  const totalQuestions = questions.length;
  
  if (totalQuestions === 0) {
    // 如果仍然找不到题目，尝试识别可能包含题目的容器元素
    const possibleContainers = document.querySelectorAll('div[class*="question"], div[id*="question"], li[class*="quiz"], div[class*="quiz"]');
    
    if (possibleContainers.length > 0) {
      // 使用备选选择器找到的问题
      questionsGlobal = Array.from(possibleContainers);
      totalQuestionsGlobal = possibleContainers.length;
      
      // 添加调试信息
      console.log("通过通用选择器找到可能的题目容器:", possibleContainers);
      addLog('状态', '初始化', `找到 ${totalQuestionsGlobal} 个可能的题目`, 'info');
    } else {
      showNotification('未检测到题目，请确保在答题页面', 'error');
      document.getElementById('cx-auto-answer').disabled = false;
      document.getElementById('cx-answer-progress').style.display = 'none';
      document.getElementById('cx-pause-answer').style.display = 'none';
      
      // 添加调试信息到日志
      addLog('错误', '初始化', '未检测到题目。如果确认页面有题目，请联系开发者添加支持', 'error');
      
      // 尝试记录页面结构以辅助调试
      const pageStructure = document.body.innerHTML.substring(0, 5000); // 只取前一部分避免过大
      console.log("页面HTML结构:", pageStructure);
      
      return;
    }
  } else {
    // 原始选择器找到的问题 - 转换为数组
    questionsGlobal = Array.from(questions);
    totalQuestionsGlobal = totalQuestions;
    console.log("找到题目元素:", questions);
    addLog('状态', '初始化', `找到 ${totalQuestionsGlobal} 个题目`, 'success');
  }
  
  // 初始化全局变量
  isPaused = false;
  currentQuestionIndex = 0;
//   totalQuestionsGlobal = totalQuestions;
//   questionsGlobal = questions;
  apiTokenGlobal = apiToken;
  successCountGlobal = 0;
  remainingTimesGlobal = 0;
  
  // 先测试API连接和Token有效性
  addLog('状态', '初始化', '测试API连接...', 'info');
  
  try {
    // 检查API可用性
    const apiCheck = await checkApiAvailability(apiToken);
    
    if (!apiCheck.success) {
      updateLastLog('状态', '连接测试', `API检查失败: ${apiCheck.message}`, 'error');
      showNotification(`无法连接到言溪题库API: ${apiCheck.message}`, 'error');
      document.getElementById('cx-auto-answer').disabled = false;
      document.getElementById('cx-pause-answer').style.display = 'none';
      return;
    }
    
    // 如果API检查通过，再进行题目查询测试
    const testResult = await queryYanxiAPI("连接测试", apiToken, "");
    
    if (testResult.code === 0 && testResult.message && testResult.message.includes('Token无效')) {
      updateLastLog('状态', '连接测试', 'Token无效或已过期', 'error', testResult);
      showNotification('Token无效或已过期，请更新Token', 'error');
      document.getElementById('cx-auto-answer').disabled = false;
      document.getElementById('cx-pause-answer').style.display = 'none';
      return;
    }

    remainingTimesGlobal = parseInt(testResult.data?.times) || 1000;

    updateLastLog('状态', '连接测试', 'API连接成功', 'success', testResult);
    
    // 启动自动答题流程
    continueAutoAnswering();
  } catch (error) {
    console.error("API连接测试失败:", error);
    updateLastLog('状态', '连接测试', `API连接测试失败: ${error.message}`, 'error', error);
    showNotification('无法连接到言溪题库API，请检查网络或Token', 'error');
    document.getElementById('cx-auto-answer').disabled = false;
    document.getElementById('cx-pause-answer').style.display = 'none';
    return;
  }
}

// 更新最后一条日志
function updateLastLog(questionNumber, question, result, status, details = null) {
  const logsContainer = document.getElementById('cx-logs');
  const lastLog = logsContainer.lastChild;
  
  if (lastLog) {
    // 移除最后一条日志
    logsContainer.removeChild(lastLog);
  }
  
  // 添加新的日志条目
  addLog(questionNumber, question, result, status, details);
}

// 查询言溪题库API获取答案 - 通过后台脚本访问API
async function queryYanxiAPI(question, token, questionType, options = []) {
  try {
    // 转换题目类型
    let type;
    switch (questionType) {
      case "单选题": 
        type = "single"; 
        break;
      case "多选题": 
        type = "multiple"; 
        break;
      case "判断题": 
        type = "judgement"; 
        break;
      default: 
        type = "";
    }
    
    // 格式化选项为字符串
    const optionsStr = options && Array.isArray(options) ? options.join('|') : '';
    
    // 记录请求详情 - 如果开启了显示请求内容选项
    if (document.getElementById('cx-show-requests')?.checked) {
      const requestInfo = {
        url: "https://tk.enncy.cn/query",
        method: 'GET',
        params: {
          token: token.substring(0, 3) + '***',
          title: question,
          options: optionsStr,
          type: type || 'undefined'
        }
      };
      
      console.log("API请求:", requestInfo);
      
      // 只有在调试模式开启时才添加日志
      if (document.getElementById('cx-debug-mode')?.checked) {
        try {
          addLog('请求', question, '发送言溪题库请求', 'info', requestInfo);
        } catch (logError) {
          console.error("添加日志失败:", logError);
        }
      }
    }
    
    // 使用chrome.runtime.sendMessage发送消息到后台脚本处理API请求
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'queryYanxiAPI',
        data: {
          question: question,
          token: token,
          type: type,
          options: optionsStr  // 添加选项数据
        }
      }, response => {
        // 如果发生错误，返回错误信息
        if (chrome.runtime.lastError) {
          console.error("发送消息错误:", chrome.runtime.lastError);
          resolve({
            code: 0,
            data: {
              question: question,
              answer: "",
              times: "未知"
            },
            message: `扩展通信错误: ${chrome.runtime.lastError.message || "未知错误"}`
          });
          return;
        }
        
        // 处理响应
        if (response && response.success) {
          resolve(response.data);
        } else {
          resolve({
            code: 0,
            data: {
              question: question,
              answer: "",
              times: "未知"
            },
            message: response?.error || "API请求失败"
          });
        }
      });
    });
  } catch (error) {
    console.error('言溪题库查询失败:', error);
    return {
      code: 0,
      data: {
        question: question,
        answer: "查询出错",
        times: "未知"
      },
      message: `查询失败: ${error.message}`
    };
  }
}


// 检查API可用性函数 - 通过后台脚本
async function checkApiAvailability(apiToken) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'checkApiAvailability',
      data: { token: apiToken }
    }, response => {
      // 处理可能的错误
      if (chrome.runtime.lastError) {
        console.error("检查API可用性错误:", chrome.runtime.lastError);
        resolve({
          success: false,
          message: `扩展通信错误: ${chrome.runtime.lastError.message || "未知错误"}`
        });
        return;
      }
      
      // 返回结果
      if (response && response.success) {
        resolve({
          success: true,
          data: response.data
        });
      } else {
        resolve({
          success: false,
          message: response?.error || "API检查失败"
        });
      }
    });
  });
}

// 删除不需要的fallbackApiQuery函数，因为后台脚本会处理所有API请求

// 填写答案到页面
// 添加或优化填写答案的函数
function fillAnswer(questionElement, answer, questionType) {
  try {
    if (!questionElement || !answer) return false;
    
    // 根据题目类型处理答案
    if (questionType === "单选题" || questionType === "判断题") {
      // 处理单选题和判断题
      const options = answer.split('');
      if (options.length > 0) {
        const option = options[0]; // 取第一个选项
        const optionIndex = option.charCodeAt(0) - 65; // 将A, B, C, D转换为0, 1, 2, 3
        
        // 尝试多种可能的选择器找到单选按钮
        let radioButtons = questionElement.querySelectorAll('input[type="radio"]');
        
        if (radioButtons.length === 0) {
          // 尝试其他常见选择器
          const selectors = [
            '.option input', 
            '.stem_answer input[type="radio"]',
            '.answer_p input',
            '.ulAnswer input[type="radio"]',
            'li input[type="radio"]'
          ];
          
          for (const selector of selectors) {
            radioButtons = questionElement.querySelectorAll(selector);
            if (radioButtons.length > 0) break;
          }
        }
        
        // 如果找到了单选按钮
        if (radioButtons.length > 0 && optionIndex < radioButtons.length) {
          // 检查是否已经选择了正确答案
          if (radioButtons[optionIndex].checked) {
            console.log(`单选题已经选择正确答案: ${option} - 跳过`);
            return true;
          } else {
            // 检查是否有其他选项被选中（即选错了）
            let wrongSelected = false;
            for (let i = 0; i < radioButtons.length; i++) {
              if (i !== optionIndex && radioButtons[i].checked) {
                wrongSelected = true;
                break;
              }
            }
            
            // 选择正确选项
            radioButtons[optionIndex].click();
            console.log(wrongSelected ? 
                        `单选题答案已从错误更正为: ${option}` : 
                        `单选题已选择: ${option}`);
            return true;
          }
        } else {
          // 尝试直接选择选项元素
          const optionElements = questionElement.querySelectorAll('.option-item, li, .answer_p');
          if (optionElements.length > optionIndex) {
            // 尝试检查是否已经选择了正确答案（通过检查样式）
            const correctOption = optionElements[optionIndex];
            const isSelected = correctOption.classList.contains('chosen') || 
                              correctOption.classList.contains('active') || 
                              correctOption.classList.contains('selected') ||
                              correctOption.querySelector('input:checked');
            
            if (isSelected) {
              console.log(`选项元素已经选择正确答案: ${option} - 跳过`);
              return true;
            }
            
            correctOption.click();
            console.log(`通过点击选项元素选择: ${option}`);
            return true;
          }
        }
      }
    } else if (questionType === "多选题") {
      // 处理多选题
      const correctOptions = answer.split('');
      if (correctOptions.length > 0) {
        let checkboxes = questionElement.querySelectorAll('input[type="checkbox"]');
        
        if (checkboxes.length === 0) {
          // 尝试其他常见选择器
          const selectors = [
            '.option input', 
            '.stem_answer input[type="checkbox"]',
            '.answer_p input',
            '.ulAnswer input[type="checkbox"]',
            'li input[type="checkbox"]'
          ];
          
          for (const selector of selectors) {
            checkboxes = questionElement.querySelectorAll(selector);
            if (checkboxes.length > 0) break;
          }
        }
        
        // 如果找到了复选框
        if (checkboxes.length > 0) {
          // 检查当前选中状态
          const currentSelected = [];
          checkboxes.forEach((checkbox, idx) => {
            if (checkbox.checked) {
              currentSelected.push(String.fromCharCode(65 + idx));
            }
          });
          
          // 检查当前选择是否与正确答案完全相同
          if (currentSelected.length === correctOptions.length && 
              currentSelected.every(opt => correctOptions.includes(opt))) {
            console.log(`多选题已经选择正确答案: ${correctOptions.join('')} - 跳过`);
            return true;
          }
          
          // 如果不完全正确，先取消所有选择，再重新选择
          for (let i = 0; i < checkboxes.length; i++) {
            const option = String.fromCharCode(65 + i);
            if (checkboxes[i].checked && !correctOptions.includes(option)) {
              checkboxes[i].click(); // 取消这个错误选项
              console.log(`取消错误选项: ${option}`);
            }
          }
          
          // 选择正确答案
          let success = false;
          correctOptions.forEach(option => {
            const optionIndex = option.charCodeAt(0) - 65;
            if (optionIndex >= 0 && optionIndex < checkboxes.length) {
              if (!checkboxes[optionIndex].checked) {
                checkboxes[optionIndex].click(); // 选中这个缺少的正确选项
                console.log(`选择缺少的正确选项: ${option}`);
                success = true;
              }
            }
          });
          
          if (success) {
            console.log(`多选题答案已修正为: ${correctOptions.join('')}`);
            return true;
          }
          return currentSelected.length > 0;
        } else {
          // 尝试直接选择选项元素
          const optionElements = questionElement.querySelectorAll('.option-item, li, .answer_p');
          
          // 检查当前选中状态
          const currentSelected = [];
          optionElements.forEach((element, idx) => {
            if (element.classList.contains('chosen') || 
                element.classList.contains('active') || 
                element.classList.contains('selected') ||
                element.querySelector('input:checked')) {
              currentSelected.push(String.fromCharCode(65 + idx));
            }
          });
          
          // 检查当前选择是否与正确答案完全相同
          if (currentSelected.length === correctOptions.length && 
              currentSelected.every(opt => correctOptions.includes(opt))) {
            console.log(`多选题选项元素已正确选择: ${correctOptions.join('')} - 跳过`);
            return true;
          }
          
          // 点击所有当前选中但不正确的选项取消选择
          currentSelected.forEach(option => {
            if (!correctOptions.includes(option)) {
              const idx = option.charCodeAt(0) - 65;
              if (idx >= 0 && idx < optionElements.length) {
                optionElements[idx].click();
                console.log(`取消错误选项元素: ${option}`);
              }
            }
          });
          
          // 点击所有应该选中但未选中的选项
          let success = false;
          correctOptions.forEach(option => {
            if (!currentSelected.includes(option)) {
              const idx = option.charCodeAt(0) - 65;
              if (idx >= 0 && idx < optionElements.length) {
                optionElements[idx].click();
                console.log(`选择缺少的正确选项元素: ${option}`);
                success = true;
              }
            }
          });
          
          if (success || currentSelected.some(opt => !correctOptions.includes(opt))) {
            console.log(`通过点击选项元素修正多选题答案为: ${correctOptions.join('')}`);
            return true;
          }
          return currentSelected.length > 0; // 如果已经有选中项，认为处理成功
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("填写答案时出错:", error);
    return false;
  }
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

// 添加选项匹配函数
function matchAnswerWithOptions(answer, options) {
    if (!answer || !options || options.length === 0) {
      console.warn("无法匹配答案，答案或选项为空", answer, options);
      return "";
    }
    
    // 初始化结果
    let result = "";
    const answerLower = answer.toLowerCase().trim();
    
    // 检测是否为多选题答案（包含分隔符）
    const isMultipleAnswer = answerLower.includes('#') || 
                             answerLower.includes('\n') || 
                             answerLower.includes('、') || 
                             answerLower.includes(',') || 
                             answerLower.includes('，');
                             
    // 如果是多选题答案，分割并处理每个部分
    if (isMultipleAnswer) {
      // 使用多种分隔符拆分答案
      const keywords = answer.split(/[#\n、,，]+/);
      const matchedOptions = [];
      
      // 处理每个关键词
      keywords.forEach(keyword => {
        const kw = keyword.trim().toLowerCase();
        if (!kw) return; // 跳过空字符串
        
        // 遍历所有选项寻找匹配
        let bestMatchIndex = -1;
        let bestMatchScore = 0.2; // 最小匹配阈值
        
        for (let i = 0; i < options.length; i++) {
          const optionLower = options[i].toLowerCase();
          // 清理选项文本，去除前缀如 "A."
          const cleanOption = optionLower.replace(/^[a-d][.、：:\s]+/i, '').trim();
          
          // 计算相似度
          const similarity = calculateSimilarity(kw, cleanOption);
          
          // 如果这个选项更匹配，更新最佳匹配
          if (similarity > bestMatchScore) {
            bestMatchScore = similarity;
            bestMatchIndex = i;
          }
        }
        
        // 如果找到匹配，添加到结果数组
        if (bestMatchIndex >= 0) {
          matchedOptions.push(bestMatchIndex);
        }
      });
      
      // 去重并转换为选项字母 (A, B, C, D...)
      const uniqueMatches = [...new Set(matchedOptions)];
      result = uniqueMatches.map(index => String.fromCharCode(65 + index)).join('');
      
      // 记录匹配过程
      console.log(`多选题匹配过程: 原始答案 "${answer}" -> 拆分为 ${keywords.length} 个关键词 -> 匹配到 ${result} 选项`);
      
      return result;
    }
    
    // 单选题处理 - 保持原来的逻辑
    // 精确匹配 - 选项完全等于答案
    for (let i = 0; i < options.length; i++) {
      const optionText = options[i].trim();
      if (optionText === answer) {
        return String.fromCharCode(65 + i); // A, B, C, D...
      }
    }
    
    // 关键字匹配 - 选项包含答案关键词
    const matchResults = [];
    options.forEach((option, index) => {
      const optionLower = option.toLowerCase();
      // 删除选项前面可能的标记，如 "A."、"B."
      const cleanOption = optionLower.replace(/^[a-d][.、：:\s]+/i, '').trim();
      
      // 计算匹配度分数
      const similarity = calculateSimilarity(answerLower, cleanOption);
      matchResults.push({
        index,
        similarity,
        option: cleanOption
      });
    });
    
    // 按匹配度排序
    matchResults.sort((a, b) => b.similarity - a.similarity);
    
    if (matchResults.length > 0 && matchResults[0].similarity > 0.3) {
      // 匹配度超过阈值，视为匹配
      return String.fromCharCode(65 + matchResults[0].index); // A, B, C, D...
    }
    
    return result;
  }
  
  // 计算两个字符串的相似度（简单版）
  function calculateSimilarity(str1, str2) {
    // 如果其中一个包含另一个，给予较高分数
    if (str1.includes(str2)) return 0.9;
    if (str2.includes(str1)) return 0.8;
    
    // 计算更长的字符串中包含较短字符串的多少个字符
    const [shorter, longer] = str1.length < str2.length ? [str1, str2] : [str2, str1];
    let matchCount = 0;
    
    // 检查较短字符串的每个字符是否在较长字符串中
    for (const char of shorter) {
      if (longer.includes(char)) matchCount++;
    }
    
    return matchCount / shorter.length;
  }


function parseQuestion(questionElement) {
    if (!questionElement) {
      console.error("题目元素为null");
      return {
        number: 0,
        type: "未知",
        score: "0",
        content: "无法解析题目",
        options: [],
        answer: ""
      };
    }
    
    try {
      // 获取题号和题型
      let titleElement = questionElement.querySelector('.mark_name');
      if (!titleElement) titleElement = questionElement.querySelector('.test-head');
      if (!titleElement) titleElement = questionElement.querySelector('.u-tit');
      if (!titleElement) titleElement = questionElement.querySelector('.titleBar');
      if (!titleElement) titleElement = questionElement.querySelector('.subject');
                          
      if (!titleElement) {
        console.warn("无法找到题目标题元素", questionElement);
        return {
          number: 0,
          type: "未知",
          score: "0",
          content: "无法解析题目标题",
          options: [],
          answer: ""
        };
      }
      
      const titleText = titleElement.textContent || "";
      
      // 添加更多正则表达式来匹配不同格式的题目标题
      const questionTypeMatch = titleText.match(/\((.+?),\s*(\d+)分\)/) || 
                               titleText.match(/\((.+?)\)\s*\[(\d+)分\]/) ||
                               titleText.match(/（(.+?)[:：]\s*(\d+)分/) ||
                               titleText.match(/\((.+?)[,:：]\s*(\d+)分/);
      
      // 尝试从各种格式中提取题号
      let questionNumber = 0;
      const numberMatch = titleText.match(/^\d+/) || titleText.match(/(\d+)[.、]/);
      if (numberMatch) {
        questionNumber = parseInt(numberMatch[0]);
      }
      
      // 尝试确定题目类型
      let questionType = "";
      let questionScore = "";
      
      if (questionTypeMatch) {
        questionType = questionTypeMatch[1] || "";
        questionScore = questionTypeMatch[2] || "";
      } else {
        // 从题目内容中提取题型
        if (titleText.includes("单选题")) {
          questionType = "单选题";
        } else if (titleText.includes("多选题")) {
          questionType = "多选题";
        } else if (titleText.includes("判断题")) {
          questionType = "判断题";
        } else if (questionElement.querySelector('input[type="radio"]')) {
          const radioInputs = questionElement.querySelectorAll('input[type="radio"]');
          if (radioInputs.length === 2) {
            questionType = "判断题";
          } else {
            questionType = "单选题";
          }
        } else if (questionElement.querySelector('input[type="checkbox"]')) {
          questionType = "多选题";
        }
      }
      
      // 获取题干 - 多种尝试方法
      let content = "";
      
      // 1. 先尝试找专门的内容元素
      let contentElement = questionElement.querySelector('.qtContent');
      if (!contentElement) contentElement = questionElement.querySelector('.test-quiz');
      if (!contentElement) contentElement = questionElement.querySelector('.mark_body');
      if (!contentElement) contentElement = questionElement.querySelector('.mark_title');
      if (!contentElement) contentElement = questionElement.querySelector('.description');
      if (!contentElement) contentElement = questionElement.querySelector('.subject');
      
      // 2. 如果找不到专门的内容元素，则从标题元素中提取实际内容
      if (contentElement && contentElement.textContent.trim()) {
        content = contentElement.textContent.trim();
      } else {
        // 从mark_name中提取题目内容 - 去除题号和题型信息
        content = titleText;
        
        // 清理题号前缀（如"1."）
        content = content.replace(/^\d+\.?\s*/, '');
        
        // 清理题型标记（如"(单选题)"或"[2分]"）
        content = content.replace(/\([^)]+\)/g, '').replace(/\[[^\]]+\]/g, '');
        content = content.replace(/（[^）]+）/g, '');
        
        // 清理多余空格
        content = content.replace(/\s+/g, ' ').trim();
      }
      
      // 获取选项 - 多种选择器尝试
      const options = [];
      let optionElements = null;
      
      const selectors = [
        '.mark_letter li', 
        '.mark_letter div',
        '.test-option li',
        '.option-item',
        '.answer_p',      
        '.clearfix li',   
        '.ulAnswer li',   
        '.optionUl li',   
        '.ques-option li',
        'ul.ulTop li',    
        '.stem_answer .answer_p', 
        '.stem_answer div',
        'div[name="optionForm"] li',
        '.workQuestionOption'  // 新增选择器
      ];
      
      for (const selector of selectors) {
        const elements = questionElement.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          optionElements = elements;
          console.log(`找到选项元素，使用选择器: ${selector}`, elements);
          break;
        }
      }
      
      if (!optionElements || optionElements.length === 0) {
        // 尝试找包含A/B/C/D的元素
        const possibleOptions = Array.from(questionElement.querySelectorAll('div, li, p, span'))
          .filter(el => {
            const text = el.textContent.trim();
            return /^[A-D][\.\s、]/.test(text);
          });
          
        if (possibleOptions.length > 0) {
          optionElements = possibleOptions;
          console.log("通过选项标记找到可能的选项元素:", possibleOptions);
        } else {
          // 找含有单选按钮或复选框的元素
          const inputParents = Array.from(questionElement.querySelectorAll('input[type="radio"], input[type="checkbox"]'))
            .map(input => input.closest('li') || input.closest('div') || input.parentElement);
            
          if (inputParents.length > 0) {
            optionElements = [...new Set(inputParents)];
            console.log("通过输入控件找到可能的选项元素:", inputParents);
          }
        }
      }
                           
      if (optionElements && optionElements.length) {
        optionElements.forEach(option => {
          if (option && option.textContent) {
            let optionText = option.textContent.trim();
            optionText = optionText.replace(/\s+/g, ' ');
            options.push(optionText);
          }
        });
        console.log("成功解析到选项:", options);
      } else {
        console.warn("无法找到题目选项元素", questionElement);
      }
      
      // 获取正确答案
      let rightAnswerElement = questionElement.querySelector('.rightAnswerContent');
      if (!rightAnswerElement) rightAnswerElement = questionElement.querySelector('.key');
      if (!rightAnswerElement) rightAnswerElement = questionElement.querySelector('.answer');
      if (!rightAnswerElement) rightAnswerElement = questionElement.querySelector('.show_answer');
      
      let rightAnswer = '';
      if (rightAnswerElement) {
        rightAnswer = rightAnswerElement.textContent.trim();
        
        // 判断题答案转换
        if (questionType === "判断题") {
          if (rightAnswer.includes("对") || rightAnswer.includes("√") || rightAnswer.includes("正确")) {
            rightAnswer = "A";
          } else if (rightAnswer.includes("错") || rightAnswer.includes("×") || rightAnswer.includes("错误")) {
            rightAnswer = "B";
          }
        }
      }
      
      // 输出调试信息
      if (document.getElementById('cx-debug-mode')?.checked) {
        console.debug("解析题目:", {
          element: questionElement,
          number: questionNumber,
          type: questionType,
          score: questionScore,
          content: content,
          options: options,
          answer: rightAnswer
        });
      }
      
      return {
        number: questionNumber || 0,
        type: questionType || "未知",
        score: questionScore || "0",
        content: content,
        options: options,
        answer: rightAnswer
      };
    } catch (e) {
      console.error("解析题目时出错:", e);
      return {
        number: 0,
        type: "未知",
        score: "0",
        content: "解析题目出错: " + e.message,
        options: [],
        answer: ""
      };
    }
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

