export function setTheme(isDark: boolean) {
  const root = document.documentElement;

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  localStorage.setItem("theme", isDark ? "dark" : "light");
}

export function getTheme() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("theme") === "dark";
}

