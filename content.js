console.log("Content Script: v4.1 重试修复版已加载");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_translate") {
    processTranslation(request.key, request.model);
    sendResponse({ status: "started" });
  }
});

async function processTranslation(apiKey, modelName) {
  // === 0. 关键修复：重置失败的任务 ===
  // 在开始新一轮扫描前，先检查页面上有没有上次失败的红字报错
  // 如果有，把它们清理干净，让程序能再次选中它们
  const failedNodes = document.querySelectorAll('[data-translated="true"]');
  failedNodes.forEach(node => {
    const lastChild = node.lastElementChild;
    // 检查标准：如果最后一个元素是我们的状态框，且内容包含“❌”
    if (lastChild && lastChild.innerText.includes("❌")) {
      node.removeChild(lastChild); // 移除旧的报错文字
      node.removeAttribute('data-translated'); // 撕掉“已翻译”标签
    }
  });

  // === 1. 正常的筛选逻辑 ===
  const allElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, li, blockquote'));
  
  const validNodes = allElements.filter(el => {
    if (el.offsetParent === null) return false;
    const text = el.innerText.trim();
    // 现在，之前失败的节点因为移除了属性，会重新进入这里
    return text.length >= 5 && !el.getAttribute('data-translated');
  });

  if (validNodes.length === 0) {
    alert("没有发现可翻译的新内容（如果之前报错，请确认报错信息已被清除）");
    return;
  }

  // === 2. 提取纯净文本 & UI 初始化 ===
  const nodeData = validNodes.map(node => ({
    element: node,
    originalText: node.innerText.trim(), // 锁定原文
    statusDiv: null
  }));

  nodeData.forEach(item => {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = "color: #999; font-size: 12px; margin-top: 5px; border-left: 2px solid #ddd; padding-left: 5px;";
    statusDiv.innerText = "⏳ 准备中...";
    
    item.element.appendChild(statusDiv);
    item.element.setAttribute('data-translated', 'true');
    item.statusDiv = statusDiv;
  });

  // === 3. 动态分包 ===
  const MAX_CHARS = 4000; 
  const batches = [];
  let currentBatch = [];
  let currentLength = 0;

  for (let item of nodeData) {
    const textLen = item.originalText.length;
    if (currentLength + textLen > MAX_CHARS && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLength = 0;
    }
    currentBatch.push(item);
    currentLength += textLen;
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  console.log(`使用模型: ${modelName}, 共 ${batches.length} 批`);

  // === 4. 执行翻译 ===
  for (let i = 0; i < batches.length; i++) {
    const batchItems = batches[i];
    const textArray = batchItems.map(item => item.originalText);

    // 更新状态：翻译中
    batchItems.forEach(item => {
      item.statusDiv.innerText = `🚀 ${modelName} 翻译中...`;
      item.statusDiv.style.color = "#e67e22";
    });

    try {
      const response = await chrome.runtime.sendMessage({
        action: "call_gemini_api_batch",
        texts: textArray,
        key: apiKey,
        model: modelName
      });

      if (response && response.results) {
        // 成功：回填结果
        batchItems.forEach((item, idx) => {
          const resultText = response.results[idx];
          if (resultText) {
            const div = item.statusDiv;
            div.innerHTML = resultText.replace(/\n/g, '<br>');
            div.style.color = "#222";
            div.style.borderLeft = "3px solid #009688";
            div.style.background = "#e0f2f1";
            div.style.padding = "8px";
            div.style.borderRadius = "4px";
          } else {
            item.statusDiv.innerText = "⚠️ 翻译丢失";
          }
        });
      } else {
        throw new Error(response.error || "未知错误");
      }
    } catch (err) {
      console.error(err);
      // 失败：显示红字（关键：要有 ❌ 符号，以便下次重试时被识别）
      batchItems.forEach(item => {
        item.statusDiv.innerText = "❌ " + err.message;
        item.statusDiv.style.color = "red";
      });
    }

    // 智能防封等待
    if (i < batches.length - 1) {
      const waitTime = modelName.includes('lite') ? 6500 : 2000;
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
}