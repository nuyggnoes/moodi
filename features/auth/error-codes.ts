export type AuthErrorCode =
  | "invalid_credentials"
  | "email_exists"
  | "weak_password"
  | "unknown";

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않아요.",
  email_exists: "이미 가입된 이메일이에요.",
  weak_password: "비밀번호는 6자 이상이어야 해요.",
  unknown: "알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
};

export function mapAuthError(message: string): AuthErrorCode {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "invalid_credentials";
  }
  if (normalized.includes("already registered")) {
    return "email_exists";
  }
  if (normalized.includes("password should be at least")) {
    return "weak_password";
  }
  return "unknown";
}
