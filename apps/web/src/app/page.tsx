import Link from "next/link";
import { Eye, Infinity, Server, Code2 } from "lucide-react";
import { getSessionToken, validateSession } from "@/lib/auth/session";

const features = [
  {
    icon: Eye,
    title: "Live Preview",
    description:
      "See your PDF update in real-time as you type. No manual compilation needed.",
  },
  {
    icon: Infinity,
    title: "No Limits",
    description:
      "No file size caps, no compile timeouts, no project restrictions. Your server, your rules.",
  },
  {
    icon: Server,
    title: "Self-Hostable",
    description:
      "Deploy on your own infrastructure with Docker. Full control over your data and privacy.",
  },
  {
    icon: Code2,
    title: "Open Source",
    description:
      "Fully open-source under MIT license. Inspect, modify, and contribute to the codebase.",
  },
];

export default async function HomePage() {
  let isLoggedIn = false;
  try {
    const token = await getSessionToken();
    if (token) {
      const session = await validateSession(token);
      isLoggedIn = !!session;
    }
  } catch {
    // Not logged in
  }
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navigation */}
      <nav className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.png" alt="Logo" className="h-10 w-10" />
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover"
                >
                  Sign in
                </Link>
                
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-text-primary sm:text-6xl">
          X1 Labs,{" "}
          <span className="text-accent">simplified.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary">
          The writing platform for X1 Labs colleagues, based off the open-source Backslash project. This page is for internal use only, and is not intended for public access. Please do not share this link outside of X1 Labs.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="rounded-lg bg-accent px-6 py-3 text-base font-medium text-bg-primary transition-colors hover:bg-accent-hover"
          >
            {isLoggedIn ? "Open Dashboard" : "Log In"}
          </Link>
          <a
            href="https://github.com/Manan-Santoki/Backslash"
            className="rounded-lg border border-border bg-bg-elevated px-6 py-3 text-base font-medium text-text-primary transition-colors hover:bg-border"
          >
            View on GitHub
          </a>
        </div>
      </section>

    </div>
  );
}
