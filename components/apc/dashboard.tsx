"use client";

import { useMemo, useState } from "react";
import { useApc } from "@/contexts/apc-context";
import { analyze, vehicleHealth, type Health } from "@/lib/apc/engine";
import { PIDS } from "@/lib/apc/knowledge";
import { ASPIRATION_LABEL, FUEL_LABEL, relativeTime, vehicleName, type Level } from "@/lib/apc/types";
import { DeviceSheet, NewSessionSheet } from "./new-session-sheet";
import { Logo, VehicleSwitcher } from "./pieces";
import { SAMPLE_VEHICLE, VehicleEditor } from "./vehicle-editor";
import {
  Button,
  Card,
  EmptyState,
  Eyebrow,
  IconAlert,
  IconCar,
  IconChevron,
  IconPlug,
  IconPlus,
  IconShield,
  IconSpark,
  LevelBadge,
  SafeReadBadge,
  SourceBadge,
  cx,
} from "./ui";

export function Dashboard() {
  const { active, sessions, openSession, addVehicle } = useApc();
  const [newOpen, setNewOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const latest = useMemo(() => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null, [sessions]);
  const analysis = useMemo(() => (latest ? analyze(latest, active) : null), [latest, active]);
  const health = vehicleHealth(latest, analysis);
  const inProgress = latest && latest.verifyStatus !== "fixed" && latest.verifyStatus !== "not_fixed" ? latest : null;

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-4">
      <header className="flex items-center justify-between">
        <Logo small />
        <button
          type="button"
          onClick={() => setDevOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-need px-2.5 py-1.5 text-xs text-muted-foreground"
        >
          <IconPlug width={14} height={14} />
          Chưa kết nối OBD
        </button>
      </header>

      {!active ? (
        <EmptyState
          icon={<IconCar width={36} height={36} />}
          title="Garage đang trống"
          body="Khai báo xe để bắt đầu chẩn đoán. Mỗi xe có lịch sử, mã lỗi và phiên chẩn đoán riêng."
          action={
            <div className="flex w-full flex-col gap-2">
              <Button block onClick={() => setAddOpen(true)}>
                <IconPlus width={18} height={18} /> Thêm xe
              </Button>
              <Button variant="outline" block onClick={() => addVehicle(SAMPLE_VEHICLE)}>
                Dùng xe mẫu (Toyota Vios 2019)
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <VehicleSwitcher />
          <section aria-label="Vehicle Health">
            <Card className="apc-grid-bg overflow-hidden p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Eyebrow>Xe đang chọn</Eyebrow>
                  <h1 className="truncate text-xl font-bold text-balance">{vehicleName(active)}</h1>
                  <p className="text-xs text-muted-foreground">
                    {[active.engine, active.displacement ? `${active.displacement} L` : "", ASPIRATION_LABEL[active.aspiration], FUEL_LABEL[active.fuel]]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {latest && <SourceBadge source={latest.source} className="shrink-0" />}
              </div>
              <HealthGauge health={health} />
              {latest ? (
                <p className="text-center text-xs text-muted-foreground">
                  Theo phiên “{latest.title}” · {relativeTime(latest.updatedAt)}
                </p>
              ) : (
                <p className="text-center text-xs text-muted-foreground">Chưa có phiên chẩn đoán nào cho xe này.</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button onClick={() => setNewOpen(true)}>
                  <IconPlus width={18} height={18} /> Phiên mới
                </Button>
                <Button variant="outline" disabled={!inProgress} onClick={() => inProgress && openSession(inProgress.id)}>
                  Tiếp tục phiên
                </Button>
              </div>
            </Card>
          </section>

          {analysis && latest && (
            <>
              <section aria-label="AI Diagnosis">
                <Card className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <IconSpark className="text-primary" />
                    <h2 className="text-sm font-semibold">AI Diagnosis</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-pretty">{analysis.summary}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Tiếp theo: </span>
                    {analysis.next}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(["confirmed", "probable", "possible", "need_test"] as Level[]).map((l) =>
                      analysis.byLevel[l].length ? (
                        <span key={l} className="flex items-center gap-1">
                          <LevelBadge level={l} />
                          <span className="apc-nums text-xs text-muted-foreground">×{analysis.byLevel[l].length}</span>
                        </span>
                      ) : null,
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openSession(latest.id)}
                    className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    Mở phiên chi tiết <IconChevron width={14} height={14} />
                  </button>
                </Card>
              </section>

              <section aria-label="DTC">
                <Card className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">DTC</h2>
                    <span className="apc-nums text-xs text-muted-foreground">{analysis.dtcs.length} mã</span>
                  </div>
                  {analysis.dtcs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có mã lỗi trong phiên gần nhất.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {analysis.dtcs.map((d) => (
                        <li key={d.code} className="flex items-start gap-3 rounded-lg bg-panel-2 p-2.5">
                          <span
                            className={cx(
                              "apc-nums shrink-0 rounded-md px-2 py-1 text-sm font-bold",
                              d.severity === "high" ? "bg-confirmed/15 text-confirmed" : d.severity === "med" ? "bg-probable/15 text-probable" : "bg-secondary text-foreground",
                            )}
                          >
                            {d.code}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug">{d.desc}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {d.system} · {d.status === "current" ? "Hiện hành" : d.status === "pending" ? "Chờ xác nhận" : "Lịch sử"}
                            </p>
                          </div>
                          {d.safety && <SafeReadBadge />}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </section>

              <section aria-label="Cảnh báo">
                <Card className="p-4">
                  <h2 className="mb-3 text-sm font-semibold">Cảnh báo</h2>
                  {analysis.flags.length === 0 && analysis.safety.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có giá trị cảm biến ngoài dải tham khảo.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {analysis.safety.map((d) => (
                        <li key={d.code} className="flex gap-2 text-sm">
                          <IconShield className="mt-0.5 shrink-0 text-ok" width={16} height={16} />
                          <span>
                            <span className="apc-nums font-semibold">{d.code}</span> — hệ thống an toàn. Chỉ đọc; đưa xe đến
                            kỹ thuật viên có thiết bị chuyên dụng.
                          </span>
                        </li>
                      ))}
                      {analysis.flags.map((f) => (
                        <li key={f.pid + f.from} className="flex gap-2 text-sm">
                          <IconAlert className="mt-0.5 shrink-0 text-probable" width={16} height={16} />
                          <span>
                            {f.label}: <span className="apc-nums font-semibold">{f.value}</span> {f.unit} —{" "}
                            {f.state === "high" ? "cao hơn" : "thấp hơn"} dải tham khảo
                            {f.from === "freeze" ? " (Freeze Frame)" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </section>

              <section aria-label="Live Data">
                <Card className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Live Data</h2>
                    <SourceBadge source={latest.source} />
                  </div>
                  <LiveGrid readings={latest.sensors} />
                </Card>
              </section>
            </>
          )}
        </>
      )}

      {newOpen && <NewSessionSheet onClose={() => setNewOpen(false)} />}
      {devOpen && <DeviceSheet onClose={() => setDevOpen(false)} />}
      {addOpen && <VehicleEditor onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function HealthGauge({ health }: { health: Health }) {
  const r = 70;
  const len = Math.PI * r;
  const pct = health.score == null ? 0 : health.score / 100;
  const color =
    health.tone === "ok" ? "var(--ok)" : health.tone === "warn" ? "var(--probable)" : health.tone === "bad" ? "var(--confirmed)" : "var(--need)";
  return (
    <div className="my-2 flex flex-col items-center">
      <svg viewBox="0 0 180 104" className="w-56" role="img" aria-label={`Vehicle Health: ${health.label}`}>
        <path d="M20 94 A70 70 0 0 1 160 94" fill="none" stroke="var(--secondary)" strokeWidth="12" strokeLinecap="round" />
        {Array.from({ length: 11 }).map((_, i) => {
          const a = Math.PI - (i / 10) * Math.PI;
          const x1 = 90 + Math.cos(a) * 54;
          const y1 = 94 - Math.sin(a) * 54;
          const x2 = 90 + Math.cos(a) * 49;
          const y2 = 94 - Math.sin(a) * 49;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border)" strokeWidth="1.5" />;
        })}
        <path
          d="M20 94 A70 70 0 0 1 160 94"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${len * pct} ${len}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="90" y="82" textAnchor="middle" className="apc-nums" fill="var(--foreground)" fontSize="30" fontWeight="700">
          {health.score ?? "--"}
        </text>
      </svg>
      <p className="-mt-1 text-sm font-semibold" style={{ color }}>
        Vehicle Health · {health.label}
      </p>
    </div>
  );
}

export function LiveGrid({ readings }: { readings: Partial<Record<string, number>> }) {
  const rows = PIDS.filter((p) => readings[p.id] != null);
  if (!rows.length) return <p className="text-sm text-muted-foreground">Chưa có giá trị cảm biến. Cần kiểm tra thêm.</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map((p) => {
        const v = readings[p.id] as number;
        const out = (p.min != null && v < p.min) || (p.max != null && v > p.max);
        const ranged = p.min != null || p.max != null;
        return (
          <div
            key={p.id}
            className={cx("rounded-lg border bg-panel-2 p-2.5", out ? "border-probable/60" : "border-transparent")}
          >
            <p className="truncate text-[11px] text-muted-foreground">{p.label}</p>
            <p className={cx("apc-nums text-lg font-bold", out ? "text-probable" : "text-foreground")}>
              {v}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{p.unit}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {ranged ? `Tham khảo ${p.min ?? "…"}–${p.max ?? "…"}` : "Tra theo tài liệu hãng"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
