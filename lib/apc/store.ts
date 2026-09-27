"use client";

import { pi } from "@/lib/pi";
import { ALL_REPAIR_IDS, ALL_STEP_IDS, DTC_RE, PID_IDS, SYMPTOM_IDS } from "./knowledge";
import { GENERIC_VERIFY } from "./knowledge";
import type {
  Aspiration,
  Fuel,
  Maint,
  Readings,
  Session,
  Source,
  Stage,
  TestMark,
  Transmission,
  UpgradeGoal,
  Vehicle,
  VehicleData,
  VerifyStatus,
} from "./types";

export const GARAGE_KEY = "apc.garage";
export const vehicleKey = (id: string) => `apc.v.${id}`;
export const MAX_VEHICLES = 10;
export const MAX_SESSIONS = 15;
export const MAX_MAINT = 40;

export type WriteTrouble = "none" | "retrying" | "full";

type Listener = (t: WriteTrouble) => void;

const MIN_PER_KEY = 5200;
const MIN_ACROSS = 2100;

class KeyWriter {
  private pending = new Map<string, () => Record<string, unknown>>();
  private lastWrite = new Map<string, number>();
  private backoff = new Map<string, number>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private inFlight = new Set<string>();
  private lastAny = 0;
  private listener: Listener | null = null;
  private failing = new Set<string>();

  onTrouble(fn: Listener) {
    this.listener = fn;
  }

  schedule(key: string, build: () => Record<string, unknown>, delay = 900) {
    this.pending.set(key, build);
    this.arm(key, delay);
  }

  private arm(key: string, delay: number) {
    const now = Date.now();
    const sincePer = now - (this.lastWrite.get(key) ?? 0);
    const wait = Math.max(delay, MIN_PER_KEY - sincePer, MIN_ACROSS - (now - this.lastAny), this.backoff.get(key) ?? 0);
    const t = this.timers.get(key);
    if (t) clearTimeout(t);
    this.timers.set(
      key,
      setTimeout(() => void this.flush(key), Math.max(0, wait)),
    );
  }

  private async flush(key: string) {
    if (this.inFlight.has(key)) {
      this.arm(key, 600);
      return;
    }
    const now = Date.now();
    if (now - this.lastAny < MIN_ACROSS) {
      this.arm(key, MIN_ACROSS - (now - this.lastAny));
      return;
    }
    const build = this.pending.get(key);
    if (!build) return;
    this.pending.delete(key);
    this.inFlight.add(key);
    this.lastAny = Date.now();
    this.lastWrite.set(key, Date.now());
    try {
      await pi.userState.set(key, build());
      this.backoff.delete(key);
      this.failing.delete(key);
      if (this.failing.size === 0) this.listener?.("none");
    } catch (err) {
      if (!this.pending.has(key)) this.pending.set(key, build);
      const status = (err as { status?: number }).status;
      const msg = String((err as Error)?.message ?? "").toLowerCase();
      const full = status === 413 || status === 507 || /quota|full|exceed|limit reached|too large/.test(msg);
      this.failing.add(key);
      this.listener?.(full ? "full" : "retrying");
      const next = Math.min(30000, Math.round((this.backoff.get(key) ?? 2000) * 1.8));
      this.backoff.set(key, next);
      this.arm(key, next);
    } finally {
      this.inFlight.delete(key);
    }
  }

  flushNow() {
    for (const key of [...this.pending.keys()]) void this.flush(key);
  }

  cancel(key: string) {
    this.pending.delete(key);
    const t = this.timers.get(key);
    if (t) clearTimeout(t);
    this.failing.delete(key);
  }
}

export const writer = new KeyWriter();

/* ---------- sanitizers (stored data is untrusted) ---------- */

function obj(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
}
function str(x: unknown, max = 200): string {
  return typeof x === "string" ? x.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max) : "";
}
function num(x: unknown): number | null {
  return typeof x === "number" && Number.isFinite(x) ? x : null;
}
function pick<T extends string>(x: unknown, allowed: readonly T[], fallback: T): T {
  return typeof x === "string" && (allowed as readonly string[]).includes(x) ? (x as T) : fallback;
}
const safeId = (x: unknown) => {
  const s = str(x, 24);
  return /^[a-z0-9]{4,24}$/.test(s) ? s : "";
};

export function unwrap(rec: unknown): Record<string, unknown> | null {
  const o = obj(rec);
  if (!o) return null;
  const blob = obj(o.blob);
  return blob ?? o;
}

function sanitizeReadings(x: unknown): Readings {
  const o = obj(x);
  const out: Readings = {};
  if (!o) return out;
  for (const id of PID_IDS) {
    const v = num(o[id]);
    if (v != null && Math.abs(v) < 1e6) out[id] = v;
  }
  return out;
}

