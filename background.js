chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // === 1. 获取模型列表接口 ===
  if (request.action === "get_models") {
    fetchModels(request.key)
      .then(models => sendResponse({ models: models }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  // === 2. 翻译接口 (接收前端传来的 model 参数) ===
  if (request.action === "call_gemini_api_batch") {
    translateBatch(request.texts, request.key, request.model)
      .then(results => sendResponse({ results: results }))
      .catch(error => sendResponse({ error: error.message }));
    return true; 
  }
});

// 获取模型列表
async function fetchModels(key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    // 筛选出所有支持生成内容的模型
    return data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name.replace("models/", "")); // 去掉前缀
  } catch (e) {
    throw e;
  }
}

// 翻译逻辑
async function translateBatch(textArray, key, modelName) {
  // 默认兜底模型
  const model = modelName || "gemini-2.5-flash-lite"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const prompt = `
    You are a professional translator. 
    Translate the following JSON array of English strings into Simplified Chinese.
    
    CRITICAL RULES:
    1. Output MUST be a valid JSON array of strings.
    2. The number of output strings MUST match the input exactly (${textArray.length} items).
    3. Return raw JSON only. No markdown.
    
    Input:
    ${JSON.stringify(textArray)}
  `;

  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    
    if (data.candidates && data.candidates[0].content) {
      let rawText = data.candidates[0].content.parts[0].text.trim();
      rawText = rawText.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      return JSON.parse(rawText);
    } else {
      throw new Error("模型未返回内容");
    }
  } catch (error) {
    throw error;
  }
}