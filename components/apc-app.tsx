"use client";

import { ApcProvider, useApc } from "@/contexts/apc-context";
import { Dashboard } from "./apc/dashboard";
import { GarageScreen } from "./apc/garage-screen";
import { BottomNav, LoadingScreen, StorageNotice, ToastHost } from "./apc/pieces";
import { SessionScreen } from "./apc/session/session-screen";
import { SessionsScreen } from "./apc/sessions-screen";
import { UpgradeScreen } from "./apc/upgrade-screen";

export function AiProCarApp() {
  return (
    <ApcProvider>
      <Shell />
    </ApcProvider>
  );
}

function Shell() {
  const { ready, tab, openSessionId } = useApc();
  if (!ready) return <LoadingScreen />;
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main key={tab} className="apc-rise w-full max-w-md">
        {tab === "dashboard" && <Dashboard />}
        {tab === "sessions" && <SessionsScreen />}
        {tab === "garage" && <GarageScreen />}
        {tab === "upgrade" && <UpgradeScreen />}
      </main>
      <BottomNav />
      {openSessionId && <SessionScreen id={openSessionId} />}
      <ToastHost />
      <StorageNotice />
    </div>
  );
}
