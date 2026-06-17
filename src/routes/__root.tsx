import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { UserProvider, useUser } from "@/lib/UserContext";

import { reportLovableError } from "../lib/lovable-error-reporting";

/* ---------------- ERROR UI ---------------- */

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, {
      boundary: "tanstack_root_error_component",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">
          This page didn't load
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try again or go home.
        </p>

        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>

          <a
            href="/"
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ROUTE ---------------- */

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/* ---------------- AUTH GATE ---------------- */

function AuthGate({ children }: { children: React.ReactNode }) {
  const { username } = useUser();
  const navigate = useNavigate();
  const pathname = useRouter().state.location.pathname;

  useEffect(() => {
    if (!username && pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [username, pathname, navigate]);

  if (!username && pathname !== "/login") return null;

  return <>{children}</>;
}

/* ---------------- ROOT LAYOUT ---------------- */

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <UserProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGate>

          {/* PAGE CONTENT */}
          <Outlet />

        </AuthGate>
      </QueryClientProvider>
    </UserProvider>
  );
}

