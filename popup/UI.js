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
      const message = await findMessagesEndingWithEqualsInTab(result, tab.id);
      // console.error(message);
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

// Function to fetch and display all contacts
async function loadAllContacts() {
  const contactsContainer = document.getElementById('contacts-list');
  if (!contactsContainer) return;

  contactsContainer.innerHTML = '<div class="placeholder">Loading...</div>';

  try {
    const response = await chrome.runtime.sendMessage({ action: "getAllContacts" });
    const contacts = response.contacts || [];

    if (contacts.length === 0) {
      contactsContainer.innerHTML = '<div class="placeholder">No contacts yet. Secure a chat to add.</div>';
      return;
    }

    contactsContainer.innerHTML = '';

    for (const contact of contacts) {
      const contactDiv = document.createElement('div');
      contactDiv.className = 'contact-item';
      contactDiv.dataset.chatId = contact.chatId;

      const statusClass = contact.status === 'verified' ? 'status-secure' : 'status-pending';
      const statusText = contact.status === 'verified' ? '✓ verified' : '⌛ Pending';
      const displayVerify = contact.status === 'verified' ? 'none' : 'block';
      const autoDecryptClass = contact.autoDecrypt ? 'on' : 'off';
      const autoDecryptText = contact.autoDecrypt ? 'ON' : 'OFF';

      // Use saved name if exists, otherwise show chatId as placeholder
      const displayName = contact.name || contact.chatId;

      contactDiv.innerHTML = `
        <div class="contact-header">
          <input type="text" class="contact-name-field" value="${escapeHtml(displayName)}" data-field="name" placeholder="Contact name">
          <button class="contact-btn save-name-btn" data-action="saveName">💾 Save</button>
        </div>
        <div class="contact-chat-id-small">ID: ${escapeHtml(contact.chatId)}</div>
        <div class="contact-fingerprint">FP: ${escapeHtml(contact.fingerprint)}</div>
        <div class="contact-status ${statusClass}">${statusText}</div>
        <div class="contact-actions">
          <button class="contact-btn toggle-btn ${autoDecryptClass}" data-action="toggleAutoDecrypt">Auto-Decrypt: ${autoDecryptText}</button>
          <button class="contact-btn verify-btn" data-action="verifyContact" style="display:${displayVerify}">Verify</button>
        </div>
      `;

      // Add event listeners for buttons inside this contact
      const saveNameBtn = contactDiv.querySelector('[data-action="saveName"]');
      const nameInput = contactDiv.querySelector('.contact-name-field');
      const toggleBtn = contactDiv.querySelector('[data-action="toggleAutoDecrypt"]');
      const verifyBtn = contactDiv.querySelector('[data-action="verifyContact"]');

      saveNameBtn.addEventListener('click', () => chrome.runtime.sendMessage({ action: "updateContactName", chatId: contact.chatId, name: nameInput.value }));
      toggleBtn.addEventListener('click', () => toggleAutoDecrypt(contact.chatId, !contact.autoDecrypt, toggleBtn));
      verifyBtn.addEventListener('click', () => verifyContact(contact.chatId, verifyBtn));

      contactsContainer.appendChild(contactDiv);
    }
  } catch (error) {
    console.error('Failed to load contacts:', error);
    contactsContainer.innerHTML = '<div class="placeholder">Error loading contacts.</div>';
  }
}

// Helper to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Load contacts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadAllContacts();

  const refreshBtn = document.getElementById('refresh-contacts-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadAllContacts);
  }
});

async function toggleAutoDecrypt(chatId, newState, buttonElement) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "toggleAutoDecrypt",
      chatId,
      enabled: newState
    });
    if (response.success) {
      // Update button appearance without full reload
      buttonElement.textContent = `Auto-Decrypt: ${newState ? 'ON' : 'OFF'}`;
      buttonElement.className = `contact-btn toggle-btn ${newState ? 'on' : 'off'}`;
    } else {
      console.error("Toggle failed:", response.error);
    }
  } catch (err) {
    console.error(err);
  }
}

async function verifyContact(chatId, buttonElement) {
  buttonElement.textContent = "Verifying...";
  buttonElement.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({
      action: "verifyContact",
      chatId
    });
    if (response.success) {
      alert(`Verification ${response.verified ? 'successful' : 'failed'}. ${response.message || ''}`);
      loadAllContacts(); // refresh to update status
    } else {
      alert("Verification error: " + response.error);
    }
  } catch (err) {
    console.error(err);
    alert("Error verifying contact");
  } finally {
    buttonElement.textContent = "Verify";
    buttonElement.disabled = false;
  }
}