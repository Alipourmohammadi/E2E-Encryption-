let tabToggle = true;
document.getElementById('toggle-manual').addEventListener('click', () => {
  const toggleButton = document.getElementById('toggle-manual');
  const manualTab = document.getElementById("manual-tab");
  const autoTab = document.getElementById("auto-tab");
  console.log("hoy");
  if (tabToggle) {
    toggleButton.textContent = 'Auto'
    manualTab.style.display = 'block';
    autoTab.style.display = 'none';
  } else {
    toggleButton.textContent = 'Manual'
    manualTab.style.display = 'none';
    autoTab.style.display = 'block';
  }
  tabToggle = !tabToggle
});

async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

getCurrentTab().then(async tab => {
  // Check if URL contains https://web.rubika.ir/
  if (tab.url && tab.url.includes('web.rubika.ir')) {
    // const section = document.getElementById('auto-tab-section');
    const section = document.getElementById('auto-tab-section');
    section.textContent = 'right on!';
    if (tab.url.includes('#c=')) {
      const startPart = "#c=";
      const startIndex = tab.url.indexOf(startPart) + startPart.length;
      const result = tab.url.substring(startIndex);
      section.textContent = result;
      const message = await findMessagesEndingWithEqualsInTab(result,tab.id);
      console.error(message);
      section.textContent = message;
    }
  }
});
async function findMessagesEndingWithEqualsInTab(chatId, tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (chatId) => {
      // This code runs inside the tab, so 'document' is the tab's DOM
      const chatContainer = document.getElementById(chatId);
      
      if (!chatContainer) return [];
      
      const messageGroups = chatContainer.querySelectorAll('.bubbles-group');
      const results = [];
      
      messageGroups.forEach(group => {
        const textElement = group.querySelector('[rb-message-text] [rb-copyable]');
        
        if (textElement) {
          const messageText = textElement.textContent.trim();
          
          if (messageText.endsWith('=')) {
            results.push({
              msgId: group.getAttribute('data-msg-id'),
              text: messageText
            });
          }
        }
      });
      
      return results;
    },
    args: [chatId]
  });
  
  return results[0].result;
}