"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { pi } from "@/lib/pi";
import { SCENARIOS } from "@/lib/apc/scenarios";
import {
  GARAGE_KEY,
  MAX_MAINT,
  MAX_SESSIONS,
  MAX_VEHICLES,
  garageToBlob,
  sanitizeGarage,
  sanitizeVehicleData,
  vehicleDataToBlob,
  vehicleKey,
  writer,
  type WriteTrouble,
} from "@/lib/apc/store";
import { makeId, type Maint, type Session, type Source, type Vehicle, type VehicleData } from "@/lib/apc/types";

export type TabId = "dashboard" | "sessions" | "garage" | "upgrade";

export interface Toast {
  id: string;
  text: string;
}

export type VehicleInput = Omit<Vehicle, "id" | "createdAt">;

interface ApcValue {
  ready: boolean;
  trouble: WriteTrouble;
  tab: TabId;
  setTab: (t: TabId) => void;
  vehicles: Vehicle[];
  activeId: string;
  active: Vehicle | null;
  setActive: (id: string) => void;
  addVehicle: (v: VehicleInput) => string | null;
  updateVehicle: (id: string, patch: Partial<VehicleInput>) => void;
  removeVehicle: (id: string) => void;
  dataFor: (id: string) => VehicleData;
  sessions: Session[];
  getSession: (id: string) => Session | null;
  createSession: (source: Source, scenarioId?: string) => string | null;
  updateSession: (id: string, patch: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  pruneSessions: (vehicleId: string, keep: number) => void;
  addMaint: (m: Omit<Maint, "id">) => void;
  removeMaint: (id: string) => void;
  openSessionId: string | null;
  openSession: (id: string | null) => void;
  toasts: Toast[];
  toast: (text: string) => void;
}

const Ctx = createContext<ApcValue | null>(null);

export function ApcProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [trouble, setTrouble] = useState<WriteTrouble>("none");
  const [tab, setTab] = useState<TabId>("dashboard");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeId, setActiveId] = useState("");
  const [data, setData] = useState<Record<string, VehicleData>>({});
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const vehiclesRef = useRef<Vehicle[]>([]);
  const activeRef = useRef("");
  const dataRef = useRef<Record<string, VehicleData>>({});

  const toast = useCallback((text: string) => {
    const id = makeId();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  useEffect(() => {
    writer.onTrouble(setTrouble);
    let cancelled = false;
    (async () => {
      try {
        const g = sanitizeGarage(await pi.userState.get(GARAGE_KEY));
        const map: Record<string, VehicleData> = {};
        for (const v of g.vehicles) {
          try {
            map[v.id] = sanitizeVehicleData(await pi.userState.get(vehicleKey(v.id)), v.id);
          } catch {
            map[v.id] = { maint: [], sessions: [] };
          }
        }
        if (cancelled) return;
        vehiclesRef.current = g.vehicles;
        activeRef.current = g.activeId;
        dataRef.current = map;
        setVehicles(g.vehicles);
        setActiveId(g.activeId);
        setData(map);
      } catch {
        if (!cancelled) toast("Không tải được dữ liệu đã lưu — đang dùng dữ liệu trống.");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    const flush = () => writer.flushNow();
    const onVis = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [toast]);

  const commitGarage = useCallback((list: Vehicle[], active: string, delay = 400) => {
    vehiclesRef.current = list;
    activeRef.current = active;
    setVehicles(list);
    setActiveId(active);
    writer.schedule(GARAGE_KEY, () => garageToBlob(vehiclesRef.current, activeRef.current), delay);
  }, []);

  const commitData = useCallback((vid: string, next: VehicleData, delay = 900) => {
    dataRef.current = { ...dataRef.current, [vid]: next };
    setData(dataRef.current);
    writer.schedule(vehicleKey(vid), () => vehicleDataToBlob(dataRef.current[vid] ?? { maint: [], sessions: [] }), delay);
  }, []);

  const dataFor = useCallback((id: string) => data[id] ?? { maint: [], sessions: [] }, [data]);

  const setActive = useCallback(
    (id: string) => {
      if (!vehiclesRef.current.some((v) => v.id === id)) return;
      commitGarage(vehiclesRef.current, id, 1500);
    },
    [commitGarage],
  );

  const addVehicle = useCallback(
    (input: VehicleInput) => {
      if (vehiclesRef.current.length >= MAX_VEHICLES) {
        toast(`Garage tối đa ${MAX_VEHICLES} xe.`);
        return null;
      }
      const v: Vehicle = { ...input, id: makeId(), createdAt: Date.now() };
      commitGarage([...vehiclesRef.current, v], v.id);
      commitData(v.id, { maint: [], sessions: [] });
      return v.id;
    },
    [commitGarage, commitData, toast],
  );

  const updateVehicle = useCallback(
    (id: string, patch: Partial<VehicleInput>) => {
      commitGarage(
        vehiclesRef.current.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        activeRef.current,
        1200,
      );
    },
    [commitGarage],
  );

  const removeVehicle = useCallback(
    (id: string) => {
      const list = vehiclesRef.current.filter((v) => v.id !== id);
      const active = activeRef.current === id ? (list[0]?.id ?? "") : activeRef.current;
      commitGarage(list, active);
      writer.cancel(vehicleKey(id));
      const { [id]: _removed, ...rest } = dataRef.current;
      dataRef.current = rest;
      setData(rest);
      pi.userState.delete(vehicleKey(id)).catch(() => {});
    },
    [commitGarage],
  );

  const sessions = useMemo(() => data[activeId]?.sessions ?? [], [data, activeId]);

  const findSession = (id: string): Session | null => {
    for (const d of Object.values(dataRef.current)) {
      const s = d.sessions.find((x) => x.id === id);
      if (s) return s;
    }
    return null;
  };
  const getSession = useCallback(
    (id: string) => {
      for (const d of Object.values(data)) {
        const s = d.sessions.find((x) => x.id === id);
        if (s) return s;
      }
      return null;
    },
    [data],
  );

  const createSession = useCallback(
    (source: Source, scenarioId?: string) => {
      const vid = activeRef.current;
      if (!vid) {
        toast("Hãy thêm xe vào Garage trước.");
        return null;
      }
      const sc = scenarioId ? SCENARIOS.find((x) => x.id === scenarioId) : undefined;
      const now = Date.now();
      const count = (dataRef.current[vid]?.sessions.length ?? 0) + 1;
      const s: Session = {
        id: makeId(),
        vehicleId: vid,
        title: sc ? `Mô phỏng: ${sc.title}` : `Phiên #${count}`,
        source,
        scenarioId: sc?.id ?? "",
        stage: sc ? "analysis" : "data",
        dtcs: sc ? [...sc.dtcs] : [],
        sensors: sc ? { ...sc.sensors } : {},
        freezeDtc: sc?.freezeDtc ?? "",
        freeze: sc ? { ...sc.freeze } : {},
        symptoms: sc ? [...sc.symptoms] : [],
        notes: "",
        tests: {},
        repairsDone: [],
        verifyStatus: "",
        verifyNote: "",
        verifyChecks: [],
        createdAt: now,
        updatedAt: now,
      };
      const cur = dataRef.current[vid] ?? { maint: [], sessions: [] };
      let list = [s, ...cur.sessions];
      if (list.length > MAX_SESSIONS) {
        list = list.slice(0, MAX_SESSIONS);
        toast(`Đã đạt ${MAX_SESSIONS} phiên — phiên cũ nhất được xóa.`);
      }
      commitData(vid, { ...cur, sessions: list }, 300);
      return s.id;
    },
    [commitData, toast],
  );

  const updateSession = useCallback(
    (id: string, patch: Partial<Session>) => {
      const s = findSession(id);
      if (!s) return;
      const cur = dataRef.current[s.vehicleId];
      if (!cur) return;
      const next = { ...s, ...patch, id: s.id, vehicleId: s.vehicleId, updatedAt: Date.now() };
      commitData(s.vehicleId, { ...cur, sessions: cur.sessions.map((x) => (x.id === id ? next : x)) }, 1500);
    },
    [commitData],
  );

  const deleteSession = useCallback(
    (id: string) => {
      const s = findSession(id);
      if (!s) return;
      const cur = dataRef.current[s.vehicleId];
      commitData(s.vehicleId, { ...cur, sessions: cur.sessions.filter((x) => x.id !== id) }, 300);
      if (openSessionId === id) setOpenSessionId(null);
    },
    [commitData, openSessionId],
  );

  const pruneSessions = useCallback(
    (vid: string, keep: number) => {
      const cur = dataRef.current[vid];
      if (!cur) return;
      commitData(vid, { ...cur, sessions: cur.sessions.slice(0, keep) }, 300);
    },
    [commitData],
  );

  const addMaint = useCallback(
    (m: Omit<Maint, "id">) => {
      const vid = activeRef.current;
      const cur = dataRef.current[vid];
      if (!cur) return;
      commitData(vid, { ...cur, maint: [{ ...m, id: makeId() }, ...cur.maint].slice(0, MAX_MAINT) }, 400);
    },
    [commitData],
  );

  const removeMaint = useCallback(
    (id: string) => {
      const vid = activeRef.current;
      const cur = dataRef.current[vid];
      if (!cur) return;
      commitData(vid, { ...cur, maint: cur.maint.filter((m) => m.id !== id) }, 400);
    },
    [commitData],
  );

  const active = vehicles.find((v) => v.id === activeId) ?? null;

  const value: ApcValue = {
    ready,
    trouble,
    tab,
    setTab,
    vehicles,
    activeId,
    active,
    setActive,
    addVehicle,
    updateVehicle,
    removeVehicle,
    dataFor,
    sessions,
    getSession,
    createSession,
    updateSession,
    deleteSession,
    pruneSessions,
    addMaint,
    removeMaint,
    openSessionId,
    openSession: setOpenSessionId,
    toasts,
    toast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApc(): ApcValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApc must be used inside ApcProvider");
  return v;
}
