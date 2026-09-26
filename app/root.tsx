import { useEffect, type ReactNode } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { BottomNav } from "./components/BottomNav";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { OfflineNotice } from "./components/OfflineNotice";
import { LangProvider } from "./lib/i18n";

export function Layout({ children }: { children: ReactNode }) {
  const base = import.meta.env.BASE_URL;
  return (
    <html lang="bn">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f6b66" />
        <link rel="icon" href={`${base}icon.svg`} type="image/svg+xml" />
        <link rel="manifest" href={`${base}manifest.webmanifest`} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <Header />
      <main id="main" className="container">
        <OfflineNotice />
        {children}
      </main>
      <Footer />
      <BottomNav />
    </LangProvider>
  );
}

export default function App() {
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
    }
  }, []);
  return <Shell><Outlet /></Shell>;
}

export function HydrateFallback() {
  return <p className="container">লোড হচ্ছে… / Loading…</p>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <Shell>
      <h1>{notFound ? "পাতাটি পাওয়া যায়নি / Page not found" : "কিছু একটা সমস্যা হয়েছে / Something went wrong"}</h1>
      <p><a href={import.meta.env.BASE_URL}>হোমে ফিরে যান / Go home</a></p>
    </Shell>
  );
}
