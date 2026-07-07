import { describe, expect, it, vi, beforeEach } from "vitest";

const findFirstPatients = vi.fn();
const findFirstProfessionals = vi.fn();

vi.mock("~/db", () => ({
  db: {
    query: {
      patients: { findFirst: (...args: unknown[]) => findFirstPatients(...args) },
      professionals: { findFirst: (...args: unknown[]) => findFirstProfessionals(...args) },
    },
  },
}));

const TENANT_A = "tenant-a";
const PACIENTE_ID = "paciente-1";
const PROFISSIONAL_ID = "profissional-1";

describe("assertPacienteEProfissional (regression guard for the cross-tenant IDOR fix)", () => {
  beforeEach(() => {
    findFirstPatients.mockReset();
    findFirstProfessionals.mockReset();
  });

  it("passes when both patient and professional belong to the given tenant", async () => {
    findFirstPatients.mockResolvedValue({ id: PACIENTE_ID });
    findFirstProfessionals.mockResolvedValue({ id: PROFISSIONAL_ID });
    const { assertPacienteEProfissional } = await import("./ownership");
    await expect(assertPacienteEProfissional(TENANT_A, PACIENTE_ID, PROFISSIONAL_ID)).resolves.toBeUndefined();
  });

  it("rejects when the patient id belongs to a different tenant (findFirst returns undefined because the tenantId filter excludes it)", async () => {
    findFirstPatients.mockResolvedValue(undefined);
    findFirstProfessionals.mockResolvedValue({ id: PROFISSIONAL_ID });
    const { assertPacienteEProfissional } = await import("./ownership");
    await expect(assertPacienteEProfissional(TENANT_A, "paciente-de-outro-tenant", PROFISSIONAL_ID)).rejects.toThrow(
      /Paciente ou profissional inválido/
    );
  });

  it("rejects when the professional id belongs to a different tenant", async () => {
    findFirstPatients.mockResolvedValue({ id: PACIENTE_ID });
    findFirstProfessionals.mockResolvedValue(undefined);
    const { assertPacienteEProfissional } = await import("./ownership");
    await expect(
      assertPacienteEProfissional(TENANT_A, PACIENTE_ID, "profissional-de-outro-tenant")
    ).rejects.toThrow(/Paciente ou profissional inválido/);
  });

  it("rejects when both ids are invalid/foreign", async () => {
    findFirstPatients.mockResolvedValue(undefined);
    findFirstProfessionals.mockResolvedValue(undefined);
    const { assertPacienteEProfissional } = await import("./ownership");
    await expect(assertPacienteEProfissional(TENANT_A, "x", "y")).rejects.toThrow();
  });
});
