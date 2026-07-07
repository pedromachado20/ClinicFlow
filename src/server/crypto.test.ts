import { describe, expect, it, beforeEach, vi } from "vitest";

const KEY = "a".repeat(64); // 32 bytes hex

describe("crypto: encryptSecret/decryptSecret", () => {
  beforeEach(() => {
    vi.stubEnv("CONFIG_ENCRYPTION_KEY", KEY);
    vi.resetModules();
  });

  it("round-trips a plaintext secret", async () => {
    const { encryptSecret, decryptSecret } = await import("./crypto");
    const ciphertext = encryptSecret("minha-api-key-super-secreta");
    expect(ciphertext).not.toBe("minha-api-key-super-secreta");
    expect(ciphertext.startsWith("enc:v1:")).toBe(true);
    expect(decryptSecret(ciphertext)).toBe("minha-api-key-super-secreta");
  });

  it("produces different ciphertext for the same plaintext (random IV)", async () => {
    const { encryptSecret } = await import("./crypto");
    const a = encryptSecret("mesmo-valor");
    const b = encryptSecret("mesmo-valor");
    expect(a).not.toBe(b);
  });

  it("passes through legacy plaintext values untouched (pre-encryption data)", async () => {
    const { decryptSecret } = await import("./crypto");
    expect(decryptSecret("valor-antigo-em-texto-puro")).toBe("valor-antigo-em-texto-puro");
  });

  it("returns null for null/undefined/empty input", async () => {
    const { decryptSecret } = await import("./crypto");
    expect(decryptSecret(null)).toBeNull();
    expect(decryptSecret(undefined)).toBeNull();
    expect(decryptSecret("")).toBeNull();
  });

  it("throws if ciphertext was tampered with (auth tag mismatch)", async () => {
    const { encryptSecret, decryptSecret } = await import("./crypto");
    const ciphertext = encryptSecret("valor-original");
    const tampered = ciphertext.slice(0, -4) + "abcd";
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("throws when CONFIG_ENCRYPTION_KEY is missing", async () => {
    vi.stubEnv("CONFIG_ENCRYPTION_KEY", "");
    const { encryptSecret } = await import("./crypto");
    expect(() => encryptSecret("valor")).toThrow(/CONFIG_ENCRYPTION_KEY/);
  });
});
