import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Root element #root was not found");
}

const router = getRouter();

createRoot(rootElement).render(<RouterProvider router={router} />);

const saved = localStorage.getItem("theme");

if (saved === "dark") {
  document.documentElement.classList.add("dark");
}


