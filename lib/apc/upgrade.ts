import type { UpgradeGoal, Vehicle } from "./types";

export interface UpgradeItem {
  id: string;
  title: string;
  why: string;
  requires: string[];
}

export interface UpgradeStage {
  name: string;
  gain: [number, number] | null;
  items: UpgradeItem[];
  note: string;
}

export interface Target {
  label: string;
  value: string;
  note: string;
}

export interface UpgradePlan {
  readiness: string[];
  stages: UpgradeStage[];
  targets: Target[];
  limits: Target[];
  risks: string[];
  missing: string[];
  hpEstimate: { stage: string; range: string }[];
}

const I = {
  intake: { id: "intake", title: "Intake (đường nạp)", why: "Giảm cản nạp, cải thiện đáp ứng", requires: [] },
  exhaust: { id: "exhaust", title: "Exhaust (ống xả)", why: "Giảm áp suất ngược", requires: ["Giữ xúc tác và cảm biến O2 hoạt động đúng"] },
  ignition: { id: "ignition", title: "Ignition (bugi/bô-bin)", why: "Duy trì tia lửa ổn định ở tải cao", requires: ["Bugi nhiệt độ phù hợp mức công suất"] },
  intercooler: { id: "intercooler", title: "Intercooler", why: "Hạ IAT sau turbo, giảm nguy cơ kích nổ", requires: ["Kiểm tra rò boost sau lắp"] },
  fuel: { id: "fuel", title: "Fuel system (kim phun/bơm)", why: "Đủ lưu lượng để giữ AFR an toàn", requires: ["Tính toán duty cycle kim phun < ~85%"] },
  cooling: { id: "cooling", title: "Cooling (két nước/dầu)", why: "Giữ ECT/nhiệt dầu ổn định khi tải kéo dài", requires: [] },
  ecu: { id: "ecu", title: "ECU tuning (tư vấn)", why: "Điều chỉnh nhiên liệu, đánh lửa, boost phù hợp phần cứng", requires: ["Thực hiện bởi tuner có dyno và datalog", "App KHÔNG flash/remap ECU"] },
  turbo: { id: "turbo", title: "Turbo / nâng cấp turbo", why: "Tăng lượng khí nạp — thay đổi lớn nhất về công suất", requires: ["Đánh giá tình trạng piston, tay biên, gioăng mặt máy", "Fuel + cooling + intercooler đi kèm"] },
} satisfies Record<string, UpgradeItem>;

