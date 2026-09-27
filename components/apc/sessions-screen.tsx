"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useApc } from "@/contexts/apc-context";
import { DTC_RE, decodeDtc } from "@/lib/apc/knowledge";
import { STAGES, parseDtc, relativeTime, vehicleName, type Session } from "@/lib/apc/types";
import { NewSessionSheet } from "./new-session-sheet";
import { VehicleSwitcher } from "./pieces";
import { Button, Card, EmptyState, Eyebrow, IconChevron, IconPlus, IconScan, IconSearch, SafeReadBadge, SourceBadge, TextInput, cx } from "./ui";

const VERIFY_LABEL: Record<string, { text: string; cls: string }> = {
  fixed: { text: "Đã khắc phục", cls: "bg-ok/15 text-ok" },
  not_fixed: { text: "Chưa khắc phục", cls: "bg-confirmed/15 text-confirmed" },
  monitor: { text: "Cần theo dõi", cls: "bg-probable/15 text-probable" },
};

export function SessionsScreen() {
  const { active, sessions, openSession } = useApc();
  const [newOpen, setNewOpen] = useState(false);
  const sorted = useMemo(() => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt), [sessions]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-4">
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <Eyebrow>Diagnostic Session</Eyebrow>
          <h1 className="truncate text-xl font-bold">{vehicleName(active)}</h1>
        </div>
        <Button onClick={() => setNewOpen(true)} disabled={!active}>
          <IconPlus width={18} height={18} /> Mới
        </Button>
      </header>
      <VehicleSwitcher />
      <DtcLookup />
      {sorted.length === 0 ? (
        <EmptyState
          icon={<IconScan width={34} height={34} />}
          title="Chưa có phiên chẩn đoán"
          body="Mỗi phiên đi qua 5 bước: Dữ liệu → Phân tích → Kiểm tra → Sửa chữa → Xác minh, và được lưu để quay lại bất kỳ lúc nào."
          action={
            active ? (
              <Button onClick={() => setNewOpen(true)}>
                <IconPlus width={18} height={18} /> Bắt đầu phiên
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((s) => (
            <li key={s.id}>
              <SessionRow s={s} onOpen={() => openSession(s.id)} />
            </li>
          ))}
        </ul>
      )}
      {newOpen && <NewSessionSheet onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function SessionRow({ s, onOpen }: { s: Session; onOpen: () => void }) {
  const idx = STAGES.findIndex((x) => x.id === s.stage);
  const v = VERIFY_LABEL[s.verifyStatus];
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-xl border border-border bg-card p-3 text-left hover:border-primary/50">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold">{s.title}</p>
        <IconChevron className="shrink-0 text-muted-foreground" width={16} height={16} />
      </div>
      <p className="apc-nums mt-0.5 truncate text-xs text-probable">
        {s.dtcs.length ? s.dtcs.map((d) => parseDtc(d).code).join(" · ") : "Không có DTC"}
      </p>
      <div className="mt-2 flex items-center gap-1" aria-label={`Bước ${idx + 1}/5`}>
        {STAGES.map((st, i) => (
          <span key={st.id} className={cx("h-1 flex-1 rounded-full", i <= idx ? "bg-primary" : "bg-secondary")} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <SourceBadge source={s.source} />
        <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px]">{STAGES[idx]?.label}</span>
        {v && <span className={cx("rounded-md px-2 py-0.5 text-[11px] font-medium", v.cls)}>{v.text}</span>}
        <span className="ml-auto text-[11px] text-muted-foreground">{relativeTime(s.updatedAt)}</span>
      </div>
    </button>
  );
}

function DtcLookup() {
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const run = () => {
    const c = q.trim().toUpperCase();
    setCode(c);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) run();
  };
  const valid = DTC_RE.test(code);
  const d = valid ? decodeDtc(code) : null;
  return (
    <Card className="p-3">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">Tra nhanh mã lỗi</p>
      <div className="flex gap-2">
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="VD: P0171"
          maxLength={5}
          className="apc-nums uppercase"
          aria-label="Mã lỗi"
        />
        <Button variant="solid" onClick={run} aria-label="Tra mã">
          <IconSearch width={18} height={18} />
        </Button>
      </div>
      {code && !valid && <p className="mt-2 text-xs text-confirmed">Định dạng mã không hợp lệ (VD: P0171, C0035, U0100).</p>}
      {d && (
        <div className="mt-3 rounded-lg bg-panel-2 p-3">
          <div className="flex items-center gap-2">
            <span className="apc-nums text-base font-bold">{d.code}</span>
            {d.safety && <SafeReadBadge />}
          </div>
          <p className="mt-1 text-sm">{d.desc}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {d.group} · {d.system}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Một mã lỗi chỉ là điểm khởi đầu — không thay phụ tùng chỉ dựa trên mã này. Tạo phiên để phân tích cùng Live Data
            và triệu chứng.
          </p>
        </div>
      )}
    </Card>
  );
}
