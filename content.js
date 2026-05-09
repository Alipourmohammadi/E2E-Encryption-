let currentChatId = null;
let messageObserver = null;

// --- 1. Context-Aware Identity Detection ---
function checkChatId() {
  // console.error("works");
  const hash = window.location.hash;
  const match = hash.match(/#c=(.+)/);

  if (match && match[1] !== currentChatId) {
    currentChatId = match[1];
    initSecureSession(currentChatId);
  }
}

async function initSecureSession(chatId) {
  // Query background for contact status
  chrome.runtime.sendMessage({ action: "getContact", chatId }, (contact) => {
    removeInjectedUI(); // Clear previous UI
    // console.error(contact.status);
    // console.error(contact.autoDecrypt);
    if (contact) {
      injectSecureIndicator(contact.status, contact.autoDecrypt);
    } else {
      injectSecureButton();
    }
  });

  startMessageObserver();
}

// --- 2. DOM Injection (UI) ---
function injectSecureIndicator(status, autoDecrypt) {
  // Target the chat header or input area (Adjust selector based on Rubika's DOM)
  const header = document.querySelector('.chat-info-container') || document.body;
  if (!header) return;

  const badge = document.createElement('div');
  badge.id = 'e2e-badge';
  badge.style.cssText = `
    display: inline-flex; align-items: center; gap: 5px; margin-left: 10px;
    padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;
    color: white; background-color: ${autoDecrypt ? '#34c759' : '#ff9500'};
    cursor: pointer; z-index: 1000;
  `;
  badge.textContent = status === 'Secure' ? '🔒 E2EE Secure' : '🔓 E2EE Unverified';

  // Toggle auto-decrypt on click
  badge.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "toggleAutoDecrypt", chatId: currentChatId, enabled: !autoDecrypt });
    initSecureSession(currentChatId); // Refresh UI
  });

  header.appendChild(badge);
  addSecurlySendButton();
}

function injectSecureButton() {
  const header = document.querySelector('.chat-info-container') || document.body;
  if (!header) return;

  const btn = document.createElement('button');
  btn.id = 'e2e-secure-btn';
  btn.className = 'btn-primary'; // Using your existing CSS class
  btn.style.marginLeft = '10px';
  btn.textContent = '🛡️ Secure This Chat';

  btn.addEventListener('click', () => {
    // Broadcast public key
    chrome.runtime.sendMessage({ action: "broadcastHandshake", chatId: currentChatId }, async (response) => {
      await sendMessage(response.payload);
    });
  });

  header.appendChild(btn);
}

function removeInjectedUI() {
  document.getElementById('e2e-badge')?.remove();
  document.getElementById('e2e-secure-btn')?.remove();
  document.getElementById('sec-send-button')?.remove();
}

// --- 3. Automated Contact Discovery (MutationObserver) ---
function startMessageObserver() {
  if (messageObserver) messageObserver.disconnect();

  const chatContainer = document.querySelector('.chats-container') || document.body;

  messageObserver = new MutationObserver(debouncedScan);
  messageObserver.observe(chatContainer, { childList: true, subtree: true });
  scanMessages(); // Initial scan
}

let scanTimeout;
function debouncedScan() {
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(scanMessages, 300); // Prevent performance degradation
}

function scanMessages() {
  // Target Rubika's message text containers
  // const messages = document.querySelectorAll('[rb-message-text] [rb-copyable]:not(.e2e-scanned) ');
  const messages = document.querySelectorAll('.bubble.is-in [rb-message-text] [rb-copyable]:not(.e2e-scanned)');

  messages.forEach(msgNode => {
    msgNode.classList.add('e2e-scanned'); // Mark to avoid re-scanning
    const text = msgNode.textContent.trim();

    // Look for Handshake
    if (text.startsWith('[E2E-HANDSHAKE]')) {
      handleHandshake(text, msgNode);
      return;
    }

    // Look for Encrypted Message (assuming Base64 ends with '=')
    if (text.endsWith('=')) {
      attachEphemeralDecrypt(msgNode, text);
    }
  });
}

