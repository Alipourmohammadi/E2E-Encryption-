document.getElementById('show-key').addEventListener('click', () => {
  chrome.runtime.sendMessage(
    { action: "getPublicKey" },
    (response) => {
      console.log(response.publicKey);
      const pubKeyOut = document.getElementById('pub-key-out');
      const fingerOut = document.getElementById('finger-out');

      pubKeyOut.textContent = response.publicKey;
      fingerOut.textContent = JSON.stringify(response.fingerprint, null, 2);


      pubKeyOut.classList.remove('empty');
      fingerOut.classList.remove('empty');
    }
  );
});

document.getElementById('Encrypt-key').addEventListener('click', () => {
  const message = document.getElementById('message').value;
  const publicKey = document.getElementById('publickey').value;
  chrome.runtime.sendMessage(
    { action: "EncryptMessage", message, recipientPublicKey: publicKey },
    (response) => {
      console.log(response);
      const encOut = document.getElementById('encryption');
      encOut.textContent = response.encrypted;
      encOut.classList.remove('empty');
    }
  );
});

document.getElementById('Decrypt-key').addEventListener('click', () => {
  const encrypted = document.getElementById('encrypted-message').value;
  chrome.runtime.sendMessage(
    { action: "DecryptMessage", encrypted },
    (response) => {
      console.log(response);
      const decOut = document.getElementById('decryption');
      decOut.textContent = response.decrypted;
      decOut.classList.remove('empty');
    }
  );
});


(function() {
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 1500);
  }

  function copyToClipboard(text) {
    if (!text) return false;
    try {
      navigator.clipboard.writeText(text).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function markCopied(btn) {
    const originalHTML = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '✓ Copied';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = originalHTML;
    }, 1500);
  }

  function getOutputText(box) {
    // If it still has the 'empty' class, or the text is placeholder
    if (box.classList.contains('empty')) return '';
    return box.textContent.trim();
  }

  function handleCopy(targetId, btnElement) {
    const box = document.getElementById(targetId);
    if (!box) return;
    const text = getOutputText(box);
    if (!text) {
      showToast('Nothing to copy');
      return;
    }
    const success = copyToClipboard(text);
    if (success) {
      showToast('Copied!');
      if (btnElement) markCopied(btnElement);
    } else {
      showToast('Copy failed');
    }
  }

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const targetId = this.getAttribute('data-target');
      if (targetId) handleCopy(targetId, this);
    });
  });

  // Click on output boxes directly
  document.querySelectorAll('.output-box').forEach(box => {
    box.addEventListener('click', function() {
      const text = getOutputText(this);
      if (!text) {
        showToast('Nothing to copy');
        return;
      }
      const success = copyToClipboard(text);
      if (success) {
        showToast('Copied!');
        this.style.background = '#e6f7ed';
        this.style.borderColor = '#34c759';
        setTimeout(() => {
          this.style.background = '';
          this.style.borderColor = '';
        }, 600);
      } else {
        showToast('Copy failed');
      }
    });
  });
})();