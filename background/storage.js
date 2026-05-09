export const ContactManager = {
  async getContact(chatId) {
    return new Promise((resolve) => {
      chrome.storage.local.get([chatId], (result) => {
        resolve(result[chatId] || null);
      });
    });
  },

  async saveContact(chatId, publicKey, fingerprint, status = 'Unverified') {
    return new Promise((resolve, reject) => {
      if (!chatId || !publicKey) return reject(new Error("Missing required fields"));
      
      const contactObj = { [chatId]: { publicKey, fingerprint, status, autoDecrypt: false } };
      chrome.storage.local.set(contactObj, () => resolve(true));
    });
  },

  async updateContactStatus(chatId, status) {
    const contact = await this.getContact(chatId);
    if (contact) {
      contact.status = status;
      chrome.storage.local.set({ [chatId]: contact });
    }
  },

  async toggleAutoDecrypt(chatId, enabled) {
    const contact = await this.getContact(chatId);
    if (contact) {
      contact.autoDecrypt = enabled;
      chrome.storage.local.set({ [chatId]: contact });
    }
  }
};