// --- 4. Ephemeral Controls & UI Feedback ---
function attachEphemeralDecrypt(node, encryptedText) {
  const decryptIcon = document.createElement('span');
  decryptIcon.textContent = ' 🔐';
  decryptIcon.style.cursor = 'pointer';
  decryptIcon.style.opacity = '0.5';

  decryptIcon.addEventListener('mouseenter', () => decryptIcon.style.opacity = '1');
  decryptIcon.addEventListener('mouseleave', () => decryptIcon.style.opacity = '0.5');

  decryptIcon.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "DecryptMessage", encrypted: encryptedText.replace(/=+$/, '') }, (res) => {
      if (res && res.decrypted) {
        node.textContent = res.decrypted;
        node.style.borderLeft = "3px solid #34c759"; // Visual cue of successful decryption
        node.style.paddingLeft = "5px";
      }
    });
  });

  node.appendChild(decryptIcon);
}

function handleHandshake(text, node) {
  const extractedKey = text.replace('[E2E-HANDSHAKE]', '').trim();

  // Mask the ugly key in the UI
  node.textContent = "🛡️ Public Key Received";
  node.style.color = "#0071e3";

  // Trigger Toast (Assume a function showToast exists in content scope)
  alert("Public Key detected! Verify fingerprint in extension popup to enable E2EE.");

  // Save as unverified
  chrome.runtime.sendMessage({
    action: "saveContact",
    chatId: currentChatId,
    publicKey: extractedKey,
    status: 'Unverified'
  });
}

// Initialize listener
window.addEventListener('hashchange', checkChatId);
// Check immediately on load
checkChatId();
// helper functions:
function addSecurlySendButton() {
  const container = document.querySelector('.chat-input-content');
  if (!container || container.querySelector('.secure-chat-indicator')) return;

  // Find the send button container – this is a stable anchor point
  const sendContainer = container.querySelector('.btn-send-container');
  if (!sendContainer) return; // safety check

  // Create the button
  const secureBtn = document.createElement('button');
  secureBtn.id = 'sec-send-button';
  secureBtn.className = 'btn-icon secure-chat-indicator';
  secureBtn.innerHTML = '🔒';
  secureBtn.title = 'Send Encrypted';
  secureBtn.addEventListener('click', () => {
    const message = getTextInTextArea();
    if (message === '') {
      return;
    }
    chrome.runtime.sendMessage({ action: "EncryptMessage", chatId: currentChatId, message: message }, async (res) => {
      await sendMessage(res.encrypted);
    });
  });
  // Match the existing style from the HTML you shared
  Object.assign(secureBtn.style, {
    background: 'transparent',
    border: 'none',
    fontSize: '20px',
    marginRight: '8px',          // spacing before the send button
    cursor: 'pointer',
    zIndex: '100'
  });

  // Insert before the send container (no re-wrapping)
  container.insertBefore(secureBtn, sendContainer);
}

// send specefic text
async function sendMessage(text) {
  const textArea = document.querySelector('.composer_rich_textarea') || document.body;
  if (!textArea) {
    console.warn('Send button not found');
    return;
  }
  textArea.focus();
  textArea.click();
  // Dispatch a paste-like input
  const dataTransfer = new DataTransfer();
  dataTransfer.setData('text/plain', "");

  const pasteEvent = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
    clipboardData: dataTransfer
  });
  textArea.dispatchEvent(pasteEvent);
  // put the publickey
  textArea.textContent = text;

  // Wait for UI to react
  await new Promise(r => setTimeout(r, 100));

  // Click send button
  // Find the send button using its most specific class
  const sendRipple = document.querySelector('button.btn-send .c-ripple');
  if (sendRipple) {
    sendRipple.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
}

function getTextInTextArea() {
  const textArea = document.querySelector('.composer_rich_textarea') || document.body;
  if (!textArea) {
    console.warn('textArea not found');
    return;
  }
  return textArea.textContent;
}