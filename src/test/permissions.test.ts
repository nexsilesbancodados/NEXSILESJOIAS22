import { describe, it, expect, vi } from "vitest";

// Test the permission path mapping logic directly
const MODULE_PATH_MAP: Record<string, string[]> = {
  dashboard: ["/"],
  pecas: ["/pecas"],
  etiquetas: ["/etiquetas"],
  banhos: ["/banhos"],
  vendas: ["/pdv"],
  campanhas: ["/campanhas"],
  clientes: ["/clientes"],
  catalogos: ["/catalogos"],
  revendedoras: ["/revendedoras", "/revendedoras/desempenho"],
  fornecedores: ["/fornecedores"],
  romaneios: ["/romaneios"],
  relatorios: ["/relatorios"],
  historico: ["/historico"],
  atendimento: ["/atendimento"],
  configuracoes: ["/configuracoes"],
};

function canAccessPath(
  path: string,
  isAdmin: boolean,
  permissions: Array<{ modulo: string; pode_ver: boolean }>
): boolean {
  if (isAdmin) return true;
  if (path === "/tutorial") return true;

  for (const [modulo, paths] of Object.entries(MODULE_PATH_MAP)) {
    if (paths.includes(path)) {
      const perm = permissions.find((p) => p.modulo === modulo);
      return perm?.pode_ver ?? false;
    }
  }
  return false;
}

describe("Permissions", () => {
  it("admin can access all paths", () => {
    expect(canAccessPath("/", true, [])).toBe(true);
    expect(canAccessPath("/pecas", true, [])).toBe(true);
    expect(canAccessPath("/pdv", true, [])).toBe(true);
    expect(canAccessPath("/configuracoes", true, [])).toBe(true);
  });

  it("tutorial is always accessible", () => {
    expect(canAccessPath("/tutorial", false, [])).toBe(true);
  });

  it("non-admin without permissions cannot access modules", () => {
    expect(canAccessPath("/pecas", false, [])).toBe(false);
    expect(canAccessPath("/pdv", false, [])).toBe(false);
  });

  it("non-admin with permission can access module", () => {
    const perms = [{ modulo: "pecas", pode_ver: true }];
    expect(canAccessPath("/pecas", false, perms)).toBe(true);
  });

  it("non-admin with pode_ver=false cannot access module", () => {
    const perms = [{ modulo: "pecas", pode_ver: false }];
    expect(canAccessPath("/pecas", false, perms)).toBe(false);
  });

  it("all module paths are mapped correctly", () => {
    const allPaths = Object.values(MODULE_PATH_MAP).flat();
    expect(allPaths).toContain("/");
    expect(allPaths).toContain("/pecas");
    expect(allPaths).toContain("/pdv");
    expect(allPaths).toContain("/revendedoras");
    expect(allPaths).toContain("/revendedoras/desempenho");
  });

  it("revendedoras desempenho sub-path uses same module", () => {
    const perms = [{ modulo: "revendedoras", pode_ver: true }];
    expect(canAccessPath("/revendedoras", false, perms)).toBe(true);
    expect(canAccessPath("/revendedoras/desempenho", false, perms)).toBe(true);
  });

  it("unknown paths return false for non-admin", () => {
    expect(canAccessPath("/unknown", false, [])).toBe(false);
  });
});
