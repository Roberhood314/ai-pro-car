"use client";

import { useMemo } from "react";
import { useApc } from "@/contexts/apc-context";
import { buildPlan } from "@/lib/apc/upgrade";
import { ASPIRATION_LABEL, GOAL_LABEL, vehicleName, type UpgradeGoal } from "@/lib/apc/types";
import { VehicleSwitcher } from "./pieces";
import { Card, Chip, EmptyState, Eyebrow, IconAlert, IconCheck, IconTurbo } from "./ui";

export function UpgradeScreen() {
  const { active, updateVehicle, sessions } = useApc();
  const plan = useMemo(() => (active ? buildPlan(active, active.goal) : null), [active]);
  const openFaults = sessions.filter((s) => s.dtcs.length > 0 && s.verifyStatus !== "fixed").length;

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-4">
      <header>
        <Eyebrow>Tư vấn nâng cấp động cơ</Eyebrow>
        <h1 className="truncate text-xl font-bold">{vehicleName(active)}</h1>
      </header>
      <VehicleSwitcher />
      <div className="flex gap-2 rounded-lg border border-probable/40 bg-probable/10 p-3 text-xs leading-relaxed">
        <IconAlert className="mt-0.5 shrink-0 text-probable" width={16} height={16} />
        <span>Chỉ tư vấn thông số mục tiêu và quy trình kiểm tra. App không ghi, flash hay remap ECU.</span>
      </div>

      {!active || !plan ? (
        <EmptyState icon={<IconTurbo width={34} height={34} />} title="Chưa chọn xe" body="Thêm xe trong Garage để nhận tư vấn." />
      ) : (
        <>
          <Card className="p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Mục tiêu sử dụng</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GOAL_LABEL) as UpgradeGoal[]).map((g) => (
                <Chip key={g} active={active.goal === g} onClick={() => updateVehicle(active.id, { goal: g })}>
                  {GOAL_LABEL[g]}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Cấu hình: {ASPIRATION_LABEL[active.aspiration]}
              {active.stockHp ? ` · ${active.stockHp} hp gốc` : " · công suất gốc chưa rõ"}
              {active.stockBoost ? ` · boost ${active.stockBoost} bar` : ""}
            </p>
          </Card>

          {openFaults > 0 && (
            <Card className="border-confirmed/50 p-4 text-sm">
              Xe còn {openFaults} phiên có mã lỗi chưa khắc phục. Xử lý lỗi trước khi nâng cấp.
            </Card>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Điều kiện trước khi nâng cấp</h2>
            <Card className="p-3">
              <ul className="flex flex-col gap-1.5 text-xs leading-relaxed">
                {plan.readiness.map((r) => (
                  <li key={r} className="flex gap-2">
                    <IconCheck className="mt-0.5 shrink-0 text-ok" width={14} height={14} />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Thứ tự nâng cấp đề xuất</h2>
            {plan.stages.map((st, i) => (
              <Card key={st.name} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="apc-nums flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold">{st.name}</p>
                  </div>
                  <span className="apc-nums text-xs font-semibold text-primary">{plan.hpEstimate[i]?.range}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {st.gain ? `Ước tính +${Math.round(st.gain[0] * 100)}–${Math.round(st.gain[1] * 100)}% công suất` : ""} · {st.note}
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {st.items.map((it) => (
                    <li key={it.id} className="rounded-lg bg-panel-2 p-2.5">
                      <p className="text-sm font-medium">{it.title}</p>
                      <p className="text-xs text-muted-foreground">{it.why}</p>
                      {it.requires.length > 0 && (
                        <p className="mt-1 text-[11px] text-probable">Đi kèm: {it.requires.join("; ")}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Thông số mục tiêu</h2>
            <Card className="divide-y divide-border">
              {plan.targets.map((t) => (
                <Row key={t.label} {...t} />
              ))}
            </Card>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Giới hạn an toàn</h2>
            <Card className="divide-y divide-border border-confirmed/40">
              {plan.limits.map((t) => (
                <Row key={t.label} {...t} />
              ))}
            </Card>
          </section>

          {plan.missing.length > 0 && (
            <Card className="border-dashed border-need p-4">
              <h2 className="text-sm font-semibold">Cần kiểm tra thêm</h2>
              <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                {plan.missing.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
            </Card>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Rủi ro & điều kiện vận hành</h2>
            <ul className="flex flex-col gap-2">
              {plan.risks.map((r) => (
                <li key={r} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                  <IconAlert className="mt-0.5 shrink-0 text-probable" width={14} height={14} />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
      </div>
      <p className="apc-nums shrink-0 text-right text-xs font-semibold">{value}</p>
    </div>
  );
}
