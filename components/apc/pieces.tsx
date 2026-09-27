"use client";

import { useEffect, useState } from "react";
import { pi } from "@/lib/pi";
import { useApc, type TabId } from "@/contexts/apc-context";
import { GARAGE_KEY } from "@/lib/apc/store";
import { vehicleName } from "@/lib/apc/types";
import { Button, IconCar, IconGauge, IconScan, IconTrash, IconTurbo, Sheet, cx } from "./ui";

export function LoadingScreen() {
  return (
    <div className="apc-grid-bg flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6">
      <Logo />
      <div className="relative h-1 w-40 overflow-hidden rounded-full bg-secondary">
        <div className="apc-scan absolute inset-y-0 w-1/3 rounded-full bg-primary" />
      </div>
      <p className="text-sm text-muted-foreground">Đang tải garage…</p>
    </div>
  );
}

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cx(
          "flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary",
          small ? "h-8 w-8" : "h-11 w-11",
        )}
      >
        <IconGauge width={small ? 18 : 24} height={small ? 18 : 24} />
      </div>
      <div className="leading-tight">
        <p className={cx("font-bold tracking-tight", small ? "text-sm" : "text-lg")}>AI PRO CAR</p>
        {!small && <p className="text-xs text-muted-foreground">Chẩn đoán & tư vấn kỹ thuật</p>}
      </div>
    </div>
  );
}

const TABS: { id: TabId; label: string; Icon: typeof IconGauge }[] = [
  { id: "dashboard", label: "Dashboard", Icon: IconGauge },
  { id: "sessions", label: "Chẩn đoán", Icon: IconScan },
  { id: "garage", label: "Garage", Icon: IconCar },
  { id: "upgrade", label: "Nâng cấp", Icon: IconTurbo },
];

export function BottomNav() {
  const { tab, setTab, sessions } = useApc();
  const open = sessions.filter((s) => !s.verifyStatus || s.verifyStatus === "monitor").length;
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center border-t border-border bg-background/95 backdrop-blur"
    >
      <ul className="flex w-full max-w-md pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  setTab(id);
                  window.scrollTo({ top: 0 });
                }}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" />}
                <Icon />
                {label}
                {id === "sessions" && open > 0 && (
                  <span className="apc-nums absolute right-[calc(50%-20px)] top-1.5 rounded-full bg-probable px-1.5 text-[10px] font-bold text-primary-foreground">
                    {open}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ToastHost() {
  const { toasts } = useApc();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="apc-rise max-w-sm rounded-lg border border-border bg-card px-4 py-2.5 text-sm shadow-lg">
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function StorageNotice() {
  const { trouble } = useApc();
  const [open, setOpen] = useState(false);
  if (trouble === "none") return null;
  return (
    <>
      <div className="fixed inset-x-0 top-2 z-[55] flex justify-center px-4">
        <div className="apc-rise flex max-w-sm items-center gap-3 rounded-lg border border-probable/50 bg-card px-3 py-2 text-xs shadow-lg">
          <span className="text-pretty">
            {trouble === "full"
              ? "Bộ nhớ tài khoản Pi đã đầy — dữ liệu vẫn giữ trên màn hình."
              : "Đang thử lưu lại vào tài khoản Pi…"}
          </span>
          {trouble === "full" && (
            <button type="button" className="shrink-0 font-semibold text-primary" onClick={() => setOpen(true)}>
              Giải phóng
            </button>
          )}
        </div>
      </div>
      {open && <StorageSheet onClose={() => setOpen(false)} />}
    </>
  );
}

export function StorageSheet({ onClose }: { onClose: () => void }) {
  const { vehicles, pruneSessions, dataFor, toast } = useApc();
  const [keys, setKeys] = useState<string[] | null>(null);
  const [busy, setBusy] = useState("");

  const load = () =>
    pi.userState
      .keys()
      .then((k) => setKeys(Array.isArray(k) ? k.filter((x) => typeof x === "string") : []))
      .catch(() => setKeys([]));
  useEffect(() => {
    void load();
  }, []);

  const labelFor = (k: string) => {
    if (k === GARAGE_KEY) return "Danh sách garage (bắt buộc)";
    if (k.startsWith("apc.v.")) {
      const v = vehicles.find((x) => `apc.v.${x.id}` === k);
      return v ? `Dữ liệu xe: ${vehicleName(v)}` : "Dữ liệu xe đã xóa";
    }
    return "Dữ liệu khác";
  };

  const del = async (k: string) => {
    setBusy(k);
    try {
      await pi.userState.delete(k);
      toast("Đã xóa.");
      await load();
    } catch {
      toast("Chưa xóa được, thử lại sau.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Sheet title="Quản lý dung lượng" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Xóa bớt phiên cũ hoặc dữ liệu không còn dùng để tiếp tục lưu.
        </p>
        {vehicles.map((v) => {
          const n = dataFor(v.id).sessions.length;
          return (
            <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{vehicleName(v)}</p>
                <p className="text-xs text-muted-foreground">{n} phiên chẩn đoán</p>
              </div>
              <Button variant="outline" disabled={n <= 3} onClick={() => pruneSessions(v.id, 3)}>
                Giữ 3 phiên mới
              </Button>
            </div>
          );
        })}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mục đã lưu</p>
          {keys === null && <p className="text-sm text-muted-foreground">Đang đọc…</p>}
          {keys?.map((k) => {
            const own = vehicles.some((v) => `apc.v.${v.id}` === k);
            const locked = k === GARAGE_KEY || own;
            return (
              <div key={k} className="flex items-center justify-between gap-2 rounded-lg bg-panel-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">{labelFor(k)}</p>
                  <p className="apc-nums truncate text-[11px] text-muted-foreground">{k}</p>
                </div>
                {!locked && (
                  <button
                    type="button"
                    disabled={busy === k}
                    onClick={() => void del(k)}
                    aria-label={`Xóa ${k}`}
                    className="rounded-md p-2 text-confirmed hover:bg-confirmed/10 disabled:opacity-40"
                  >
                    <IconTrash width={16} height={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

export function VehicleSwitcher() {
  const { vehicles, activeId, setActive } = useApc();
  if (vehicles.length < 2) return null;
  return (
    <div className="apc-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {vehicles.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => setActive(v.id)}
          className={cx(
            "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium",
            v.id === activeId ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground",
          )}
        >
          {vehicleName(v)}
        </button>
      ))}
    </div>
  );
}
