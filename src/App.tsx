import { useState, useEffect } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { PulseSidebar } from "./components/PulseSidebar";
import { LandingPage } from "./pages/LandingPage";
import "./styles/global.css";

// Running inside Tauri desktop shell?
const IS_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function getInitialRoute(): "landing" | "app" {
  if (IS_TAURI) return "app"; // skip landing in desktop app
  return window.location.pathname.startsWith("/app") ? "app" : "landing";
}

export function App() {
  const [route, setRoute] = useState<"landing" | "app">(getInitialRoute);

  useEffect(() => {
    if (IS_TAURI) return; // no URL management needed in Tauri
    const newPath = route === "app" ? "/app" : "/";
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, "", newPath);
    }
  }, [route]);

  useEffect(() => {
    if (IS_TAURI) return;
    const handler = () => setRoute(getInitialRoute());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  if (route === "landing") {
    return <LandingPage onLaunch={() => setRoute("app")} />;
  }

  return <MacuApp />;
}

function MacuApp() {
  useWebSocket();
  return (
    <div style={{ minHeight: "100vh", background: "#270038" }}>
      <PulseSidebar isTauri={IS_TAURI} />
    </div>
  );
}
