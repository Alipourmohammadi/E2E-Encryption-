# Simple E2E Bridge

🔐 Add end‑to‑end encryption to your Rubika web messenger — fast, lightweight, and fully client‑side.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- **Automatic handshake** – Detects public keys from other E2E Bridge users and stores them securely.
- **One‑click encryption** – Send encrypted messages directly from the chat input.
- **Seamless decryption** – Encrypted messages are visually marked; decrypt with a single click or enable **auto‑decrypt** per contact.
- **Contact manager** – View, name, verify, and manage all your secure contacts.
- **Manual mode** – Encrypt/decrypt arbitrary messages using your own key or a recipient’s public key.
- **Fingerprint verification** – Verify contact identities through a short, human‑readable fingerprint.
- **No external servers** – All cryptography happens in your browser; keys are stored in Chrome’s local storage.

---

## 🧠 How It Works

Simple E2E Bridge uses **ECDH (P‑256) + AES‑256‑GCM** hybrid encryption:

1. On first launch, the extension generates an ECDH key pair and stores it locally.
2. When you initiate a secure chat, your public key is sent as a special `[E2E-HANDSHAKE]` message.
3. The other party stores your key; they can then encrypt messages using the shared ECDH secret.
4. Each message is encrypted with a fresh symmetric key, which is wrapped with the shared secret and sent alongside the ciphertext.
5. The receiving extension automatically unwraps the symmetric key and decrypts the message (or shows a 🔐 icon waiting for your click).

---

## 📦 Installation (Manual, from ZIP)

1. **Download the repository**  
   Click the green `<> Code` button on the GitHub page and choose `Download ZIP`.  
   Extract the downloaded `.zip` file to a folder on your computer.

2. **Open Chrome Extensions page**  
   In Chrome, navigate to `chrome://extensions` or click the puzzle icon → “Manage extensions”.

3. **Enable Developer mode**  
   Toggle the **Developer mode** switch in the top‑right corner.

4. **Load the extension**  
   Click the **Load unpacked** button.  
   Select the folder where you extracted the repository (it should contain `manifest.json` directly inside).

5. **Confirm installation**  
   The “Simple E2E Bridge” extension should now appear in your list.  
   You can pin it to the toolbar for quick access.

---

## 🚀 Usage

### 1. Secure a chat
- Open [web.rubika.ir](https://web.rubika.ir) and select a chat.
- If the chat is not yet secured, you’ll see a **🛡️ Secure This Chat** button in the header.
- Click it to broadcast your public key. The other party will automatically receive it if they also use the extension.

### 2. Send an encrypted message
- Once both sides have exchanged keys, a **🔒 Send Encrypted** button appears next to the chat input.
- Type your message and click 🔒 to send it encrypted.
- Your own sent messages are also encrypted and can be decrypted for verification.

### 3. Decrypt incoming messages
- Encrypted messages show a small **🔐** icon.
- **Click the icon** to decrypt and read the message.
- To always decrypt automatically, open the extension popup, go to the **Auto** tab, find the contact, and toggle **Auto‑Decrypt ON**.

### 4. Manage contacts
- Click the extension icon to open the popup.
- The **Auto** tab shows your active chat and a list of all saved contacts.
- You can rename contacts, verify their fingerprints, toggle auto‑decrypt, or delete them.

### 5. Verify a contact
- In the contact list, click **Verify**.  
- Compare the displayed fingerprint with the one the other person sees in their extension popup under **Your Public Key** → **Fingerprint**.  
- If they match, the contact becomes **verified** (green badge).

### 6. Manual encryption / decryption
- In the popup, switch to **Manual** mode.
- You can see your own public key and fingerprint, encrypt a message for any public key, or decrypt any message encrypted with your key.

---

## 🔒 Security Considerations

- **Keys never leave your browser** – Your private key is stored in Chrome’s local storage and is never sent to any server.
- **Hybrid encryption** – Each message uses a fresh AES‑256 key, preventing bulk compromise.
- **Fingerprint verification** – Protects against man‑in‑the‑middle attacks; always verify fingerprints with trusted channels.
- **Limitations**  
  - The extension only works on `https://web.rubika.ir`.  
  - It does not hide metadata (who you chat with, timestamps).  
  - Rubika’s own servers can see that an encrypted message was sent, but not its content.

---

## 🔧 Permissions Explained

| Permission | Why |
|-----------|------|
| `storage` | Store your key pair and contacts locally. |
| `tabs`    | Detect the active chat ID from the URL. |
| `scripting` & `activeTab` | Inject the encryption UI into Rubika’s page. |
| `host_permissions: https://web.rubika.ir/*` | Run content script only on Rubika. |

No other permissions are requested.

---

## 🧩 Project Structure

```
simple-e2e-bridge/
├── manifest.json          # Chrome extension manifest
├── content.js             # Injected into Rubika: UI, handshake, decryption
├── background.js          # Message routing & crypto operations
├── crypto.js              # Encrypt / decrypt using Web Crypto API
├── keyManger.js           # Key generation, caching, fingerprint
├── storage.js             # Contact storage (name, key, fingerprint, status)
├── utils.js               # Base64 <-> buffer, key packing
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup logic (manual & auto tabs)
│   ├── style.css          # Styling
│   ├── UI.js              # Contact list rendering, toggle/verify actions
│   └── coppying.js        # Copy-to-clipboard functionality
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🛠️ Contributing

Pull requests are welcome! If you find a bug or have an idea, please open an issue.  
Make sure to test changes on the actual Rubika web interface.

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

**Happy secure chatting!** 🚀🔒
