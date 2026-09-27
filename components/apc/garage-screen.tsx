"use client";

import { useState } from "react";
import { useApc } from "@/contexts/apc-context";
import { ASPIRATION_LABEL, TRANS_LABEL, vehicleName, type Vehicle } from "@/lib/apc/types";
import { StorageSheet } from "./pieces";
import { SAMPLE_VEHICLE, VehicleEditor } from "./vehicle-editor";
import { Button, Card, EmptyState, Eyebrow, Field, IconCar, IconDatabase, IconEdit, IconPlus, IconTrash, Sheet, TextInput, cx } from "./ui";

export function GarageScreen() {
  const { vehicles, activeId, setActive, dataFor, removeVehicle, addVehicle, active, addMaint, removeMaint } = useApc();
  const [editing, setEditing] = useState<Vehicle | null | undefined>(undefined);
  const [confirmId, setConfirmId] = useState("");
  const [maintOpen, setMaintOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const maint = active ? dataFor(active.id).maint : [];

  return (
    <div className="flex flex-col gap-4 px-4 pb-28 pt-4">
      <header className="flex items-center justify-between">
        <div>
          <Eyebrow>Garage</Eyebrow>
          <h1 className="text-xl font-bold">{vehicles.length} xe</h1>
        </div>
        <Button onClick={() => setEditing(null)}>
          <IconPlus width={18} height={18} /> Thêm xe
        </Button>
      </header>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={<IconCar width={34} height={34} />}
          title="Chưa có xe"
          body="Mỗi xe giữ lịch sử, mã lỗi, bảo dưỡng và phiên chẩn đoán độc lập."
          action={
            <Button variant="outline" onClick={() => addVehicle(SAMPLE_VEHICLE)}>
              Dùng xe mẫu
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {vehicles.map((v) => {
            const d = dataFor(v.id);
            const on = v.id === activeId;
            return (
              <li key={v.id}>
                <Card className={cx("p-3", on && "border-primary/70")}>
                  <button type="button" onClick={() => setActive(v.id)} className="flex w-full items-start gap-3 text-left">
                    <span
                      className={cx(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        on ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <IconCar />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{vehicleName(v)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[v.engine, ASPIRATION_LABEL[v.aspiration], TRANS_LABEL[v.transmission]].filter(Boolean).join(" · ")}
                      </span>
                      <span className="apc-nums mt-1 block text-[11px] text-muted-foreground">
                        {d.sessions.length} phiên · {d.maint.length} bảo dưỡng
                        {v.odo != null ? ` · ${v.odo.toLocaleString("vi-VN")} km` : ""}
                      </span>
                    </span>
                    {on && <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">Đang chọn</span>}
                  </button>
                  <div className="mt-3 flex gap-2">
                    <Button variant="ghost" className="flex-1" onClick={() => setEditing(v)}>
                      <IconEdit width={16} height={16} /> Sửa
                    </Button>
                    <Button
                      variant={confirmId === v.id ? "danger" : "ghost"}
                      className="flex-1"
                      onClick={() => {
                        if (confirmId === v.id) {
                          removeVehicle(v.id);
                          setConfirmId("");
                        } else {
                          setConfirmId(v.id);
                          setTimeout(() => setConfirmId((c) => (c === v.id ? "" : c)), 3000);
                        }
                      }}
                    >
                      <IconTrash width={16} height={16} /> {confirmId === v.id ? "Xác nhận xóa" : "Xóa"}
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {active && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Lịch sử bảo dưỡng</h2>
              <p className="truncate text-[11px] text-muted-foreground">{vehicleName(active)}</p>
            </div>
            <Button variant="solid" onClick={() => setMaintOpen(true)}>
              <IconPlus width={16} height={16} /> Thêm
            </Button>
          </div>
          {maint.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa ghi nhận bảo dưỡng.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {maint.map((m) => (
                <li key={m.id} className="flex items-start gap-2 rounded-lg bg-panel-2 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{m.item}</p>
                    <p className="apc-nums text-[11px] text-muted-foreground">
                      {m.date}
                      {m.km != null ? ` · ${m.km.toLocaleString("vi-VN")} km` : ""}
                    </p>
                    {m.note && <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMaint(m.id)}
                    aria-label={`Xóa ${m.item}`}
                    className="rounded p-1.5 text-muted-foreground hover:text-confirmed"
                  >
                    <IconTrash width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <button
        type="button"
        onClick={() => setStorageOpen(true)}
        className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <IconDatabase width={14} height={14} /> Quản lý dung lượng lưu trữ
      </button>

      {editing !== undefined && <VehicleEditor vehicle={editing ?? undefined} onClose={() => setEditing(undefined)} />}
      {maintOpen && (
        <MaintSheet
          onClose={() => setMaintOpen(false)}
          onSave={(m) => {
            addMaint(m);
            setMaintOpen(false);
          }}
        />
      )}
      {storageOpen && <StorageSheet onClose={() => setStorageOpen(false)} />}
    </div>
  );
}

function MaintSheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (m: { date: string; km: number | null; item: string; note: string }) => void;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [km, setKm] = useState("");
  const [item, setItem] = useState("");
  const [note, setNote] = useState("");
  const presets = ["Thay dầu máy", "Lọc gió", "Bugi", "Nước làm mát", "Dầu phanh", "Lọc nhiên liệu"];
  const kmNum = Number(km);
  return (
    <Sheet title="Thêm bảo dưỡng" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setItem(p)}
              className={cx("rounded-lg border px-2.5 py-1 text-xs", item === p ? "border-primary text-primary" : "border-border text-muted-foreground")}
            >
              {p}
            </button>
          ))}
        </div>
        <Field label="Hạng mục *">
          <TextInput value={item} onChange={(e) => setItem(e.target.value.slice(0, 60))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ngày">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Số km">
            <TextInput inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} />
          </Field>
        </div>
        <Field label="Ghi chú">
          <TextInput value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} />
        </Field>
        <Button
          block
          disabled={!item.trim()}
          onClick={() => onSave({ date, km: km.trim() && Number.isFinite(kmNum) ? kmNum : null, item: item.trim(), note: note.trim() })}
        >
          Lưu
        </Button>
      </div>
    </Sheet>
  );
}
