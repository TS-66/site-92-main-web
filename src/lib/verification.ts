// Shared in-memory verification code store
const verificationCodes: Record<string, string> = {};

export function setCode(username: string, code: string) {
  verificationCodes[username.toLowerCase()] = code;
}

export function verifyCode(username: string, code: string): boolean {
  const lower = username.toLowerCase();
  if (verificationCodes[lower] && verificationCodes[lower] === code) {
    delete verificationCodes[lower];
    return true;
  }
  return false;
}

export function hasCode(username: string): boolean {
  return !!verificationCodes[username.toLowerCase()];
}