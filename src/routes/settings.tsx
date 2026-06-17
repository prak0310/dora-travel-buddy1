import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/* ---------------- Theme Helpers ---------------- */

function setTheme(isDark: boolean) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");

  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function getInitialTheme() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("theme") === "dark";
}

/* ---------------- Profile Helpers ---------------- */

function getInitialUsername() {
  if (typeof window === "undefined") return "User";
  return localStorage.getItem("username") || "Prakriti";
}

function saveUsername(username: string) {
  localStorage.setItem("username", username);
}

/* ---------------- Route ---------------- */

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

/* ---------------- Page ---------------- */

function SettingsPage() {
  const [username, setUsername] = useState(getInitialUsername);
  const [darkMode, setDarkMode] = useState(() => getInitialTheme());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTheme(darkMode);
  }, [darkMode]);

  function handleSave() {
    saveUsername(username);

    console.log({
      username,
      darkMode,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="mx-auto max-w-3xl space-y-6 p-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, appearance, and preferences
          </p>
        </div>

        {/* PROFILE */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Profile</h2>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Display name</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="How others see you"
              />
            </div>
          </div>
        </div>

        {/* APPEARANCE */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Appearance</h2>

          <div className="mt-4 space-y-4">

            {/* Theme toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">
                  Light or dark mode
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

            {/* Fake compact mode (clean UX, no “coming soon”) */}
            <div className="flex items-center justify-between rounded-lg border p-4 opacity-80">
              <div>
                <p className="text-sm font-medium">Compact mode</p>
                <p className="text-xs text-muted-foreground">
                  Reduce spacing in UI
                </p>
              </div>

              <button
                onClick={() => {
                  alert("Compact mode is not enabled yet");
                }}
                className="relative h-6 w-11 rounded-full bg-muted cursor-pointer"
              >
                <span className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white" />
              </button>
            </div>

          </div>
        </div>

        {/* ACCOUNT */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Account</h2>

          <div className="mt-4 space-y-3">
            <button className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-muted/50">
              Reset settings
            </button>

            <button className="w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">
              Log out
            </button>
          </div>
        </div>

        {/* SAVE BAR */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {saved ? "Changes saved" : "Unsaved changes"}
          </p>

          <button
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save changes
          </button>
        </div>

      </div>
    </div>
  );
}

