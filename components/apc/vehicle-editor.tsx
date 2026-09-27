"use client";

import { useState } from "react";
import { useApc, type VehicleInput } from "@/contexts/apc-context";
import {
  ASPIRATION_LABEL,
  FUEL_LABEL,
  TRANS_LABEL,
  type Aspiration,
  type Fuel,
  type Transmission,
  type Vehicle,
} from "@/lib/apc/types";
import { Button, Field, Sheet, TextInput, inputCls } from "./ui";

const toNum = (s: string): number | null => {
  const n = Number(s.replace(",", "."));
  return s.trim() && Number.isFinite(n) ? n : null;
};

export const SAMPLE_VEHICLE: VehicleInput = {
  make: "Toyota",
  model: "Vios",
  year: 2019,
  engine: "2NR-FE",
  displacement: 1.5,
  aspiration: "na",
  transmission: "cvt",
  fuel: "gasoline",
  stockHp: 107,
  stockBoost: null,
  odo: 68000,
  goal: "daily",
};

export function VehicleEditor({ vehicle, onClose }: { vehicle?: Vehicle; onClose: () => void }) {
  const { addVehicle, updateVehicle, toast } = useApc();
  const [f, setF] = useState({
    make: vehicle?.make ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year?.toString() ?? "",
    engine: vehicle?.engine ?? "",
    displacement: vehicle?.displacement?.toString() ?? "",
    aspiration: vehicle?.aspiration ?? ("na" as Aspiration),
    transmission: vehicle?.transmission ?? ("at" as Transmission),
    fuel: vehicle?.fuel ?? ("gasoline" as Fuel),
    stockHp: vehicle?.stockHp?.toString() ?? "",
    stockBoost: vehicle?.stockBoost?.toString() ?? "",
    odo: vehicle?.odo?.toString() ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = () => {
    if (!f.make.trim() || !f.model.trim()) {
      toast("Nhập hãng và dòng xe.");
      return;
    }
    const input: VehicleInput = {
      make: f.make.trim().slice(0, 40),
      model: f.model.trim().slice(0, 40),
      year: toNum(f.year),
      engine: f.engine.trim().slice(0, 40),
      displacement: toNum(f.displacement),
      aspiration: f.aspiration,
      transmission: f.transmission,
      fuel: f.fuel,
      stockHp: toNum(f.stockHp),
      stockBoost: f.aspiration === "na" ? null : toNum(f.stockBoost),
      odo: toNum(f.odo),
      goal: vehicle?.goal ?? "daily",
    };
    if (vehicle) updateVehicle(vehicle.id, input);
    else addVehicle(input);
    toast(vehicle ? "Đã cập nhật xe." : "Đã thêm xe vào Garage.");
    onClose();
  };

  return (
    <Sheet title={vehicle ? "Sửa thông tin xe" : "Thêm xe"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hãng *">
            <TextInput value={f.make} onChange={(e) => set("make", e.target.value)} placeholder="Toyota" />
          </Field>
          <Field label="Dòng xe *">
            <TextInput value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="Vios" />
          </Field>
          <Field label="Đời (năm)">
            <TextInput inputMode="numeric" value={f.year} onChange={(e) => set("year", e.target.value)} placeholder="2019" />
          </Field>
          <Field label="Mã động cơ">
            <TextInput value={f.engine} onChange={(e) => set("engine", e.target.value)} placeholder="2NR-FE" />
          </Field>
          <Field label="Dung tích (L)">
            <TextInput
              inputMode="decimal"
              value={f.displacement}
              onChange={(e) => set("displacement", e.target.value)}
              placeholder="1.5"
            />
          </Field>
          <Field label="Số km (ODO)">
            <TextInput inputMode="numeric" value={f.odo} onChange={(e) => set("odo", e.target.value)} placeholder="68000" />
          </Field>
          <Field label="Nạp khí">
            <select className={inputCls} value={f.aspiration} onChange={(e) => set("aspiration", e.target.value)}>
              {(Object.keys(ASPIRATION_LABEL) as Aspiration[]).map((k) => (
                <option key={k} value={k}>
                  {ASPIRATION_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hộp số">
            <select className={inputCls} value={f.transmission} onChange={(e) => set("transmission", e.target.value)}>
              {(Object.keys(TRANS_LABEL) as Transmission[]).map((k) => (
                <option key={k} value={k}>
                  {TRANS_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nhiên liệu">
            <select className={inputCls} value={f.fuel} onChange={(e) => set("fuel", e.target.value)}>
              {(Object.keys(FUEL_LABEL) as Fuel[]).map((k) => (
                <option key={k} value={k}>
                  {FUEL_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Công suất gốc (hp)">
            <TextInput inputMode="numeric" value={f.stockHp} onChange={(e) => set("stockHp", e.target.value)} placeholder="Để trống nếu chưa rõ" />
          </Field>
          {f.aspiration !== "na" && (
            <Field label="Boost gốc (bar)">
              <TextInput
                inputMode="decimal"
                value={f.stockBoost}
                onChange={(e) => set("stockBoost", e.target.value)}
                placeholder="Để trống nếu chưa rõ"
              />
            </Field>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Để trống thông số chưa chắc chắn — app sẽ báo “Cần kiểm tra thêm” thay vì tự đoán.
        </p>
        <Button block onClick={save}>
          {vehicle ? "Lưu thay đổi" : "Thêm xe"}
        </Button>
      </div>
    </Sheet>
  );
}
