import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@operator/design-system";
import { useThemeSync } from "@/lib/use-theme-sync.ts";
import { useGatewayStatus } from "@/lib/gateway-client.tsx";

export type NavSection = {
  label: string;
  items: { href: string; label: string }[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { href: "/chat", label: "Chat" },
      { href: "/new", label: "New Session" },
      { href: "/activity", label: "Activity" },
      { href: "/workboard", label: "Workboard" },
      { href: "/tasks", label: "Tasks" },
      { href: "/sessions", label: "Sessions" },
      { href: "/usage", label: "Usage" },
    ],
  },
  {
    label: "Configure",
    items: [
      { href: "/settings/agents", label: "Agents" },
      { href: "/settings/channels", label: "Channels" },
      { href: "/settings/connection", label: "Connection" },
      { href: "/settings/general", label: "General" },
      { href: "/settings/model-providers", label: "Model Providers" },
      { href: "/settings/memory-import", label: "Memory Import" },
      { href: "/settings/profile", label: "Profile" },
      { href: "/settings/worktrees", label: "Worktrees" },
      { href: "/settings/sessions", label: "Session History" },
      { href: "/settings/plugins", label: "Plugins" },
      { href: "/settings/ai-agents", label: "AI Agents" },
      { href: "/settings/communications", label: "Communications" },
      { href: "/settings/appearance", label: "Appearance" },
      { href: "/settings/automation", label: "Automation" },
      { href: "/settings/mcp", label: "MCP" },
      { href: "/settings/infrastructure", label: "Infrastructure" },
      { href: "/settings/about", label: "About" },
    ],
  },
  {
    label: "Extend",
    items: [
      { href: "/skills", label: "Skills" },
      { href: "/skills/workshop", label: "Skill Workshop" },
      { href: "/plugin", label: "Plugin" },
      { href: "/cron", label: "Cron" },
      { href: "/settings/devices", label: "Nodes" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/debug", label: "Debug" },
      { href: "/logs", label: "Logs" },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  useThemeSync();
  const gateway = useGatewayStatus();
  const pathname = usePathname() || "";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="font-semibold">Operator Console</span>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-auto p-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.label}
              </p>
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      "rounded-md px-3 py-1.5 text-sm transition-colors " +
                      (active
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-sm text-muted-foreground">Control UI</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Gateway:{" "}
              {gateway.connected ? gateway.version ?? "connected" : "disconnected"}
            </span>
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
