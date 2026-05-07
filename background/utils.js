export function bufToB64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

export function B64ToBuf(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function packPublicKey(publicKey) {
  const rawPub = await crypto.subtle.exportKey("raw", publicKey);
  return bufToB64(rawPub);
}
export async function unPackPublicKey(packedKey) {
  const rawPub = B64ToBuf(packedKey);
  const publicKeyCryptoKey = await crypto.subtle.importKey(
    "raw",
    rawPub,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  return publicKeyCryptoKey
}