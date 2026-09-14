import { mapAuthError } from "./error-codes";

describe("mapAuthError", () => {
  it.each([
    ["Invalid login credentials", "invalid_credentials"],
    ["User already registered", "email_exists"],
    ["Password should be at least 6 characters", "weak_password"],
    ["Something totally unexpected happened", "unknown"],
  ] as const)("%s -> %s", (message, expected) => {
    expect(mapAuthError(message)).toBe(expected);
  });
});