export function buildPlan(v: Vehicle, goal: UpgradeGoal): UpgradePlan {
  const forced = v.aspiration !== "na";
  const diesel = v.fuel === "diesel";
  const missing: string[] = [];
  if (!v.stockHp) missing.push("Công suất gốc (hp) — cần để ước tính mục tiêu");
  if (!v.displacement) missing.push("Dung tích động cơ");
  if (forced && !v.stockBoost) missing.push("Boost gốc (bar) — cần để đặt mục tiêu boost");
  missing.push("Tình trạng thực tế động cơ: đo nén, kiểm tra rò, datalog hiện tại");

  const readiness = [
    "Không còn mã lỗi hiện hành (chạy phiên chẩn đoán trước khi nâng cấp)",
    "Đo nén/leak-down đạt, không hao dầu bất thường",
    "Hệ thống làm mát hoạt động tốt, ECT ổn định",
    "Bảo dưỡng đầy đủ: dầu, bugi, lọc gió, lọc nhiên liệu",
  ];

  let stages: UpgradeStage[];
  if (forced) {
    stages = [
      {
        name: "Stage 1",
        gain: diesel ? [0.12, 0.25] : [0.1, 0.2],
        items: [I.intake, I.ecu, I.ignition].filter((x) => !(diesel && x.id === "ignition")),
        note: "Giữ boost gần mức gốc, ưu tiên độ bền.",
      },
      {
        name: "Stage 2",
        gain: diesel ? [0.25, 0.4] : [0.2, 0.35],
        items: [I.intercooler, I.exhaust, I.fuel, I.ecu],
        note: "Bắt buộc có intercooler và kiểm tra lưu lượng nhiên liệu.",
      },
    ];
    if (goal !== "daily")
      stages.push({
        name: "Stage 3",
        gain: [0.4, 0.8],
        items: [I.turbo, I.fuel, I.cooling, I.ecu],
        note: "Thay đổi lớn — cần đánh giá chi tiết bên trong động cơ và hộp số.",
      });
  } else {
    stages = [
      {
        name: "Bolt-on",
        gain: [0.03, 0.08],
        items: diesel ? [I.intake, I.exhaust] : [I.intake, I.exhaust, I.ignition],
        note: "Máy hút khí tự nhiên tăng ít khi chỉ thay đường nạp/xả.",
      },
      {
        name: "Tối ưu ECU",
        gain: [0.03, 0.07],
        items: [I.ecu],
        note: "Hiệu quả phụ thuộc phần cứng đã lắp.",
      },
    ];
    if (goal !== "daily")
      stages.push({
        name: "Forced induction",
        gain: [0.3, 0.6],
        items: [I.turbo, I.intercooler, I.fuel, I.cooling, I.ecu],
        note: "Máy NA có tỷ số nén cao — boost phải rất thấp nếu không hạ nén.",
      });
  }
  if (goal === "track")
    stages[stages.length - 1].items = [...stages[stages.length - 1].items, I.cooling].filter(
      (x, i, arr) => arr.findIndex((y) => y.id === x.id) === i,
    );

  const hpEstimate = stages.map((s) => ({
    stage: s.name,
    range:
      v.stockHp && s.gain
        ? `${Math.round(v.stockHp * (1 + s.gain[0]))}–${Math.round(v.stockHp * (1 + s.gain[1]))} hp`
        : "Cần kiểm tra thêm",
  }));

  const targets: Target[] = diesel
    ? [
        { label: "Lambda khi tải cao", value: "λ ≥ 1.15–1.25", note: "Giữ trên ngưỡng khói đen" },
        { label: "Boost", value: v.stockBoost ? `≤ ${(v.stockBoost + 0.2).toFixed(2)} bar (Stage 1)` : "Cần kiểm tra thêm", note: "Tăng dần, xác nhận bằng datalog" },
      ]
    : [
        { label: "AFR không tải / cruise", value: "14.7:1 (λ 1.00)", note: "Closed loop" },
        {
          label: "AFR toàn tải (WOT)",
          value: forced ? "11.5–12.2:1 (λ 0.78–0.83)" : "12.5–13.2:1 (λ 0.85–0.90)",
          note: "Xăng thường; E85 dùng giá trị lambda",
        },
        {
          label: "Boost",
          value: !forced ? "Không áp dụng" : v.stockBoost ? `≤ ${(v.stockBoost + 0.25).toFixed(2)} bar (Stage 1)` : "Cần kiểm tra thêm",
          note: forced ? "Giới hạn theo map hiệu suất turbo" : "",
        },
      ];

  const limits: Target[] = [
    { label: "Knock / kích nổ", value: diesel ? "—" : "Không có retard lặp lại", note: "Theo dõi knock retard từng xy lanh" },
    { label: "ECT", value: "≤ 105°C", note: "Tải kéo dài" },
    { label: "IAT sau intercooler", value: forced ? "≤ nhiệt độ môi trường + 20–25°C" : "≤ 60°C", note: "" },
    { label: "EGT trước turbine", value: diesel ? "≤ ~750°C liên tục" : "≤ ~900–950°C", note: "Cần cảm biến EGT" },
    { label: "Duty cycle kim phun", value: "≤ ~85%", note: "" },
  ];

  const risks = [
    "Mọi con số là ngưỡng tham khảo chung — xác nhận bằng dyno, datalog và tài liệu hãng.",
    "Không nâng boost/đánh lửa khi chưa có dữ liệu knock, AFR đo bằng wideband.",
    "Tăng công suất làm tăng tải cho ly hợp/hộp số, phanh và lốp.",
    "Có thể ảnh hưởng bảo hành, đăng kiểm và tiêu chuẩn khí thải.",
  ];
  if (v.transmission === "cvt") risks.push("Hộp số CVT thường giới hạn mô-men — kiểm tra khả năng chịu tải trước.");

  return { readiness, stages, targets, limits, risks, missing, hpEstimate };
}
