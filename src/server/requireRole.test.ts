import { describe, expect, it } from "vitest";
import { requireRole, ADMIN_ROLES, CLINICAL_ROLES, ALL_ROLES, type UserRole } from "./context";

describe("requireRole", () => {
  it("allows a role present in the allowed list", () => {
    expect(() => requireRole("owner", ADMIN_ROLES)).not.toThrow();
    expect(() => requireRole("admin", ADMIN_ROLES)).not.toThrow();
  });

  it("rejects a role not present in the allowed list", () => {
    expect(() => requireRole("recepcionista", ADMIN_ROLES)).toThrow(/Permissão negada/);
    expect(() => requireRole("medico", ADMIN_ROLES)).toThrow(/Permissão negada/);
  });

  it("rejects null/undefined role (unauthenticated or role-less user)", () => {
    expect(() => requireRole(null, ADMIN_ROLES)).toThrow(/Permissão negada/);
    expect(() => requireRole(undefined, ADMIN_ROLES)).toThrow(/Permissão negada/);
  });

  it("CLINICAL_ROLES includes medico but not recepcionista", () => {
    expect(() => requireRole("medico", CLINICAL_ROLES)).not.toThrow();
    expect(() => requireRole("recepcionista", CLINICAL_ROLES)).toThrow();
  });

  it("recepcionista only passes against ALL_ROLES, never ADMIN_ROLES or CLINICAL_ROLES", () => {
    expect(() => requireRole("recepcionista", ALL_ROLES)).not.toThrow();
    expect(() => requireRole("recepcionista", ADMIN_ROLES)).toThrow();
    expect(() => requireRole("recepcionista", CLINICAL_ROLES)).toThrow();
  });

  it("an unrecognized role string is always rejected, even against ALL_ROLES", () => {
    expect(() => requireRole("hacker" as UserRole, ALL_ROLES)).toThrow();
  });
});
