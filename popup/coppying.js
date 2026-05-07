
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

function getOutputText(box) {
  // If it still has the 'empty' class, or the text is placeholder
  if (box.classList.contains('empty')) return '';
  return box.textContent.trim();
}

// Click on output boxes directly
document.querySelectorAll('.output-box').forEach(box => {
  box.addEventListener('click', function () {
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