export function sanitizeVehicle(x: unknown): Vehicle | null {
  const o = obj(x);
  if (!o) return null;
  const id = safeId(o.id);
  if (!id) return null;
  return {
    id,
    make: str(o.make, 40) || "Xe",
    model: str(o.model, 40),
    year: num(o.year),
    engine: str(o.engine, 40),
    displacement: num(o.displacement),
    aspiration: pick<Aspiration>(o.aspiration, ["na", "turbo", "sc"], "na"),
    transmission: pick<Transmission>(o.transmission, ["mt", "at", "cvt", "dct"], "at"),
    fuel: pick<Fuel>(o.fuel, ["gasoline", "diesel", "hybrid"], "gasoline"),
    stockHp: num(o.stockHp),
    stockBoost: num(o.stockBoost),
    odo: num(o.odo),
    goal: pick<UpgradeGoal>(o.goal, ["daily", "sport", "track"], "daily"),
    createdAt: num(o.createdAt) ?? Date.now(),
  };
}

export function sanitizeGarage(rec: unknown): { vehicles: Vehicle[]; activeId: string } {
  const o = unwrap(rec);
  if (!o) return { vehicles: [], activeId: "" };
  const list = Array.isArray(o.vehicles) ? o.vehicles : [];
  const seen = new Set<string>();
  const vehicles: Vehicle[] = [];
  for (const v of list) {
    const s = sanitizeVehicle(v);
    if (s && !seen.has(s.id)) {
      seen.add(s.id);
      vehicles.push(s);
    }
    if (vehicles.length >= MAX_VEHICLES) break;
  }
  const activeId = safeId(o.activeId);
  return { vehicles, activeId: vehicles.some((v) => v.id === activeId) ? activeId : (vehicles[0]?.id ?? "") };
}

function sanitizeSession(x: unknown, vehicleId: string): Session | null {
  const o = obj(x);
  if (!o) return null;
  const id = safeId(o.id);
  if (!id) return null;
  const dtcs = (Array.isArray(o.dtcs) ? o.dtcs : [])
    .map((d) => str(d, 16))
    .filter((d) => DTC_RE.test(d.split(":")[0] ?? ""))
    .slice(0, 20);
  const testsIn = obj(o.tests);
  const tests: Record<string, TestMark> = {};
  if (testsIn)
    for (const sid of ALL_STEP_IDS) {
      const m = testsIn[sid];
      if (m === "ok" || m === "bad") tests[sid] = m;
    }
  const verifyAllowed = new Set(GENERIC_VERIFY.map((_, i) => `g${i}`));
  return {
    id,
    vehicleId,
    title: str(o.title, 80) || "Phiên chẩn đoán",
    source: pick<Source>(o.source, ["live", "sim", "manual"], "manual"),
    scenarioId: str(o.scenarioId, 24),
    stage: pick<Stage>(o.stage, ["data", "analysis", "testing", "repair", "verify"], "data"),
    dtcs,
    sensors: sanitizeReadings(o.sensors),
    freezeDtc: DTC_RE.test(str(o.freezeDtc, 8)) ? str(o.freezeDtc, 8) : "",
    freeze: sanitizeReadings(o.freeze),
    symptoms: (Array.isArray(o.symptoms) ? o.symptoms : [])
      .map((s) => str(s, 30))
      .filter((s) => SYMPTOM_IDS.includes(s)),
    notes: str(o.notes, 1000),
    tests,
    repairsDone: (Array.isArray(o.repairsDone) ? o.repairsDone : [])
      .map((s) => str(s, 30))
      .filter((s) => ALL_REPAIR_IDS.has(s)),
    verifyStatus: pick<VerifyStatus>(o.verifyStatus, ["", "fixed", "not_fixed", "monitor"], ""),
    verifyNote: str(o.verifyNote, 1000),
    verifyChecks: (Array.isArray(o.verifyChecks) ? o.verifyChecks : [])
      .map((s) => str(s, 40))
      .filter((s) => verifyAllowed.has(s) || /^[a-z_]+:\d$/.test(s)),
    createdAt: num(o.createdAt) ?? Date.now(),
    updatedAt: num(o.updatedAt) ?? Date.now(),
  };
}

function sanitizeMaint(x: unknown): Maint | null {
  const o = obj(x);
  if (!o) return null;
  const id = safeId(o.id);
  const item = str(o.item, 80);
  if (!id || !item) return null;
  return { id, date: str(o.date, 10), km: num(o.km), item, note: str(o.note, 300) };
}

export function sanitizeVehicleData(rec: unknown, vehicleId: string): VehicleData {
  const o = unwrap(rec);
  if (!o) return { maint: [], sessions: [] };
  const sessions = (Array.isArray(o.sessions) ? o.sessions : [])
    .map((s) => sanitizeSession(s, vehicleId))
    .filter((s): s is Session => !!s)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_SESSIONS);
  const maint = (Array.isArray(o.maint) ? o.maint : [])
    .map(sanitizeMaint)
    .filter((m): m is Maint => !!m)
    .slice(0, MAX_MAINT);
  return { maint, sessions };
}

export function garageToBlob(vehicles: Vehicle[], activeId: string): Record<string, unknown> {
  return { vehicles, activeId };
}

export function vehicleDataToBlob(d: VehicleData): Record<string, unknown> {
  return { maint: d.maint, sessions: d.sessions.map(({ vehicleId: _v, ...rest }) => rest) };
}
