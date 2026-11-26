import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const map: Record<string, string> = {
        "1": "/",
        "2": "/tasks",
        "3": "/schedule",
        "4": "/routines",
        "5": "/history",
        ",": "/settings",
      };
      const path = map[e.key];
      if (path) {
        e.preventDefault();
        navigate(path);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
}
