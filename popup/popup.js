document.getElementById('show-key').addEventListener('click', () => {
  chrome.runtime.sendMessage(
    { action: "getPublicKey" },
    (response) => {
      console.log(response.publicKey);
      const pubKeyOut = document.getElementById('pub-key-out');
      const fingerOut = document.getElementById('finger-out');
      const outputRow = document.getElementsByClassName('output-row');
      for (let i = 0; i < outputRow.length; i++) {
        outputRow[i].style.display = 'block';
      }
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


