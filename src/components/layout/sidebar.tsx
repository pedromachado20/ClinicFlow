import { useState } from "react";
import { Link, useRouterState, useRouteContext } from "@tanstack/react-router";
import {
  LayoutDashboard, CalendarDays, Users, UserCheck,
  Stethoscope, DollarSign, BarChart3, Settings, ChevronLeft,
  ChevronRight, Receipt, ClipboardList, BookOpen, CreditCard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { UserRole } from "~/server/context";

const ADMIN_ROLES: UserRole[] = ["owner", "admin"];

interface NavItem {
  icon: LucideIcon;
  label: string;
  to: string;
  roles?: UserRole[];
}

const navItems: { label: string; items: NavItem[] }[] = [
  {
    label: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",  to: "/dashboard" },
      { icon: CalendarDays,    label: "Agenda",     to: "/agenda" },
      { icon: Receipt,         label: "Caixa",      to: "/caixa" },
    ],
  },
  {
    label: "Clínica",
    items: [
      { icon: Users,         label: "Pacientes",   to: "/pacientes" },
      { icon: ClipboardList, label: "Prontuários", to: "/prontuarios" },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { icon: UserCheck,   label: "Profissionais", to: "/profissionais", roles: ADMIN_ROLES },
      { icon: Stethoscope, label: "Serviços",      to: "/servicos", roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Gestão",
    items: [
      { icon: DollarSign, label: "Financeiro",    to: "/financeiro", roles: ADMIN_ROLES },
      { icon: BarChart3,  label: "Relatórios",    to: "/relatorios", roles: ADMIN_ROLES },
      { icon: Settings,   label: "Configurações", to: "/configuracoes", roles: ADMIN_ROLES },
      { icon: CreditCard, label: "Assinatura",    to: "/assinatura", roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Suporte",
    items: [
      { icon: BookOpen, label: "Manual / Ajuda", to: "/ajuda" },
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouterState();
  const pathname = router.location.pathname;
  const { userRole } = useRouteContext({ from: "/_app" }) as { userRole?: UserRole };

  const visibleGroups = navItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || (userRole && item.roles.includes(userRole))),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className={cn("relative flex flex-col border-r border-border bg-card transition-all duration-300", collapsed ? "w-16" : "w-56")}>
      <div className={cn("flex items-center border-b border-border", collapsed ? "justify-center p-4" : "px-4 py-4 gap-2")}>
        <Stethoscope className="h-7 w-7 text-primary shrink-0" />
        {!collapsed && <span className="text-lg font-bold text-foreground">ClinicFlow</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 mx-2 px-2 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shadow-sm"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
