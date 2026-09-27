"use client";

import { useState, type KeyboardEvent } from "react";
import { useApc } from "@/contexts/apc-context";
import { DTC_RE, PIDS, SYMPTOMS, decodeDtc } from "@/lib/apc/knowledge";
import { parseDtc, type DtcStatus, type PidId, type Readings, type Session, type Vehicle } from "@/lib/apc/types";
import { ASPIRATION_LABEL, FUEL_LABEL, TRANS_LABEL, vehicleName } from "@/lib/apc/types";
import { Button, Card, Chip, IconClose, IconPlus, SafeReadBadge, TextInput, cx, inputCls } from "../ui";

const FREEZE_PIDS: PidId[] = ["rpm", "ect", "load", "stft1", "ltft1", "map", "maf", "iat", "speed"];

export function DataStep({ s, vehicle }: { s: Session; vehicle: Vehicle | null }) {
  const { updateSession, toast } = useApc();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<DtcStatus>("current");

  const addDtc = () => {
    const c = code.trim().toUpperCase();
    if (!DTC_RE.test(c)) {
      toast("Mã không hợp lệ. Ví dụ: P0171, C0035, U0100.");
      return;
    }
    if (s.dtcs.some((d) => parseDtc(d).code === c)) {
      toast("Mã đã có trong danh sách.");
      return;
    }
    if (s.dtcs.length >= 20) return;
    updateSession(s.id, { dtcs: [...s.dtcs, `${c}:${status}`] });
    setCode("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) addDtc();
  };
  const removeDtc = (c: string) => {
    const dtcs = s.dtcs.filter((d) => parseDtc(d).code !== c);
    updateSession(s.id, { dtcs, freezeDtc: s.freezeDtc === c ? "" : s.freezeDtc });
  };

  const toggleSym = (id: string) =>
    updateSession(s.id, {
      symptoms: s.symptoms.includes(id) ? s.symptoms.filter((x) => x !== id) : [...s.symptoms, id],
    });

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Thông tin xe</h3>
        {vehicle ? (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <Info k="Xe" v={vehicleName(vehicle)} />
            <Info k="Động cơ" v={vehicle.engine || "Cần kiểm tra thêm"} />
            <Info k="Dung tích" v={vehicle.displacement ? `${vehicle.displacement} L` : "Cần kiểm tra thêm"} />
            <Info k="Nạp khí" v={ASPIRATION_LABEL[vehicle.aspiration]} />
            <Info k="Hộp số" v={TRANS_LABEL[vehicle.transmission]} />
            <Info k="Nhiên liệu" v={FUEL_LABEL[vehicle.fuel]} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Xe đã bị xóa khỏi garage.</p>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">DTC — mã lỗi</h3>
        <div className="flex gap-2">
          <TextInput
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKey}
            placeholder="P0171"
            maxLength={5}
            className="apc-nums uppercase"
            aria-label="Mã lỗi"
          />
          <select
            aria-label="Trạng thái mã"
            value={status}
            onChange={(e) => setStatus(e.target.value as DtcStatus)}
            className={cx(inputCls, "w-32 shrink-0")}
          >
            <option value="current">Hiện hành</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="history">Lịch sử</option>
          </select>
          <Button variant="solid" onClick={addDtc} aria-label="Thêm mã">
            <IconPlus width={18} height={18} />
          </Button>
        </div>
        {s.dtcs.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {s.dtcs.map((e) => {
              const p = parseDtc(e);
              const d = decodeDtc(p.code);
              return (
                <li key={p.code} className="flex items-center gap-2 rounded-lg bg-panel-2 px-3 py-2">
                  <span className="apc-nums text-sm font-bold">{p.code}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{d.desc}</span>
                  {d.safety && <SafeReadBadge />}
                  <button
                    type="button"
                    onClick={() => removeDtc(p.code)}
                    aria-label={`Xóa ${p.code}`}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    <IconClose width={16} height={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold">Live Data — giá trị cảm biến</h3>
        <p className="mb-3 text-[11px] text-muted-foreground">Để trống giá trị chưa đo. Dải tham khảo chung, máy nóng, không tải.</p>
        <ReadingsEditor
          key={`s-${s.id}`}
          pids={PIDS.map((p) => p.id)}
          values={s.sensors}
          onCommit={(r) => updateSession(s.id, { sensors: r })}
        />
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold">Freeze Frame</h3>
        <p className="mb-3 text-[11px] text-muted-foreground">Ảnh chụp dữ liệu tại thời điểm ECU ghi mã lỗi.</p>
        <select
          aria-label="Mã gắn với Freeze Frame"
          value={s.freezeDtc}
          onChange={(e) => updateSession(s.id, { freezeDtc: e.target.value })}
          className={cx(inputCls, "mb-3")}
        >
          <option value="">— Chọn mã lỗi —</option>
          {s.dtcs.map((e) => {
            const c = parseDtc(e).code;
            return (
              <option key={c} value={c}>
                {c}
              </option>
            );
          })}
        </select>
        <ReadingsEditor
          key={`f-${s.id}`}
          pids={FREEZE_PIDS}
          values={s.freeze}
          onCommit={(r) => updateSession(s.id, { freeze: r })}
        />
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Triệu chứng</h3>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((sym) => (
            <Chip key={sym.id} active={s.symptoms.includes(sym.id)} onClick={() => toggleSym(sym.id)}>
              {sym.label}
            </Chip>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold">Ghi chú</h3>
        <NotesField key={s.id} initial={s.notes} onCommit={(notes) => updateSession(s.id, { notes })} />
      </Card>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate font-medium">{v}</dd>
    </div>
  );
}

function ReadingsEditor({
  pids,
  values,
  onCommit,
}: {
  pids: PidId[];
  values: Readings;
  onCommit: (r: Readings) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    for (const id of pids) d[id] = values[id] != null ? String(values[id]) : "";
    return d;
  });
  const commit = () => {
    const out: Readings = {};
    for (const id of Object.keys(values) as PidId[]) if (!pids.includes(id)) out[id] = values[id];
    for (const id of pids) {
      const raw = (draft[id] ?? "").trim().replace(",", ".");
      if (!raw) continue;
      const n = Number(raw);
      if (Number.isFinite(n)) out[id] = n;
    }
    onCommit(out);
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {pids.map((id) => {
        const p = PIDS.find((x) => x.id === id);
        if (!p) return null;
        return (
          <label key={id} className="flex flex-col gap-1 rounded-lg bg-panel-2 p-2">
            <span className="truncate text-[11px] text-muted-foreground">{p.label}</span>
            <span className="flex items-center gap-1">
              <input
                inputMode="decimal"
                value={draft[id] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [id]: e.target.value }))}
                onBlur={commit}
                placeholder="—"
                className="apc-nums w-full min-w-0 bg-transparent text-base font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              <span className="shrink-0 text-[11px] text-muted-foreground">{p.unit}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function NotesField({ initial, onCommit }: { initial: string; onCommit: (v: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <textarea
      value={v}
      onChange={(e) => setV(e.target.value.slice(0, 1000))}
      onBlur={() => v !== initial && onCommit(v)}
      rows={3}
      placeholder="Điều kiện xuất hiện lỗi, lịch sử sửa chữa…"
      className={cx(inputCls, "resize-none leading-relaxed")}
    />
  );
}
