import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { redirect } from "@tanstack/react-router";
import type { UserRole } from "~/server/context";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ADMIN_ROLES: UserRole[] = ["owner", "admin"];

export function requireAdminRoute({ context }: { context: { userRole?: UserRole } }) {
  if (context.userRole && !ADMIN_ROLES.includes(context.userRole)) {
    throw redirect({ to: "/dashboard" });
  }
}

export function hojeLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function primeiroDiaMesLocal(): string {
  return hojeLocal().slice(0, 7) + "-01";
}

export function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num || 0);
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calcularIdade(dataNasc: string): string {
  const nasc = new Date(dataNasc + "T00:00:00");
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos + (anos === 1 ? " ano" : " anos");
}

export function extenso(n: number): string {
  const unidades = ["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove",
    "dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
  const dezenas = ["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
  if (n < 20) return unidades[n] ?? String(n);
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? (dezenas[d] ?? String(n)) : (dezenas[d] ?? "") + " e " + (unidades[u] ?? "");
}
