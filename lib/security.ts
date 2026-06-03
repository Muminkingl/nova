function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SECRET = process.env.SESSION_SECRET || "default_unsafe_session_secret_key_change_me_in_production";

/**
 * Signs a value using HMAC-SHA256 with the SESSION_SECRET.
 * Returns the format: value.signatureHex
 */
export async function signValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET);
  const data = encoder.encode(value);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const signatureHex = bufferToHex(signature);
  return `${value}.${signatureHex}`;
}

/**
 * Verifies the HMAC-SHA256 signature of a value.
 * Returns the original value if signature is valid, or null if invalid/tampered.
 */
export async function verifyValue(signedValue: string | undefined): Promise<string | null> {
  if (!signedValue || !signedValue.includes(".")) {
    return null;
  }

  const parts = signedValue.split(".");
  const value = parts[0];
  const signatureHex = parts[1];

  if (!value || !signatureHex) {
    return null;
  }

  const expectedSigned = await signValue(value);
  const expectedSignatureHex = expectedSigned.split(".")[1];

  if (signatureHex === expectedSignatureHex) {
    return value;
  }

  return null;
}
