// 言溪题库API请求处理

// 处理API请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'queryYanxiAPI') {
    const { question, token, type, options } = request.data;
    
    // 构建查询URL - 包含选项
    const queryUrl = `https://tk.enncy.cn/query?token=${encodeURIComponent(token)}&title=${encodeURIComponent(question)}&type=${encodeURIComponent(type)}&options=${encodeURIComponent(options || '')}`;
    handleYanxiApiQuery(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => {
        console.error('API请求错误:', error);
        sendResponse({ 
          success: false, 
          error: error.message || '请求API失败' 
        });
      });
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'checkApiAvailability') {
    checkYanxiApiAvailability(request.data.token)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => {
        console.error('API检查错误:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'API检查失败' 
        });
      });
    return true; // 保持消息通道开放
  }
});

// 处理言溪题库API查询
// 修改处理API请求的函数，确保包含options参数
async function handleYanxiApiQuery({ question, token, type, options }) {
    // 编码参数为URL组件
    const encodedQuestion = encodeURIComponent(question);
    const encodedToken = encodeURIComponent(token);
    const encodedOptions = encodeURIComponent(options || '');
    
    // 构建API请求URL，包含选项参数
    const url = `https://tk.enncy.cn/query?token=${encodedToken}&title=${encodedQuestion}${type ? '&type=' + encodeURIComponent(type) : ''}${options ? '&options=' + encodedOptions : ''}`;
    
    // 添加重试机制
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`);
        }
        
        // 获取响应文本
        const textResponse = await response.text();
        
        // 检查返回的是否是HTML文档
        if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
          if (textResponse.includes('login') || textResponse.includes('登录')) {
            return {
              code: 0,
              data: {
                question: question,
                answer: "",
                times: "未知"
              },
              message: `API返回了登录页面，Token可能已过期`
            };
          }
          
          throw new Error('API返回了HTML而非JSON');
        }
        
        // 尝试解析JSON
        try {
          return JSON.parse(textResponse);
        } catch (jsonError) {
          // 判断是否为Token错误
          if (textResponse.includes('token无效') || textResponse.includes('Token无效')) {
            return {
              code: 0,
              data: { times: "0" },
              message: "Token无效或已过期"
            };
          }
          
          throw new Error(`响应不是有效JSON: ${jsonError.message}`);
        }
      } catch (error) {
        lastError = error;
        retries--;
        
        // 如果还有重试次数，等待一段时间后重试
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // 所有重试都失败了
    return {
      code: 0,
      data: {
        question: question,
        answer: "",
        times: "未知"
      },
      message: `API请求失败: ${lastError ? lastError.message : '未知错误'}`
    };
  }

// 检查API可用性
async function checkYanxiApiAvailability(token) {
  try {
    const encodedToken = encodeURIComponent(token);
    const url = `https://tk.enncy.cn/info?token=${encodedToken}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    // 获取响应文本
    const textResponse = await response.text();
    
    // 检查返回的是否是HTML文档
    if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
      throw new Error('API返回了HTML页面，可能需要登录或Token已过期');
    }
    
    // 尝试解析JSON
    try {
      const data = JSON.parse(textResponse);
      return data;
    } catch (jsonError) {
      throw new Error(`响应不是有效JSON: ${jsonError.message}`);
    }
  } catch (error) {
    throw new Error(`API检查失败: ${error.message}`);
  }
}
