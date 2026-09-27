"use client";

import { useMemo, useState } from "react";
import { useApc } from "@/contexts/apc-context";
import { analyze } from "@/lib/apc/engine";
import { STAGES, vehicleName, type Stage } from "@/lib/apc/types";
import { Button, IconBack, IconChevron, IconTrash, Overlay, SourceBadge, cx } from "../ui";
import { DataStep } from "./data-step";
import { AnalysisStep, RepairStep, TestingStep, VerifyStep } from "./result-steps";

export function SessionScreen({ id }: { id: string }) {
  const { getSession, vehicles, updateSession, deleteSession, openSession } = useApc();
  const s = getSession(id);
  const vehicle = vehicles.find((v) => v.id === s?.vehicleId) ?? null;
  const a = useMemo(() => (s ? analyze(s, vehicle) : null), [s, vehicle]);
  const [confirmDel, setConfirmDel] = useState(false);

  if (!s || !a) return null;
  const idx = STAGES.findIndex((x) => x.id === s.stage);
  const go = (st: Stage) => {
    updateSession(s.id, { stage: st });
    document.getElementById("apc-session-scroll")?.scrollTo({ top: 0 });
  };

  return (
    <Overlay>
      <header className="flex items-center gap-2 border-b border-border px-2 py-2">
        <button
          type="button"
          onClick={() => openSession(null)}
          aria-label="Quay lại"
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
        >
          <IconBack />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{s.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{vehicleName(vehicle)}</p>
        </div>
        <SourceBadge source={s.source} />
        <button
          type="button"
          onClick={() => {
            if (confirmDel) deleteSession(s.id);
            else {
              setConfirmDel(true);
              setTimeout(() => setConfirmDel(false), 3000);
            }
          }}
          aria-label={confirmDel ? "Nhấn lần nữa để xóa" : "Xóa phiên"}
          className={cx("rounded-md p-2", confirmDel ? "bg-confirmed/15 text-confirmed" : "text-muted-foreground hover:bg-secondary")}
        >
          <IconTrash width={18} height={18} />
        </button>
      </header>

      <nav aria-label="Các bước chẩn đoán" className="border-b border-border px-3 py-2">
        <ol className="flex items-center gap-1">
          {STAGES.map((st, i) => (
            <li key={st.id} className="flex flex-1 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => go(st.id)}
                aria-current={i === idx ? "step" : undefined}
                className="flex w-full flex-col items-center gap-1"
              >
                <span className={cx("h-1 w-full rounded-full", i < idx ? "bg-primary/60" : i === idx ? "bg-primary" : "bg-secondary")} />
                <span className={cx("text-[10px] font-semibold", i === idx ? "text-primary" : "text-muted-foreground")}>
                  {st.short}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div id="apc-session-scroll" className="flex-1 overflow-y-auto px-4 py-4">
        <h2 className="mb-3 text-lg font-bold">
          {idx + 1}. {STAGES[idx].label}
        </h2>
        {s.stage === "data" && <DataStep s={s} vehicle={vehicle} />}
        {s.stage === "analysis" && <AnalysisStep a={a} />}
        {s.stage === "testing" && <TestingStep key={s.id} s={s} a={a} />}
        {s.stage === "repair" && <RepairStep s={s} a={a} go={go} />}
        {s.stage === "verify" && <VerifyStep key={s.id} s={s} a={a} />}
      </div>

      <footer className="flex gap-2 border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="outline" disabled={idx === 0} onClick={() => go(STAGES[idx - 1].id)}>
          <IconBack width={16} height={16} /> Trước
        </Button>
        {idx < STAGES.length - 1 ? (
          <Button className="flex-1" onClick={() => go(STAGES[idx + 1].id)} disabled={s.stage === "data" && !a.hasData}>
            {STAGES[idx + 1].label} <IconChevron width={16} height={16} />
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => openSession(null)}>
            Đóng phiên
          </Button>
        )}
      </footer>
    </Overlay>
  );
}
