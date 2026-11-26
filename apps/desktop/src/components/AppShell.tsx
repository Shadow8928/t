import { NavLink, Outlet } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { TimerPanel } from "./TimerPanel";
import { OfflineBadge } from "./OfflineBadge";

const nav = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/tasks", label: "Tasks" },
  { to: "/schedule", label: "Schedule" },
  { to: "/routines", label: "Routines" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Settings" },
];

export function AppShell() {
  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-surface/80 backdrop-blur">
        <div className="px-5 pb-2 pt-6">
          <BrandMark size={44} withWordmark />
          <p className="mt-2 text-xs text-text-secondary">Your day. Under control.</p>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-surface-elevated text-text-primary"
                    : "text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <OfflineBadge />
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto p-6 animate-fade-up">
        <Outlet />
      </main>
      <TimerPanel />
    </div>
  );
}
