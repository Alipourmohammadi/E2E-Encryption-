let cachedKeyPair = null;

export async function ensureKeyPair() {
  if (cachedKeyPair) return cachedKeyPair;
  const { keyPair } = await chrome.storage.local.get("keyPair");
  if (keyPair) {
    const privateKey = await crypto.subtle.importKey(
      'jwk', keyPair.privateKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits']
    );
    const publicKey = await crypto.subtle.importKey(
      'jwk', keyPair.publicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );
    cachedKeyPair = { privateKey, publicKey, publicJwk: keyPair.publicKey };
    return cachedKeyPair;
  } else {
    console.log("No key pair found, generating new one...");
    return generateKeyPair().then(pair => pair);
  }


}

export async function computeFingerprint(publicJwk) {
  const raw = `${publicJwk.kty}:${publicJwk.crv}:${publicJwk.x}:${publicJwk.y}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // Return first 16 characters for a short fingerprint
  return hex.substring(0, 16);
}

async function generateKeyPair() {
  console.log("Generating key pair...");
  const newKeyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    ["deriveBits"]      // private key usages
  );
  const jwkPublic = await crypto.subtle.exportKey("jwk", newKeyPair.publicKey);
  const jwkPrivate = await crypto.subtle.exportKey("jwk", newKeyPair.privateKey);
  const Pair = { publicKey: jwkPublic, privateKey: jwkPrivate };
  saveKeyPair(Pair);
  cachedKeyPair = { privateKey: newKeyPair.privateKey, publicKey: newKeyPair.publicKey, publicJwk: jwkPublic };
  return cachedKeyPair;
}

function saveKeyPair(keypair) {
  chrome.storage.local.set({ keyPair: keypair }, () => {
    console.log("Saved keys!");
  });
}
