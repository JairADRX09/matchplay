import { useState, useEffect } from "react";
import { usePulseStore } from "./stores/pulse-store";
import { useWebSocket } from "./hooks/useWebSocket";
import { PulsePanel } from "./components/PulsePanel";
import { SetupView } from "./components/SetupView";
import { SettingsView } from "./components/SettingsView";
import { HandshakeModal } from "./components/HandshakeModal";
import { LandingPage } from "./pages/LandingPage";
import "./styles/global.css";

// Determines the initial route from the URL path
function getInitialRoute(): "landing" | "app" {
  return window.location.pathname.startsWith("/app") ? "app" : "landing";
}

export function App() {
  const [route, setRoute] = useState<"landing" | "app">(getInitialRoute);
  const view = usePulseStore((s) => s.view);
  const handshake = usePulseStore((s) => s.handshake);

  // Keep URL in sync with route state
  useEffect(() => {
    const newPath = route === "app" ? "/app" : "/";
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, "", newPath);
    }
  }, [route]);

  // Handle browser back/forward
  useEffect(() => {
    const handler = () => setRoute(getInitialRoute());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  if (route === "landing") {
    return <LandingPage onLaunch={() => setRoute("app")} />;
  }

  return <PulseApp view={view} handshake={!!handshake} />;
}

// ─── The actual matchmaking app ───────────────────────────────────────────────
function PulseApp({ view, handshake }: { view: string; handshake: boolean }) {
  useWebSocket();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {view === "setup" && <SetupView />}
      {view === "feed" && <PulsePanel />}
      {view === "settings" && <SettingsView />}
      {handshake && <HandshakeModal />}
    </div>
  );
}
