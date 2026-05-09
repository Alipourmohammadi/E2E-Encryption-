export const ContactManager = {
  async getContact(chatId) {
    return new Promise((resolve) => {
      chrome.storage.local.get([chatId], (result) => {
        resolve(result[chatId] || null);
      });
    });
  },

  async getAllContacts() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        const contacts = [];
        for (const [key, value] of Object.entries(items)) {
          if (value && value.publicKey && value.fingerprint) {
            contacts.push({ chatId: key, ...value });
          }
        }
        resolve(contacts);
      });
    });
  },

  async saveContact(chatId, publicKey, fingerprint, status = 'Unverified') {
    return new Promise((resolve, reject) => {
      if (!chatId || !publicKey) return reject(new Error("Missing required fields"));
      const name = 'unNamed';
      const contactObj = { [chatId]: { name, publicKey, fingerprint, status, autoDecrypt: false } };
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
  async updateContactName(chatId, name) {
    const contact = await this.getContact(chatId);
    if (contact) {
      contact.name = name;
      chrome.storage.local.set({ [chatId]: contact });
    }
  },

  async toggleAutoDecrypt(chatId, enabled) {
    const contact = await this.getContact(chatId);
    if (contact) {
      contact.autoDecrypt = enabled;
      chrome.storage.local.set({ [chatId]: contact });
    }
  },
  async verifyContact(chatId) {
    const contact = await this.getContact(chatId);
    if (contact) {
      contact.status = "verified";
      chrome.storage.local.set({ [chatId]: contact });
    }
  }
};