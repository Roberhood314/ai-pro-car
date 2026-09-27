"use client";

import { useState, type ReactNode } from "react";
import { useApc } from "@/contexts/apc-context";
import { SCENARIOS } from "@/lib/apc/scenarios";
import { detectSupport, getAdapter } from "@/lib/apc/device";
import { Button, IconChevron, IconEdit, IconPlug, IconSpark, Sheet, cx } from "./ui";

export function NewSessionSheet({ onClose }: { onClose: () => void }) {
  const { createSession, openSession } = useApc();
  const [mode, setMode] = useState<"pick" | "sim">("pick");

  const start = (source: "manual" | "sim", scenario?: string) => {
    const id = createSession(source, scenario);
    if (id) {
      openSession(id);
      onClose();
    }
  };

  if (mode === "sim")
    return (
      <Sheet title="Chọn tình huống mô phỏng" onClose={onClose}>
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-xs leading-relaxed text-muted-foreground">
            Dữ liệu mô phỏng dùng để thử và học cách đọc kết quả. Mọi kết quả sẽ được gắn nhãn “Mô phỏng”.
          </p>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => start("sim", s.id)}
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:border-primary/60"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
                <p className="apc-nums mt-1 text-[11px] text-probable">{s.dtcs.map((d) => d.split(":")[0]).join(" · ")}</p>
              </div>
              <IconChevron className="text-muted-foreground" />
            </button>
          ))}
          <Button variant="ghost" onClick={() => setMode("pick")}>
            Quay lại
          </Button>
        </div>
      </Sheet>
    );

  const hasDevice = !!getAdapter();
  return (
    <Sheet title="Phiên chẩn đoán mới" onClose={onClose}>
      <div className="flex flex-col gap-2">
        <Option
          icon={<IconPlug />}
          title="Kết nối thiết bị OBD-II"
          body={hasDevice ? "Đọc trực tiếp từ xe" : "Chưa có thiết bị kết nối — tính năng đã chuẩn bị sẵn"}
          disabled={!hasDevice}
        />
        <Option icon={<IconEdit />} title="Nhập tay" body="Nhập DTC, Live Data, Freeze Frame và triệu chứng" onClick={() => start("manual")} />
        <Option icon={<IconSpark />} title="Mô phỏng" body="Chọn tình huống mẫu để thử" onClick={() => setMode("sim")} />
      </div>
    </Sheet>
  );
}

function Option({
  icon,
  title,
  body,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "flex items-center gap-3 rounded-lg border border-border p-3 text-left",
        disabled ? "opacity-50" : "hover:border-primary/60",
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
      {!disabled && <IconChevron className="text-muted-foreground" />}
    </button>
  );
}

export function DeviceSheet({ onClose }: { onClose: () => void }) {
  const sup = detectSupport();
  const rows = [
    { name: "Bluetooth (ELM327 BLE)", ok: sup.bluetooth },
    { name: "Wi-Fi (ELM327 Wi-Fi)", ok: sup.wifi },
    { name: "USB (cáp OBD-II)", ok: sup.usb },
  ];
  return (
    <Sheet title="Kết nối thiết bị" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-dashed border-need p-3">
          <p className="text-sm font-semibold">Chưa kết nối thiết bị</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            App đang dùng dữ liệu nhập tay hoặc mô phỏng. Khi có thiết bị OBD-II, dữ liệu trực tiếp từ xe sẽ được ưu tiên
            và nguồn dữ liệu tự chuyển sang “Trực tiếp từ xe”.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kênh kết nối</p>
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-lg bg-panel-2 px-3 py-2.5 text-sm">
              <span>{r.name}</span>
              <span className={cx("text-xs", r.ok ? "text-ok" : "text-muted-foreground")}>
                {r.ok ? "Trình duyệt hỗ trợ" : "Chưa khả dụng"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Hệ thống an toàn (phanh, ABS, túi khí) luôn ở chế độ SAFE READ — chỉ đọc, không ghi hay can thiệp.
        </p>
        <Button variant="outline" block onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Sheet>
  );
}
