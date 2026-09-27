import type { Readings } from "./types";

/** Interface any future OBD-II adapter (Bluetooth / Wi-Fi / USB) must implement. */
export interface ObdAdapter {
  kind: "bluetooth" | "wifi" | "usb";
  name: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  readDtcs: () => Promise<string[]>;
  readPids: () => Promise<Readings>;
  readFreezeFrame: () => Promise<{ dtc: string; readings: Readings }>;
}

export interface TransportSupport {
  bluetooth: boolean;
  usb: boolean;
  wifi: boolean;
}

export function detectSupport(): TransportSupport {
  if (typeof navigator === "undefined") return { bluetooth: false, usb: false, wifi: false };
  const nav = navigator as Navigator & { bluetooth?: unknown; serial?: unknown };
  return { bluetooth: !!nav.bluetooth, usb: !!nav.serial, wifi: false };
}

/** No adapter drivers ship in this version; returns null so the app falls back to manual/simulated data. */
export function getAdapter(): ObdAdapter | null {
  return null;
}
