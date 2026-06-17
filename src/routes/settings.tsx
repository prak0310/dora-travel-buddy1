import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/* ---------------- Theme Helpers ---------------- */

function setTheme(isDark: boolean) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function getInitialTheme() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("theme") === "dark";
}

/* ---------------- Route ---------------- */

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

/* ---------------- Page ---------------- */

function SettingsPage() {
  const [username, setUsername] = useState("Prakriti");
  const [darkMode, setDarkMode] = useState(getInitialTheme());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTheme(darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="mx-auto max-w-3xl space-y-6 p-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, preferences, and appearance
          </p>
        </div>

        {/* Profile */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your identity across the platform
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter username"
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Control how the app looks
          </p>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">
                Toggle light and dark theme
              </p>
            </div>

            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className={`relative h-6 w-11 rounded-full transition ${
                darkMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  darkMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {saved ? "Settings saved ✔" : "Make changes and save"}
          </p>

          <button
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);

              console.log({
                username,
                darkMode,
              });
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

