"use client";

import { useState } from "react";
import { useApc } from "@/contexts/apc-context";
import { testState, type Analysis, type CauseResult } from "@/lib/apc/engine";
import { GENERIC_VERIFY } from "@/lib/apc/knowledge";
import { LEVEL_META, type Level, type Session, type Stage, type VerifyStatus } from "@/lib/apc/types";
import {
  Button,
  Card,
  IconAlert,
  IconCheck,
  IconClose,
  IconShield,
  IconWrench,
  LEVEL_BORDER,
  LevelBadge,
  SafeReadBadge,
  cx,
  inputCls,
} from "../ui";

const LEVELS: Level[] = ["confirmed", "probable", "possible", "need_test"];

function SafetyPanel({ a }: { a: Analysis }) {
  if (!a.safety.length) return null;
  return (
    <Card className="border-ok/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <IconShield className="text-ok" />
        <h3 className="text-sm font-semibold">Hệ thống an toàn</h3>
        <SafeReadBadge />
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        {a.safety.map((d) => (
          <li key={d.code}>
            <span className="apc-nums font-semibold">{d.code}</span> — {d.desc}{" "}
            <span className="text-muted-foreground">({d.system})</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Chế độ chỉ đọc: app không đưa thao tác can thiệp hay thay đổi cấu hình cho phanh, ABS, túi khí. Đưa xe đến kỹ thuật
        viên có thiết bị chuyên dụng của hãng.
      </p>
    </Card>
  );
}

function Warnings({ a }: { a: Analysis }) {
  if (!a.warnings.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {a.warnings.map((w) => (
        <div key={w} className="flex gap-2 rounded-lg border border-probable/40 bg-probable/10 p-3 text-xs leading-relaxed">
          <IconAlert className="mt-0.5 shrink-0 text-probable" width={16} height={16} />
          <span className="text-pretty">{w}</span>
        </div>
      ))}
    </div>
  );
}

function CauseCard({ c }: { c: CauseResult }) {
  const lvl = c.level === "ruled_out" ? null : c.level;
  return (
    <div className={cx("rounded-xl border bg-card p-3", lvl ? LEVEL_BORDER[lvl] : "border-border opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-pretty">{c.cause.title}</p>
          <p className="text-[11px] text-muted-foreground">{c.cause.system}</p>
        </div>
        {lvl ? (
          <LevelBadge level={lvl} />
        ) : (
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">Đã loại trừ</span>
        )}
      </div>
      {c.evidence.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {c.evidence.map((e) => (
            <li key={e} className="flex gap-1.5 text-xs leading-relaxed">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
              <span>{e}</span>
            </li>
          ))}
        </ul>
      )}
      {c.confirmedBy && (
        <p className="mt-2 text-xs text-confirmed">Xác nhận bởi kiểm tra: {c.confirmedBy.action}</p>
      )}
      {c.basis.length > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">Nguồn bằng chứng: {c.basis.join(" + ")}</p>
      )}
      {c.capped && (
        <p className="mt-1 text-[11px] text-probable">Hạ mức vì chỉ có một mã lỗi — chưa đủ nguồn độc lập.</p>
      )}
      {c.missing.length > 0 && c.level !== "confirmed" && (
        <p className="mt-1 text-[11px] text-need">Còn thiếu: {c.missing.join(", ")}</p>
      )}
    </div>
  );
}

export function AnalysisStep({ a }: { a: Analysis }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kết luận tóm tắt</p>
        <p className="mt-1 text-base font-semibold leading-snug text-pretty">{a.summary}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Bước tiếp theo: </span>
          {a.next}
        </p>
      </Card>
      <Warnings a={a} />
      <SafetyPanel a={a} />
      {LEVELS.map((l) =>
        a.byLevel[l].length ? (
          <section key={l} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">{LEVEL_META[l].label}</h3>
              <span className="text-[11px] text-muted-foreground">{LEVEL_META[l].blurb}</span>
            </div>
            {a.byLevel[l].map((c) => (
              <CauseCard key={c.cause.id} c={c} />
            ))}
          </section>
        ) : null,
      )}
      {a.ruledOut.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Đã loại trừ qua kiểm tra</h3>
          {a.ruledOut.map((c) => (
            <CauseCard key={c.cause.id} c={c} />
          ))}
        </section>
      )}
      {a.missingData.length > 0 && (
        <Card className="border-dashed border-need p-4">
          <h3 className="text-sm font-semibold">Cần kiểm tra thêm — dữ liệu còn thiếu</h3>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            {a.missingData.map((m) => (
              <li key={m}>• {m}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function TestingStep({ s, a }: { s: Session; a: Analysis }) {
  const { updateSession } = useApc();
  const active = a.causes.filter((c) => c.cause.tests.length > 0);
  const [open, setOpen] = useState<string>(() => active.find((c) => c.level !== "ruled_out" && c.level !== "confirmed")?.cause.id ?? "");

  const mark = (stepId: string, m: "ok" | "bad" | null) => {
    const tests = { ...s.tests };
    if (m) tests[stepId] = m;
    else delete tests[stepId];
    updateSession(s.id, { tests });
  };
  const reset = (c: CauseResult) => {
    const tests = { ...s.tests };
    for (const t of c.cause.tests) delete tests[t.id];
    updateSession(s.id, { tests });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Thực hiện theo thứ tự. “Bất thường” ở một bước sẽ xác nhận nguyên nhân; tất cả “Bình thường” sẽ loại trừ nguyên nhân.
      </p>
      <SafetyPanel a={a} />
      {active.length === 0 && (
        <Card className="border-dashed border-need p-4 text-sm text-muted-foreground">
          Chưa có nguyên nhân để kiểm tra. Cần kiểm tra thêm — bổ sung dữ liệu ở bước Dữ liệu.
        </Card>
      )}
      {active.map((c) => {
        const ts = testState(c.cause, s.tests);
        const isOpen = open === c.cause.id;
        const done = c.cause.tests.filter((t) => s.tests[t.id]).length;
        return (
          <div key={c.cause.id} className={cx("rounded-xl border bg-card", c.level === "ruled_out" ? "border-border" : LEVEL_BORDER[c.level])}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? "" : c.cause.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-2 p-3 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{c.cause.title}</p>
                <p className="apc-nums text-[11px] text-muted-foreground">
                  {done}/{c.cause.tests.length} bước
                </p>
              </div>
              {c.level === "ruled_out" ? (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">Đã loại trừ</span>
              ) : (
                <LevelBadge level={c.level} />
              )}
            </button>
            {isOpen && (
              <ol className="flex flex-col gap-2 border-t border-border p-3">
                {c.cause.tests.map((t, i) => {
                  const m = s.tests[t.id];
                  const reachable = m || i === ts.nextIndex;
                  return (
                    <li
                      key={t.id}
                      className={cx(
                        "rounded-lg p-3",
                        reachable ? "bg-panel-2" : "bg-panel-2/40 opacity-50",
                        i === ts.nextIndex && "ring-1 ring-primary/60",
                      )}
                    >
                      <div className="flex gap-2">
                        <span
                          className={cx(
                            "apc-nums flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            m === "ok" ? "bg-ok/20 text-ok" : m === "bad" ? "bg-confirmed/20 text-confirmed" : "bg-secondary",
                          )}
                        >
                          {m === "ok" ? <IconCheck width={14} height={14} /> : m === "bad" ? <IconClose width={14} height={14} /> : i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug">{t.action}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            <span className="font-semibold">Dụng cụ:</span> {t.tool}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            <span className="font-semibold">Giá trị mong đợi:</span> {t.expected}
                          </p>
                        </div>
                      </div>
                      {i === ts.nextIndex && !m && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button variant="outline" onClick={() => mark(t.id, "ok")}>
                            Bình thường
                          </Button>
                          <Button variant="danger" onClick={() => mark(t.id, "bad")}>
                            Bất thường
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
                {done > 0 && (
                  <Button variant="ghost" onClick={() => reset(c)}>
                    Làm lại kiểm tra
                  </Button>
                )}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
}

const KIND_LABEL = { repair: "Sửa chữa", replace: "Thay thế", repair_first: "Ưu tiên sửa / vệ sinh" } as const;

export function RepairStep({ s, a, go }: { s: Session; a: Analysis; go: (st: Stage) => void }) {
  const { updateSession } = useApc();
  const confirmed = a.byLevel.confirmed;
  const pending = [...a.byLevel.probable, ...a.byLevel.possible];
  const toggle = (id: string) =>
    updateSession(s.id, {
      repairsDone: s.repairsDone.includes(id) ? s.repairsDone.filter((x) => x !== id) : [...s.repairsDone, id],
    });

  return (
    <div className="flex flex-col gap-4">
      <SafetyPanel a={a} />
      {confirmed.length === 0 ? (
        <Card className="border-dashed border-need p-4">
          <p className="text-sm font-semibold">Chưa có nguyên nhân đã xác nhận</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            App không đề xuất thay phụ tùng khi chưa có bằng chứng kiểm tra. Hoàn tất quy trình kiểm tra trước.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => go("testing")}>
            Đến bước Kiểm tra
          </Button>
        </Card>
      ) : (
        confirmed.map((c) => {
          const done = s.repairsDone.includes(c.cause.id);
          return (
            <Card key={c.cause.id} className="border-confirmed/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconWrench className="text-primary" />
                  <p className="text-sm font-semibold">{c.cause.title}</p>
                </div>
                <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {KIND_LABEL[c.cause.repair.kind]}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{c.cause.repair.action}</p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lý do</p>
              <ul className="mt-1 flex flex-col gap-1 text-xs leading-relaxed">
                {c.confirmedBy && <li>• Kiểm tra bất thường: {c.confirmedBy.action}</li>}
                {c.evidence.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
              {c.cause.repair.precheck.length > 0 && (
                <>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Kiểm tra lại trước khi thay
                  </p>
                  <ul className="mt-1 flex flex-col gap-1 text-xs leading-relaxed">
                    {c.cause.repair.precheck.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                </>
              )}
              <Button variant={done ? "solid" : "primary"} block className="mt-4" onClick={() => toggle(c.cause.id)}>
                {done ? (
                  <>
                    <IconCheck width={16} height={16} /> Đã thực hiện
                  </>
                ) : (
                  "Đánh dấu đã sửa"
                )}
              </Button>
            </Card>
          );
        })
      )}
      {pending.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold">Chưa đủ bằng chứng để sửa</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {pending.map((c) => (
              <li key={c.cause.id} className="flex items-center justify-between gap-2 text-xs">
                <span>{c.cause.title}</span>
                <LevelBadge level={c.level as Level} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">Hoàn tất kiểm tra để xác nhận hoặc loại trừ.</p>
        </Card>
      )}
    </div>
  );
}

const STATUS_OPTS: { id: Exclude<VerifyStatus, "">; label: string; cls: string }[] = [
  { id: "fixed", label: "Đã khắc phục", cls: "border-ok bg-ok/15 text-ok" },
  { id: "monitor", label: "Cần theo dõi", cls: "border-probable bg-probable/15 text-probable" },
  { id: "not_fixed", label: "Chưa khắc phục", cls: "border-confirmed bg-confirmed/15 text-confirmed" },
];

export function VerifyStep({ s, a }: { s: Session; a: Analysis }) {
  const { updateSession, toast } = useApc();
  const [note, setNote] = useState(s.verifyNote);
  const items: { id: string; text: string }[] = [
    ...GENERIC_VERIFY.map((t, i) => ({ id: `g:${i}`, text: t })),
    ...a.byLevel.confirmed.flatMap((c) => c.cause.verify.map((t, i) => ({ id: `${c.cause.id}:${i}`, text: t }))),
  ];
  const toggle = (id: string) =>
    updateSession(s.id, {
      verifyChecks: s.verifyChecks.includes(id) ? s.verifyChecks.filter((x) => x !== id) : [...s.verifyChecks, id],
    });
  const setStatus = (v: VerifyStatus) => {
    updateSession(s.id, { verifyStatus: v, verifyNote: note.slice(0, 500) });
    toast("Đã lưu kết quả xác minh.");
  };
  const doneCount = items.filter((i) => s.verifyChecks.includes(i.id)).length;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Quy trình xác minh sau sửa</h3>
          <span className="apc-nums text-xs text-muted-foreground">
            {doneCount}/{items.length}
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {items.map((it) => {
            const on = s.verifyChecks.includes(it.id);
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => toggle(it.id)}
                  aria-pressed={on}
                  className="flex w-full items-start gap-2.5 rounded-lg bg-panel-2 p-2.5 text-left text-sm"
                >
                  <span
                    className={cx(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {on && <IconCheck width={14} height={14} />}
                  </span>
                  <span className={cx("leading-snug", on && "text-muted-foreground line-through")}>{it.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Ghi chú xác minh</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          onBlur={() => note !== s.verifyNote && updateSession(s.id, { verifyNote: note })}
          rows={3}
          placeholder="Giá trị sau sửa, mã có tái xuất hiện không…"
          className={cx(inputCls, "resize-none leading-relaxed")}
        />
      </Card>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Kết quả</p>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setStatus(o.id)}
              aria-pressed={s.verifyStatus === o.id}
              className={cx(
                "rounded-lg border px-2 py-3 text-xs font-semibold",
                s.verifyStatus === o.id ? o.cls : "border-border text-muted-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        {s.verifyStatus === "fixed" && doneCount < GENERIC_VERIFY.length && (
          <p className="text-[11px] text-probable">
            Chưa hoàn tất các bước xác minh chung — nên theo dõi thêm để chắc chắn lỗi không tái xuất hiện.
          </p>
        )}
      </div>
    </div>
  );
}
