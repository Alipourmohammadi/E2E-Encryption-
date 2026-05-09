
import { encryptMessage, decryptMessage } from './crypto.js';
import { ensureKeyPair, computeFingerprint } from './keyManger.js';
import { packPublicKey, unPackPublicKey } from './utils.js';
import { ContactManager } from './storage.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log("E2E Bridge installed!");
});

console.log("Background script running.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPublicKey") {
    (async () => {
      const kp = await ensureKeyPair();
      const fingerprint = await computeFingerprint(kp.publicJwk);
      const shortKeyString = await packPublicKey(kp.publicKey);
      sendResponse({ publicKey: shortKeyString, fingerprint });
    })();
    return true;
  }
  else if (request.action === "DecryptMessage") {
    decryptMessage(request.encrypted).then(decrypted => {
      sendResponse({ decrypted: decrypted });
      console.log(decrypted);
    });
    return true;
  } else if (request.action === "EncryptMessage") {
    (async () => {
      let recipientPublicKey = request.recipientPublicKey;
      if (request.chatId) {
        await ContactManager.getContact(request.chatId).then((contact) => recipientPublicKey = contact.publicKey);
      }
      const publicKeyCryptoKey = await unPackPublicKey(recipientPublicKey);
      console.log(publicKeyCryptoKey);

      encryptMessage(request.message, publicKeyCryptoKey).then(encrypted => {
        sendResponse({ encrypted: encrypted });
        console.log(encrypted);
      });
    })();
    return true;
  } else if (request.action === "getContact") {
    ContactManager.getContact(request.chatId).then(sendResponse);
    return true;
  } else if (request.action === "getAllContacts") {
    ContactManager.getAllContacts().then(contacts => sendResponse({ contacts }));
    return true;
  } else if (request.action === "saveContact") {
    // Generate fingerprint for out-of-band verification
    unPackPublicKey(request.publicKey)
      .then(cryptoKey => computeFingerprint(cryptoKey))
      .then(fingerprint => {
        const shortFingerprint = fingerprint.substring(0, 16); // Truncated SHA-256
        return ContactManager.saveContact(request.chatId, request.publicKey, shortFingerprint);
      })
      .then(() => sendResponse({ success: true }))
      .catch(e => {
        console.error("Key saving failed", e);
        sendResponse({ success: false, error: e.message });
      });
    return true;
  } else if (request.action === "broadcastHandshake") {
    ensureKeyPair()
      .then(kp => packPublicKey(kp.publicKey))
      .then(shortKeyString => {
        const handshakePayload = `[E2E-HANDSHAKE]${shortKeyString}`;
        sendResponse({ payload: handshakePayload });
      });
    return true;
  } else if (request.action === "toggleAutoDecrypt") {
    ContactManager.toggleAutoDecrypt(request.chatId, request.enabled).then(() => {
      console.log('toggled');
      sendResponse({ success: true });
    })
    return true;
  } else if (request.action === "verifyContact") {
    ContactManager.verifyContact(request.chatId).then(() => {
      console.log('verification!');
      sendResponse({ success: true, verified: true });
    })
    return true;
  } else if (request.action === "updateContactName") {
    ContactManager.updateContactName(request.chatId, request.name).then(() => {
      console.log('name updated!');
      sendResponse({ success: true });
    })
    return true;
  } else if (request.action === "deleteContact") {
    const { chatId } = request;
    ContactManager.deleteContact(chatId)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  } else if (request.action === "EncryptMessageToSend") {
    (async () => {
      let recipientPublicKey = request.recipientPublicKey;
      if (request.chatId) {
        await ContactManager.getContact(request.chatId).then((contact) => recipientPublicKey = contact.publicKey);
      }
      const publicKeyCryptoKey = await unPackPublicKey(recipientPublicKey);
      console.log(publicKeyCryptoKey);

      const message1 = await encryptMessage(request.message, publicKeyCryptoKey);
      const kp = await ensureKeyPair();
      const message2 = await encryptMessage(request.message, kp.publicKey);
      sendResponse({ encrypted: `${message1}[E2E-SENT]${message2}` });

    })();
    return true;
  }
});

