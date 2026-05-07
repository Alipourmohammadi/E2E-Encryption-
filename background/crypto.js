import { B64ToBuf, bufToB64 } from './utils.js';
import { ensureKeyPair } from './keyManger.js';

export async function encryptMessage(message, publicKey) {
  const keypair = await ensureKeyPair();

  const symKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,               // extractable because we need to wrap it
    ["encrypt"]
  );
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    symKey,
    new TextEncoder().encode(message)
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    keypair.privateKey,
    256
  );
  const wrapKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    { name: "AES-GCM", length: 256 },
    false,
    ["wrapKey"]
  );
  const wrapNonce = crypto.getRandomValues(new Uint8Array(12));
  const wrappedKey = await crypto.subtle.wrapKey(
    "raw",
    symKey,
    wrapKey,
    { name: "AES-GCM", iv: wrapNonce }
  );
  const rawSenderPub = await crypto.subtle.exportKey("raw", keypair.publicKey);

  // Pack everything
  const packed = packEncrypted(
    1,
    rawSenderPub,
    wrappedKey,   // already an ArrayBuffer from wrapKey
    wrapNonce,    // Uint8Array(12), can be passed directly
    nonce,        // Uint8Array(12)
    ct            // ArrayBuffer from encrypt
  );
  return packed;
}

export async function decryptMessage(encryptedB64) {
  const { version, senderPubRaw, wrappedKey, wrapNonce, nonce, ciphertext } = unpackEncrypted(encryptedB64);
  console.log(senderPubRaw);
  const SendersKey = await crypto.subtle.importKey(
    "raw",
    senderPubRaw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const myKeypair = await ensureKeyPair();
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: SendersKey },
    myKeypair.privateKey,
    256
  );
  const unwrapKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    { name: "AES-GCM", length: 256 },
    false,
    ["unwrapKey"]
  );
  const symKey = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKey,
    unwrapKey,
    { name: "AES-GCM", iv: wrapNonce },
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    symKey,
    ciphertext
  );
  return new TextDecoder().decode(plainBuf);
}

function packEncrypted(version, rawSenderPub, wrappedKeyBuf, wrapNonceBuf, nonceBuf, ctBuf) {
  const wkLen = wrappedKeyBuf.byteLength;
  const ctLen = ctBuf.byteLength;
  const total = 1 + 65 + 2 + wkLen + 12 + 12 + 2 + ctLen;
  const buf = new Uint8Array(total);
  let offset = 0;
  buf[offset++] = version;
  buf.set(new Uint8Array(rawSenderPub), offset); offset += 65;
  buf[offset++] = (wkLen >> 8) & 0xFF;   // big-endian length
  buf[offset++] = wkLen & 0xFF;
  buf.set(new Uint8Array(wrappedKeyBuf), offset); offset += wkLen;
  buf.set(new Uint8Array(wrapNonceBuf), offset); offset += 12;
  buf.set(new Uint8Array(nonceBuf), offset); offset += 12;
  buf[offset++] = (ctLen >> 8) & 0xFF;
  buf[offset++] = ctLen & 0xFF;
  buf.set(new Uint8Array(ctBuf), offset);
  return bufToB64(buf.buffer);
}
function unpackEncrypted(b64) {
    const buf = new Uint8Array(B64ToBuf(b64));
    let offset = 0;
    const version = buf[offset++];
    const senderPubRaw = new Uint8Array(buf.slice(offset, offset + 65)).buffer; offset += 65;
    const wkLen = (buf[offset] << 8) | buf[offset + 1]; offset += 2;
    const wrappedKey = new Uint8Array(buf.slice(offset, offset + wkLen)).buffer; offset += wkLen;
    const wrapNonce = new Uint8Array(buf.slice(offset, offset + 12)).buffer; offset += 12;
    const nonce = new Uint8Array(buf.slice(offset, offset + 12)).buffer; offset += 12;
    const ctLen = (buf[offset] << 8) | buf[offset + 1]; offset += 2;
    const ciphertext = new Uint8Array(buf.slice(offset, offset + ctLen)).buffer;
    return { version, senderPubRaw, wrappedKey, wrapNonce, nonce, ciphertext };
}