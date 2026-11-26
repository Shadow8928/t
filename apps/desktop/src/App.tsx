import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { subscribeOnlineFlush } from "./lib/sync";
import { AppShell } from "./components/AppShell";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TasksPage } from "./pages/TasksPage";
import { SchedulePage } from "./pages/SchedulePage";
import { RoutinesPage } from "./pages/RoutinesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useKeyboardShortcuts } from "./lib/shortcuts";

function Protected({ children }: { children: React.ReactNode }) {
  const { ready, session, localMode } = useAuth();
  if (!ready) {
    return (
      <div className="grid h-full place-items-center text-text-secondary">Loading System…</div>
    );
  }
  if (!session && !localMode) return <Navigate to="/auth" replace />;
  return children;
}

export function App() {
  useKeyboardShortcuts();
  useEffect(() => subscribeOnlineFlush(), []);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="routines" element={<RoutinesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
