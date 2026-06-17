import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useUser } from "../lib/UserContext";
import { setTheme, getTheme } from "../lib/theme";
import { Sun, Moon, ShieldAlert, LogOut, RotateCcw, ArrowLeft } from "lucide-react";

/* ---------------- Route ---------------- */

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

/* ---------------- Page ---------------- */

function SettingsPage() {
  const { username, displayName, setUsername, setDisplayName, logout } = useUser();
  const navigate = useNavigate();

  // Local state for profile inputs
  const [localUsername, setLocalUsername] = useState(username || "");
  const [localDisplayName, setLocalDisplayName] = useState(displayName || "");
  
  // Theme state
  const [darkMode, setDarkMode] = useState(() => getTheme());
  const [saved, setSaved] = useState(false);

  // Sync state if context changes (e.g., initial load or reset)
  useEffect(() => {
    setLocalUsername(username || "");
  }, [username]);

  useEffect(() => {
    setLocalDisplayName(displayName || "");
  }, [displayName]);

  // Sync theme changes immediately
  useEffect(() => {
    setTheme(darkMode);
  }, [darkMode]);

  // Check if there are unsaved changes
  const hasChanges =
    localUsername.trim() !== (username || "") ||
    localDisplayName.trim() !== (displayName || "");

  function handleSave() {
    const trimmedUsername = localUsername.trim();
    const trimmedDisplayName = localDisplayName.trim();

    if (!trimmedUsername) {
      alert("Username cannot be empty");
      return;
    }

    setUsername(trimmedUsername);
    setDisplayName(trimmedDisplayName);

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      setUsername("Prakriti");
      setDisplayName("Prakriti");
      setDarkMode(false);
      setTheme(false);
      
      setLocalUsername("Prakriti");
      setLocalDisplayName("Prakriti");

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="mx-auto max-w-3xl space-y-6 p-6">

        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, appearance, and preferences
          </p>
        </div>

        {/* PROFILE */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2">Profile</h2>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="settings-username" className="text-sm font-medium">Username</label>
              <input
                id="settings-username"
                value={localUsername}
                onChange={(e) => setLocalUsername(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Your username"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-displayname" className="text-sm font-medium">Display name</label>
              <input
                id="settings-displayname"
                value={localDisplayName}
                onChange={(e) => setLocalDisplayName(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="How others see you"
              />
            </div>
          </div>
        </div>

        {/* APPEARANCE */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Appearance</h2>

          <div className="mt-4 space-y-4">

            {/* Theme toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-background/50 hover:bg-background/80 transition-colors">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">
                  Light or dark mode
                </p>
              </div>

              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className={`relative flex items-center h-8 w-16 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring border cursor-pointer ${
                  darkMode ? "bg-primary border-primary/20" : "bg-muted border-border"
                }`}
                aria-label="Toggle theme"
              >
                {/* Sun icon on left (visible when dark) */}
                <Sun className={`absolute left-1.5 size-4 text-amber-500 transition-opacity duration-300 ${darkMode ? 'opacity-100' : 'opacity-40'}`} />
                {/* Moon icon on right (visible when light) */}
                <Moon className={`absolute right-1.5 size-4 text-violet-400 transition-opacity duration-300 ${darkMode ? 'opacity-40' : 'opacity-100'}`} />
                {/* Sliding circle */}
                <span
                  className={`absolute top-0.5 h-6.5 w-6.5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                    darkMode ? "translate-x-8.5" : "translate-x-0.5"
                  }`}
                >
                  {darkMode ? (
                    <Moon className="size-3.5 text-primary" />
                  ) : (
                    <Sun className="size-3.5 text-amber-500" />
                  )}
                </span>
              </button>
            </div>

            {/* Fake compact mode */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4 opacity-80 bg-background/50">
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
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Account</h2>

          <div className="mt-4 space-y-3">
            <button
              onClick={handleReset}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer text-foreground flex items-center justify-center gap-2"
            >
              <RotateCcw className="size-4 text-muted-foreground" />
              Reset settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full rounded-lg border border-red-500/20 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </div>

        {/* SAVE BAR */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm transition-all duration-300">
            {saved ? (
              <span className="text-emerald-500 font-medium flex items-center gap-1.5 animate-[fadeIn_0.2s_ease]">
                ✓ Changes saved
              </span>
            ) : hasChanges ? (
              <span className="text-amber-500 font-medium flex items-center gap-1.5">
                <ShieldAlert className="size-4 animate-bounce" />
                Unsaved changes
              </span>
            ) : (
              <span className="text-muted-foreground">All settings up to date</span>
            )}
          </p>

          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              hasChanges
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer hover:-translate-y-0.5"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            }`}
          >
            Save changes
          </button>
        </div>

      </div>
    </div>
  );
}
