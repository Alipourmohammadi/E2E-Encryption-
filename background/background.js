
import { encryptMessage, decryptMessage } from './crypto.js';
import { ensureKeyPair, computeFingerprint } from './keyManger.js';
import { packPublicKey, unPackPublicKey } from './utils.js';
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
      const publicKeyCryptoKey = await unPackPublicKey(request.recipientPublicKey);
      console.log(publicKeyCryptoKey);
      
      encryptMessage(request.message,publicKeyCryptoKey ).then(encrypted => {
        sendResponse({ encrypted: encrypted });
        console.log(encrypted);
      });
    })();
    return true;
  }
});

