document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const modelSelect = document.getElementById('modelSelect');
  const msg = document.getElementById('msg');

  // --- 初始化：加载保存的 Key 和 模型 ---
  chrome.storage.local.get(['geminiKey', 'selectedModel', 'cachedModels'], (res) => {
    if (res.geminiKey) apiKeyInput.value = res.geminiKey;
    
    // 如果有缓存的模型列表，先填进去
    if (res.cachedModels && res.cachedModels.length > 0) {
      populateModelSelect(res.cachedModels, res.selectedModel);
    }
  });

  // --- 辅助函数：显示消息 ---
  function showMsg(text, color = 'black') {
    msg.textContent = text;
    msg.style.color = color;
    setTimeout(() => msg.textContent = '', 3000);
  }

  // --- 1. 保存 Key ---
  document.getElementById('saveKeyBtn').addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) return showMsg("Key 不能为空", "red");
    chrome.storage.local.set({ geminiKey: key }, () => showMsg("Key 已保存", "green"));
  });

  // --- 2. 刷新模型列表 ---
  document.getElementById('refreshModelsBtn').addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) return showMsg("请先填入 API Key", "red");

    modelSelect.innerHTML = "<option>加载中...</option>";
    
    chrome.runtime.sendMessage({ action: "get_models", key: key }, (response) => {
      if (response && response.models) {
        // 保存列表缓存
        chrome.storage.local.set({ cachedModels: response.models });
        populateModelSelect(response.models);
        showMsg("模型列表已更新", "green");
      } else {
        modelSelect.innerHTML = "<option>获取失败</option>";
        showMsg("获取失败: " + (response.error || "未知"), "red");
      }
    });
  });

  // --- 填充下拉框 ---
  function populateModelSelect(models, savedSelection = null) {
    modelSelect.innerHTML = "";
    models.forEach(m => {
      const option = document.createElement('option');
      option.value = m;
      option.textContent = m;
      // 默认选中 Lite 或 Flash
      if (savedSelection && m === savedSelection) {
        option.selected = true;
      } else if (!savedSelection && (m.includes('lite') || m.includes('flash'))) {
        // 智能默认：优先选 Lite
        if(m.includes('lite')) option.selected = true;
      }
      modelSelect.appendChild(option);
    });
    
    // 监听选择变化并保存
    modelSelect.addEventListener('change', () => {
      chrome.storage.local.set({ selectedModel: modelSelect.value });
    });
    
    // 触发一次保存，确保默认值被记录
    if(modelSelect.value) chrome.storage.local.set({ selectedModel: modelSelect.value });
  }

  // --- 3. 发送翻译指令 ---
  document.getElementById('runBtn').addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;

    if (!key) return showMsg("缺 API Key", "red");
    if (!model) return showMsg("请先选择一个模型", "red");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 发送 Key 和 Model 给 content.js
    chrome.tabs.sendMessage(tab.id, { 
      action: "start_translate", 
      key: key, 
      model: model 
    }, (response) => {
      if (chrome.runtime.lastError) {
        showMsg("请刷新网页后再试", "red");
      } else {
        showMsg("开始翻译...", "green");
        window.close(); // 关闭弹窗
      }
    });
  });
});