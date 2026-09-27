import type { PidId, Readings, Vehicle } from "./types";

export interface Pid {
  id: PidId;
  label: string;
  unit: string;
  min: number | null;
  max: number | null;
  note: string;
}

/** Reference ranges are generic (warm engine, idle). Always confirm with the manufacturer's data. */
export const PIDS: Pid[] = [
  { id: "rpm", label: "Vòng tua", unit: "rpm", min: 550, max: 1000, note: "Không tải, máy nóng" },
  { id: "ect", label: "Nhiệt độ nước làm mát (ECT)", unit: "°C", min: 80, max: 105, note: "Máy đã nóng" },
  { id: "iat", label: "Nhiệt độ khí nạp (IAT)", unit: "°C", min: -10, max: 60, note: "" },
  { id: "maf", label: "Lưu lượng khí nạp (MAF)", unit: "g/s", min: null, max: null, note: "So theo dung tích động cơ" },
  { id: "map", label: "Áp suất đường nạp (MAP)", unit: "kPa", min: 20, max: 45, note: "Không tải" },
  { id: "load", label: "Tải động cơ", unit: "%", min: 15, max: 45, note: "Không tải" },
  { id: "stft1", label: "STFT B1", unit: "%", min: -10, max: 10, note: "Fuel trim ngắn hạn" },
  { id: "ltft1", label: "LTFT B1", unit: "%", min: -10, max: 10, note: "Fuel trim dài hạn" },
  { id: "stft2", label: "STFT B2", unit: "%", min: -10, max: 10, note: "Chỉ máy V/Boxer" },
  { id: "ltft2", label: "LTFT B2", unit: "%", min: -10, max: 10, note: "Chỉ máy V/Boxer" },
  { id: "o2s1", label: "O2 B1S1 (trước xúc tác)", unit: "V", min: 0.1, max: 0.9, note: "Phải dao động" },
  { id: "o2s2", label: "O2 B1S2 (sau xúc tác)", unit: "V", min: 0.4, max: 0.85, note: "Tương đối ổn định" },
  { id: "tps", label: "Vị trí bướm ga (TPS)", unit: "%", min: null, max: null, note: "Tra theo tài liệu hãng" },
  { id: "battery", label: "Điện áp hệ thống", unit: "V", min: 13.2, max: 14.8, note: "Máy đang nổ" },
  { id: "spark", label: "Góc đánh lửa sớm", unit: "°", min: null, max: null, note: "Tra theo tài liệu hãng" },
  { id: "fuelp", label: "Áp suất nhiên liệu", unit: "kPa", min: null, max: null, note: "Tra theo tài liệu hãng" },
  { id: "boost", label: "Áp suất tăng áp (boost)", unit: "bar", min: null, max: null, note: "So với boost gốc" },
  { id: "speed", label: "Tốc độ xe", unit: "km/h", min: null, max: null, note: "" },
];

export const PID_MAP: Record<PidId, Pid> = Object.fromEntries(PIDS.map((p) => [p.id, p])) as Record<PidId, Pid>;
export const PID_IDS = PIDS.map((p) => p.id);

export const SYMPTOMS: { id: string; label: string }[] = [
  { id: "rough_idle", label: "Không tải rung, không đều" },
  { id: "stall", label: "Chết máy" },
  { id: "hard_start", label: "Khó nổ máy" },
  { id: "power_loss", label: "Yếu máy, hụt ga" },
  { id: "hesitation", label: "Giật khi tăng tốc" },
  { id: "flashing_mil", label: "Đèn check engine nhấp nháy" },
  { id: "high_consumption", label: "Hao nhiên liệu" },
  { id: "fuel_smell", label: "Mùi xăng" },
  { id: "egg_smell", label: "Mùi trứng thối ở ống xả" },
  { id: "hissing", label: "Tiếng xì hơi khoang máy" },
  { id: "exhaust_noise", label: "Ống xả kêu, lọt khí" },
  { id: "heater_weak", label: "Sưởi yếu, kim nhiệt thấp" },
  { id: "overheating", label: "Kim nhiệt cao, quá nhiệt" },
  { id: "blue_smoke", label: "Khói xanh, hao dầu máy" },
  { id: "dim_lights", label: "Đèn yếu, ắc quy yếu" },
  { id: "whistle", label: "Tiếng rít turbo bất thường" },
  { id: "brake_warning", label: "Đèn ABS / phanh sáng" },
  { id: "airbag_warning", label: "Đèn túi khí sáng" },
];
export const SYMPTOM_IDS = SYMPTOMS.map((s) => s.id);
export const symptomLabel = (id: string) => SYMPTOMS.find((s) => s.id === id)?.label ?? id;

export type Severity = "high" | "med" | "low";

interface DtcDef {
  desc: string;
  system: string;
  severity: Severity;
}

const DTC_DB: Record<string, DtcDef> = {
  P0087: { desc: "Áp suất ray nhiên liệu quá thấp", system: "Nhiên liệu", severity: "high" },
  P0101: { desc: "Tín hiệu MAF ngoài dải / sai hiệu suất", system: "Nạp khí", severity: "med" },
  P0102: { desc: "Tín hiệu MAF thấp", system: "Nạp khí", severity: "med" },
  P0115: { desc: "Lỗi mạch cảm biến nhiệt độ nước (ECT)", system: "Làm mát", severity: "med" },
  P0117: { desc: "Cảm biến ECT tín hiệu thấp", system: "Làm mát", severity: "med" },
  P0118: { desc: "Cảm biến ECT tín hiệu cao", system: "Làm mát", severity: "med" },
  P0121: { desc: "Cảm biến vị trí bướm ga (TPS) ngoài dải", system: "Nạp khí", severity: "med" },
  P0122: { desc: "Cảm biến TPS tín hiệu thấp", system: "Nạp khí", severity: "med" },
  P0128: { desc: "Nhiệt độ nước làm mát dưới ngưỡng van hằng nhiệt", system: "Làm mát", severity: "low" },
  P0130: { desc: "Lỗi mạch cảm biến O2 B1S1", system: "Khí thải", severity: "low" },
  P0133: { desc: "Cảm biến O2 B1S1 phản hồi chậm", system: "Khí thải", severity: "low" },
  P0135: { desc: "Lỗi mạch sấy cảm biến O2 B1S1", system: "Khí thải", severity: "low" },
  P0171: { desc: "Hỗn hợp quá nghèo — Bank 1", system: "Nhiên liệu / Nạp khí", severity: "med" },
  P0174: { desc: "Hỗn hợp quá nghèo — Bank 2", system: "Nhiên liệu / Nạp khí", severity: "med" },
  P0299: { desc: "Áp suất tăng áp thấp (turbo/supercharger)", system: "Tăng áp", severity: "high" },
  P0300: { desc: "Bỏ máy ngẫu nhiên / nhiều xy lanh", system: "Đánh lửa / Đốt cháy", severity: "high" },
  P0420: { desc: "Hiệu suất bộ xúc tác dưới ngưỡng — Bank 1", system: "Khí thải", severity: "low" },
  P0430: { desc: "Hiệu suất bộ xúc tác dưới ngưỡng — Bank 2", system: "Khí thải", severity: "low" },
  P0440: { desc: "Lỗi hệ thống thu hồi hơi xăng (EVAP)", system: "EVAP", severity: "low" },
  P0442: { desc: "EVAP phát hiện rò rỉ nhỏ", system: "EVAP", severity: "low" },
  P0455: { desc: "EVAP phát hiện rò rỉ lớn", system: "EVAP", severity: "low" },
  P0456: { desc: "EVAP phát hiện rò rỉ rất nhỏ", system: "EVAP", severity: "low" },
  P0505: { desc: "Lỗi hệ thống điều khiển không tải", system: "Nạp khí", severity: "med" },
  P0506: { desc: "Vòng tua không tải thấp hơn mong đợi", system: "Nạp khí", severity: "low" },
  P0507: { desc: "Vòng tua không tải cao hơn mong đợi", system: "Nạp khí", severity: "low" },
  P0562: { desc: "Điện áp hệ thống thấp", system: "Điện / Sạc", severity: "med" },
  P0563: { desc: "Điện áp hệ thống cao", system: "Điện / Sạc", severity: "med" },
  U0100: { desc: "Mất giao tiếp với ECM/PCM", system: "Mạng CAN", severity: "high" },
  U0121: { desc: "Mất giao tiếp với module ABS", system: "Mạng CAN / ABS", severity: "high" },
  C0035: { desc: "Lỗi cảm biến tốc độ bánh trước trái", system: "ABS", severity: "high" },
  C0040: { desc: "Lỗi cảm biến tốc độ bánh trước phải", system: "ABS", severity: "high" },
  C0045: { desc: "Lỗi cảm biến tốc độ bánh sau trái", system: "ABS", severity: "high" },
  C0050: { desc: "Lỗi cảm biến tốc độ bánh sau phải", system: "ABS", severity: "high" },
  C0265: { desc: "Lỗi rơ-le mô-tơ bơm ABS", system: "ABS", severity: "high" },
  B0001: { desc: "Mạch kích nổ túi khí người lái — tầng 1", system: "SRS (túi khí)", severity: "high" },
};

export const DTC_RE = /^[PCBU][0-3][0-9A-F]{3}$/;

export interface DecodedDtc {
  code: string;
  known: boolean;
  desc: string;
  system: string;
  severity: Severity;
  safety: boolean;
  group: string;
}

const GROUP: Record<string, string> = {
  P: "Powertrain (động cơ, hộp số)",
  C: "Chassis (khung gầm, phanh, ABS)",
  B: "Body (thân xe, túi khí)",
  U: "Network (mạng giao tiếp)",
};

export function isSafetyCode(code: string): boolean {
  if (code.startsWith("C")) return true;
  if (code.startsWith("B00")) return true;
  return code === "U0121";
}

export function decodeDtc(code: string): DecodedDtc {
  const c = code.toUpperCase();
  const safety = isSafetyCode(c);
  const group = GROUP[c[0]] ?? "Không xác định";
  const def = DTC_DB[c];
  if (def) return { code: c, known: true, ...def, safety, group };
  const cyl = /^P030([1-8])$/.exec(c);
  if (cyl)
    return {
      code: c,
      known: true,
      desc: `Phát hiện bỏ máy xy lanh ${cyl[1]}`,
      system: "Đánh lửa / Đốt cháy",
      severity: "high",
      safety,
      group,
    };
  const inj = /^P020([1-8])$/.exec(c);
  if (inj)
    return {
      code: c,
      known: true,
      desc: `Lỗi mạch kim phun xy lanh ${inj[1]}`,
      system: "Nhiên liệu",
      severity: "high",
      safety,
      group,
    };
  const generic = c[1] === "0" || c[1] === "2" ? "mã chuẩn chung" : "mã riêng của hãng";
  return {
    code: c,
    known: false,
    desc: `Chưa có trong cơ sở dữ liệu (${generic}) — tra theo tài liệu hãng`,
    system: "Chưa xác định",
    severity: safety ? "high" : "med",
    safety,
    group,
  };
}

export interface TestStep {
  id: string;
  action: string;
  tool: string;
  expected: string;
}

export interface SensorRule {
  weight: number;
  check: (r: Readings, v: Vehicle | null) => string | null;
}

export interface Cause {
  id: string;
  title: string;
  system: string;
  /** code or pattern ending with X, e.g. "P030X" */
  dtc: Record<string, number>;
  symptoms: Record<string, number>;
  rules: SensorRule[];
  needs: PidId[];
  tests: TestStep[];
  repair: { kind: "repair" | "replace" | "repair_first"; action: string; precheck: string[] };
  verify: string[];
}

const trim = (r: Readings, b: 1 | 2): number | null => {
  const s = b === 1 ? r.stft1 : r.stft2;
  const l = b === 1 ? r.ltft1 : r.ltft2;
  if (s == null && l == null) return null;
  return Math.round(((s ?? 0) + (l ?? 0)) * 10) / 10;
};
const leanTrim = (r: Readings): string | null => {
  for (const b of [1, 2] as const) {
    const t = trim(r, b);
    if (t != null && t > 10) return `Tổng fuel trim B${b} = +${t}% (> +10%): ECU đang bù cho hỗn hợp nghèo`;
  }
  return null;
};
const isIdle = (r: Readings) => r.rpm == null || r.rpm < 1100;

export const CAUSES: Cause[] = [
  {
    id: "vacuum_leak",
    title: "Rò rỉ chân không / khí lọt sau MAF",
    system: "Nạp khí",
    dtc: { P0171: 2, P0174: 2, P0506: 1, P0507: 1 },
    symptoms: { rough_idle: 1, hissing: 2, stall: 1 },
    rules: [
      { weight: 2, check: (r) => (isIdle(r) ? leanTrim(r) : null) },
      {
        weight: 1,
        check: (r) =>
          r.map != null && isIdle(r) && r.map > 45 ? `MAP không tải ${r.map} kPa (> 45 kPa): chân không yếu` : null,
      },
    ],
    needs: ["stft1", "ltft1", "map"],
    tests: [
      {
        id: "vl1",
        action: "Ghi fuel trim ở không tải rồi giữ 2500 rpm. Rò chân không thường làm trim cao ở không tải và giảm rõ khi tăng vòng tua.",
        tool: "Máy chẩn đoán đọc Live Data",
        expected: "Trim không tải và 2500 rpm đều trong ±10%",
      },
      {
        id: "vl2",
        action: "Kiểm tra trực quan ống chân không, ống PCV, co nối sau MAF, gioăng cổ hút.",
        tool: "Đèn soi, gương",
        expected: "Không nứt, không lỏng, không có tiếng xì",
      },
      {
        id: "vl3",
        action: "Thực hiện smoke test (bơm khói) đường nạp khi máy tắt.",
        tool: "Máy tạo khói chẩn đoán",
        expected: "Không có khói thoát ra ngoài hệ thống nạp",
      },
    ],
    repair: {
      kind: "repair",
      action: "Thay/siết lại ống, co nối hoặc gioăng tại đúng vị trí rò đã xác định.",
      precheck: ["Xác định chính xác điểm rò bằng smoke test trước khi thay chi tiết"],
    },
    verify: ["Reset fuel trim, chạy 15–20 phút", "LTFT/STFT quay về ±10%", "Xóa mã và theo dõi P0171/P0174 không tái xuất hiện"],
  },
  {
    id: "maf_dirty",
    title: "Cảm biến MAF bẩn / sai lệch",
    system: "Nạp khí",
    dtc: { P0101: 3, P0102: 3, P0171: 1, P0174: 1 },
    symptoms: { hesitation: 1, power_loss: 1, stall: 1 },
    rules: [
      {
        weight: 2,
        check: (r, v) => {
          if (r.maf == null || !v?.displacement || !isIdle(r)) return null;
          const perL = r.maf / v.displacement;
          return perL < 1.3
            ? `MAF không tải ${r.maf} g/s cho động cơ ${v.displacement} L — thấp so với mức tham khảo chung`
            : null;
        },
      },
      { weight: 1, check: (r) => (r.maf != null ? leanTrim(r) : null) },
    ],
    needs: ["maf", "rpm"],
    tests: [
      {
        id: "mf1",
        action: "Kiểm tra giắc cắm, dây và nguồn cấp MAF; kiểm tra lọc gió và ống nạp trước MAF.",
        tool: "Đồng hồ vạn năng (VOM)",
        expected: "Nguồn/mass đúng theo sơ đồ hãng, giắc sạch, lọc gió không rách",
      },
      {
        id: "mf2",
        action: "So sánh MAF thực tế với giá trị tính toán theo dung tích, vòng tua và tải ở nhiều chế độ.",
        tool: "Máy chẩn đoán đọc Live Data",
        expected: "Chênh lệch trong dung sai của hãng",
      },
      {
        id: "mf3",
        action: "Vệ sinh MAF bằng dung dịch chuyên dụng, để khô rồi đo lại.",
        tool: "Dung dịch vệ sinh MAF",
        expected: "Giá trị MAF và fuel trim trở về bình thường sau vệ sinh",
      },
    ],
    repair: {
      kind: "repair_first",
      action: "Vệ sinh MAF và xử lý dây/giắc trước. Chỉ thay MAF khi đã vệ sinh, dây đúng mà giá trị vẫn sai.",
      precheck: ["Không có rò khí sau MAF", "Nguồn và mass của MAF đạt chuẩn"],
    },
    verify: ["Đọc MAF ở không tải và 2500 rpm", "Fuel trim trong ±10%", "Xóa mã, lái thử theo chu trình"],
  },
  {
    id: "fuel_delivery",
    title: "Áp suất nhiên liệu thấp (bơm, lọc, điều áp)",
    system: "Nhiên liệu",
    dtc: { P0087: 3, P0171: 1, P0174: 1 },
    symptoms: { hesitation: 1, power_loss: 1, hard_start: 1 },
    rules: [],
    needs: ["fuelp"],
    tests: [
      {
        id: "fd1",
        action: "Đo áp suất nhiên liệu ở không tải và khi tăng tải, so với thông số hãng.",
        tool: "Đồng hồ đo áp suất nhiên liệu",
        expected: "Áp suất nằm trong dải của hãng ở mọi chế độ",
      },
      {
        id: "fd2",
        action: "Tắt máy, theo dõi mức giữ áp trong 5 phút.",
        tool: "Đồng hồ đo áp suất nhiên liệu",
        expected: "Áp suất giữ ổn định theo tiêu chuẩn hãng",
      },
      {
        id: "fd3",
        action: "Đo điện áp cấp cho bơm xăng khi đang chạy.",
        tool: "Đồng hồ vạn năng (VOM)",
        expected: "Sụt áp trên dây cấp và mass nằm trong giới hạn",
      },
    ],
    repair: {
      kind: "repair_first",
      action: "Xử lý nguồn cấp bơm/lọc xăng trước; thay bơm hoặc bộ điều áp chỉ khi đo áp suất xác nhận hỏng.",
      precheck: ["Đo áp suất thực tế — không thay bơm chỉ vì mã lỗi"],
    },
    verify: ["Đo lại áp suất nhiên liệu", "Lái thử có tải", "Theo dõi mã tái xuất hiện"],
  },
  {
    id: "o2_sensor",
    title: "Cảm biến O2 trước xúc tác hoặc mạch sấy",
    system: "Khí thải",
    dtc: { P0130: 3, P0133: 3, P0135: 3 },
    symptoms: { high_consumption: 1 },
    rules: [
      {
        weight: 1,
        check: (r) =>
          r.o2s1 != null && (r.o2s1 < 0.05 || r.o2s1 > 0.95)
            ? `O2 B1S1 = ${r.o2s1} V ở giá trị biên — cần xem có dao động không`
            : null,
      },
    ],
    needs: ["o2s1"],
    tests: [
      {
        id: "o21",
        action: "Quan sát tín hiệu O2 B1S1 khi máy nóng, giữ 2500 rpm.",
        tool: "Máy chẩn đoán (đồ thị Live Data) hoặc oscilloscope",
        expected: "Dao động liên tục khoảng 0.1–0.9 V, chuyển trạng thái nhanh",
      },
      {
        id: "o22",
        action: "Đo điện trở bộ sấy và nguồn cấp sấy (nếu có mã P0135).",
        tool: "Đồng hồ vạn năng (VOM)",
        expected: "Điện trở và nguồn đúng thông số hãng",
      },
      {
        id: "o23",
        action: "Kiểm tra dây, giắc và rò khí xả gần cảm biến.",
        tool: "Kiểm tra trực quan",
        expected: "Dây không cháy/chạm, không lọt khí xả",
      },
    ],
    repair: {
      kind: "repair_first",
      action: "Sửa dây/giắc hoặc rò khí xả trước; thay cảm biến O2 khi tín hiệu hoặc bộ sấy đo được là hỏng.",
      precheck: ["Loại trừ hỗn hợp nghèo/giàu thật sự làm O2 báo đúng"],
    },
    verify: ["Quan sát O2 dao động bình thường", "Readiness monitor O2 hoàn thành", "Xóa mã, theo dõi"],
  },
  {
    id: "ignition_coil",
    title: "Bô-bin hoặc bugi xy lanh bỏ máy",
    system: "Đánh lửa",
    dtc: { P0300: 1, P030X: 2 },
    symptoms: { rough_idle: 1, flashing_mil: 1, power_loss: 1, hesitation: 1 },
    rules: [],
    needs: [],
    tests: [
      {
        id: "ig1",
        action: "Tháo và kiểm tra bugi xy lanh bỏ máy: màu điện cực, khe hở, nứt sứ.",
        tool: "Tuýp bugi, thước lá",
        expected: "Bugi đúng khe hở, không nứt, không bám muội bất thường",
      },
      {
        id: "ig2",
        action: "Đổi bô-bin xy lanh lỗi sang xy lanh khác, xóa mã và chạy lại.",
        tool: "Máy chẩn đoán",
        expected: "Lỗi bỏ máy KHÔNG đi theo bô-bin",
      },
      {
        id: "ig3",
        action: "Kiểm tra nguồn cấp và tín hiệu điều khiển bô-bin.",
        tool: "Đồng hồ vạn năng / đèn test",
        expected: "Tín hiệu điều khiển đúng",
      },
    ],
    repair: {
      kind: "replace",
      action: "Thay bô-bin/bugi đã được xác nhận bằng phép đổi chéo hoặc kiểm tra trực tiếp.",
      precheck: ["Lỗi đi theo bô-bin khi đổi chéo", "Nếu thay bugi, thay đúng loại và lực siết của hãng"],
    },
    verify: ["Theo dõi misfire counter từng xy lanh", "Lái thử có tải", "Xóa mã, kiểm tra không tái xuất hiện"],
  },
  {
    id: "injector",
    title: "Kim phun xy lanh (tắc, rò, mạch điện)",
    system: "Nhiên liệu",
    dtc: { P030X: 1, P020X: 3 },
    symptoms: { rough_idle: 1, high_consumption: 1 },
    rules: [],
    needs: [],
    tests: [
      {
        id: "in1",
        action: "Đo điện trở kim phun và kiểm tra xung điều khiển.",
        tool: "Đồng hồ vạn năng, noid light",
        expected: "Điện trở đúng thông số, có xung điều khiển",
      },
      {
        id: "in2",
        action: "Đổi chéo kim phun hoặc làm balance test.",
        tool: "Máy chẩn đoán / thiết bị cân bằng kim phun",
        expected: "Lỗi không đi theo kim phun, lưu lượng đồng đều",
      },
    ],
    repair: {
      kind: "repair_first",
      action: "Sửa mạch điện hoặc vệ sinh/cân chỉnh kim phun; thay kim khi kiểm tra xác nhận hỏng.",
      precheck: ["Đã loại trừ bô-bin/bugi", "Kiểm tra dây và giắc kim phun"],
    },
    verify: ["Theo dõi misfire counter", "Fuel trim cân bằng", "Xóa mã, lái thử"],
  },
  {
    id: "compression",
    title: "Nén xy lanh yếu (xu-páp, xéc-măng, gioăng mặt máy)",
    system: "Cơ khí động cơ",
    dtc: { P030X: 1, P0300: 1 },
    symptoms: { blue_smoke: 2, power_loss: 1, hard_start: 1 },
    rules: [],
    needs: [],
    tests: [
      {
        id: "cp1",
        action: "Đo áp suất nén tất cả xy lanh, so sánh chênh lệch.",
        tool: "Đồng hồ đo nén",
        expected: "Áp suất nén trong tiêu chuẩn hãng, chênh lệch giữa các xy lanh nhỏ",
      },
      {
        id: "cp2",
        action: "Nếu nén thấp: làm leak-down test để xác định vị trí lọt.",
        tool: "Bộ leak-down tester",
        expected: "Tỷ lệ lọt trong giới hạn",
      },
    ],
    repair: {
      kind: "repair",
      action: "Sửa chữa cơ khí theo vị trí lọt đã xác định (xu-páp, xéc-măng, gioăng).",
      precheck: ["Có kết quả đo nén và leak-down rõ ràng trước khi tháo máy"],
    },
    verify: ["Đo lại nén", "Theo dõi bỏ máy và tiêu hao dầu"],
  },
  {
    id: "catalyst",
    title: "Bộ xúc tác giảm hiệu suất",
    system: "Khí thải",
    dtc: { P0420: 2, P0430: 2 },
    symptoms: { egg_smell: 1, power_loss: 1 },
    rules: [
      {
        weight: 1,
        check: (r) =>
          r.o2s1 != null && r.o2s2 != null && Math.abs(r.o2s1 - r.o2s2) < 0.1
            ? `O2 sau (${r.o2s2} V) gần bằng O2 trước (${r.o2s1} V) — một mẫu đơn, cần xem dạng sóng`
            : null,
      },
    ],
    needs: ["o2s1", "o2s2"],
    tests: [
      {
        id: "ct1",
        action: "Kiểm tra rò khí xả trước cảm biến O2 sau.",
        tool: "Kiểm tra trực quan / smoke test ống xả",
        expected: "Không lọt khí xả",
      },
      {
        id: "ct2",
        action: "So sánh đồ thị O2 trước và sau khi máy nóng, 2500 rpm.",
        tool: "Máy chẩn đoán (đồ thị) hoặc oscilloscope",
        expected: "O2 sau ổn định, ít dao động hơn nhiều so với O2 trước",
      },
      {
        id: "ct3",
        action: "Đo nhiệt độ đầu vào và đầu ra xúc tác sau khi chạy nóng.",
        tool: "Súng đo nhiệt hồng ngoại",
        expected: "Đầu ra nóng hơn đầu vào",
      },
    ],
    repair: {
      kind: "repair_first",
      action: "Xử lý nguyên nhân gốc (bỏ máy, hỗn hợp sai, rò khí xả) trước. Thay xúc tác chỉ khi các kiểm tra xác nhận xúc tác hỏng.",
      precheck: ["Không còn mã bỏ máy hoặc hỗn hợp nghèo/giàu", "Cảm biến O2 sau hoạt động đúng"],
    },
    verify: ["Chạy chu trình để monitor xúc tác hoàn thành", "Xóa mã, theo dõi P0420/P0430"],
  },
  {
    id: "exhaust_leak",
    title: "Rò khí xả trước cảm biến O2",
    system: "Khí thải",
    dtc: { P0420: 1, P0171: 1, P0133: 1 },
    symptoms: { exhaust_noise: 2 },
    rules: [],
    needs: [],
    tests: [
      {
        id: "ex1",
        action: "Nghe và kiểm tra cổ xả, mặt bích, gioăng khi máy nguội vừa nổ.",
        tool: "Kiểm tra trực quan, smoke test",
        expected: "Không có tiếng lọt khí, không vết muội quanh mối nối",
      },
    ],
    repair: {
      kind: "repair",
      action: "Thay gioăng, siết lại hoặc hàn điểm rò đã xác định.",
      precheck: ["Xác định đúng vị trí rò"],
    },
    verify: ["Kiểm tra lại mối nối", "Theo dõi fuel trim và mã lỗi"],
  },
  {
    id: "thermostat",
    title: "Van hằng nhiệt kẹt mở",
    system: "Làm mát",
    dtc: { P0128: 3 },
    symptoms: { heater_weak: 1, high_consumption: 1 },
    rules: [
      {
        weight: 2,
        check: (r) => (r.ect != null && r.ect < 75 ? `ECT ${r.ect}°C — thấp hơn nhiệt độ làm việc bình thường` : null),
      },
    ],
    needs: ["ect"],
    tests: [
      {
        id: "th1",
        action: "Theo dõi đường ECT từ lúc máy nguội đến 15 phút sau.",
        tool: "Máy chẩn đoán (đồ thị Live Data)",
        expected: "ECT tăng đều và đạt khoảng 85–100°C",
      },
      {
        id: "th2",
        action: "So sánh ECT trên máy chẩn đoán với nhiệt độ thực đo tại cổ nước.",
        tool: "Súng đo nhiệt hồng ngoại",
        expected: "Hai giá trị gần nhau (nếu lệch lớn → nghi cảm biến ECT)",
      },
      {
        id: "th3",
        action: "Sờ/đo ống nước trên về két khi máy chưa đạt nhiệt.",
        tool: "Súng đo nhiệt hồng ngoại",
        expected: "Ống về két còn nguội cho đến khi van mở",
      },
    ],
    repair: {
      kind: "replace",
      action: "Thay van hằng nhiệt đúng nhiệt độ mở của hãng và xả gió hệ thống làm mát.",
      precheck: ["Đã xác nhận ECT đo đúng với nhiệt thực tế"],
    },
    verify: ["Theo dõi ECT đạt nhiệt làm việc", "Xóa mã, theo dõi P0128"],
  },
  {
    id: "ect_sensor",
    title: "Cảm biến nhiệt độ nước (ECT) hoặc mạch",
    system: "Làm mát",
    dtc: { P0115: 3, P0117: 3, P0118: 3, P0128: 1 },
    symptoms: { hard_start: 1 },
    rules: [
      {
        weight: 2,
        check: (r) =>
          r.ect != null && (r.ect < -30 || r.ect > 130) ? `ECT ${r.ect}°C — giá trị không hợp lý về vật lý` : null,
      },
    ],
    needs: ["ect"],
    tests: [
      {
        id: "es1",
        action: "So sánh ECT trên máy chẩn đoán với nhiệt độ đo thực tế.",
        tool: "Súng đo nhiệt hồng ngoại",
        expected: "Chênh lệch nhỏ",
      },
      {
        id: "es2",
        action: "Đo điện trở cảm biến theo nhiệt độ và kiểm tra dây, giắc.",
        tool: "Đồng hồ vạn năng, bảng tra của hãng",
        expected: "Điện trở khớp bảng tra, dây không đứt/chạm",
      },
    ],
    repair: {
      kind: "repair_first",
      action: "Sửa dây/giắc trước; thay cảm biến ECT khi điện trở đo được sai bảng tra.",
      precheck: ["Kiểm tra mạch trước khi thay cảm biến"],
    },
    verify: ["ECT khớp nhiệt độ thực", "Xóa mã, theo dõi"],
  },
  {
    id: "charging",
    title: "Hệ thống sạc (máy phát, dây curoa, ắc quy, mass)",
    system: "Điện",
    dtc: { P0562: 3, P0563: 3 },
    symptoms: { dim_lights: 2, hard_start: 1 },
    rules: [
      {
        weight: 2,
        check: (r) =>
          r.battery != null && r.battery < 13.2 ? `Điện áp khi máy nổ ${r.battery} V (< 13.2 V): sạc yếu` : null,
      },
      {
        weight: 2,
        check: (r) =>
          r.battery != null && r.battery > 15 ? `Điện áp khi máy nổ ${r.battery} V (> 15 V): sạc quá áp` : null,
      },
    ],
    needs: ["battery"],
    tests: [
      {
        id: "ch1",
        action: "Đo điện áp ắc quy khi tắt máy và khi nổ máy bật tải (đèn, quạt, A/C).",
        tool: "Đồng hồ vạn năng",
        expected: "Tắt máy ≈ 12.4–12.7 V; nổ máy ≈ 13.5–14.7 V",
      },
      {
        id: "ch2",
        action: "Kiểm tra dây curoa, cọc bình, dây mass máy và thân xe (đo sụt áp).",
        tool: "Đồng hồ vạn năng",
        expected: "Sụt áp mass thấp, curoa đủ căng",
      },
      {
        id: "ch3",
        action: "Test tải ắc quy.",
        tool: "Máy test ắc quy",
        expected: "Ắc quy đạt chỉ số CCA theo nhãn",
      },
    ],
    repair: {
      kind: "repair_first",
      action: "Vệ sinh cọc bình, xử lý mass, căng/thay curoa trước; thay máy phát hoặc ắc quy khi test xác nhận hỏng.",
      precheck: ["Đã đo sụt áp dây mass", "Test tải ắc quy"],
    },
    verify: ["Đo điện áp sạc khi có tải", "Xóa mã, theo dõi"],
  },
  {
    id: "throttle_body",
    title: "Cổ hút / bướm ga bẩn hoặc van không tải",
    system: "Nạp khí",
    dtc: { P0505: 2, P0506: 2, P0507: 2, P0121: 1, P0122: 1 },
    symptoms: { rough_idle: 1, stall: 1 },
    rules: [
      {
        weight: 1,
        check: (r) =>
          r.rpm != null && (r.ect ?? 90) > 80 && (r.rpm < 550 || (r.rpm > 1000 && r.rpm < 1600))
            ? `Vòng tua không tải ${r.rpm} rpm ngoài dải tham khảo`
            : null,
      },
    ],
    needs: ["rpm"],
    tests: [
      {
        id: "tb1",
        action: "Kiểm tra muội than quanh bướm ga và cổ hút.",
        tool: "Đèn soi",
        expected: "Bướm ga sạch, đóng mở nhẹ",
      },
      {
        id: "tb2",
        action: "Quan sát TPS khi đạp ga từ từ (máy tắt, khóa ON).",
        tool: "Máy chẩn đoán (đồ thị)",
        expected: "Tín hiệu tăng mượt, không giật, không mất",
      },
    ],
    repair: {
      kind: "repair",
      action: "Vệ sinh bướm ga, sau đó học lại không tải (idle relearn) theo quy trình hãng.",
      precheck: ["Không rò chân không"],
    },
    verify: ["Vòng tua không tải ổn định", "Xóa mã, theo dõi"],
  },
  {
    id: "evap_leak",
    title: "Rò rỉ hệ thống EVAP (nắp xăng, ống, van purge)",
    system: "EVAP",
    dtc: { P0440: 3, P0442: 3, P0455: 3, P0456: 3 },
    symptoms: { fuel_smell: 2 },
    rules: [],
    needs: [],
    tests: [
      {
        id: "ev1",
        action: "Kiểm tra nắp bình xăng: gioăng, khóa đủ nấc.",
        tool: "Kiểm tra trực quan",
        expected: "Gioăng không nứt, đóng kín",
      },
      {
        id: "ev2",
        action: "Smoke test hệ thống EVAP.",
        tool: "Máy tạo khói EVAP",
        expected: "Không có điểm thoát khói",
      },
      {
        id: "ev3",
        action: "Kích hoạt và kiểm tra van purge/vent.",
        tool: "Máy chẩn đoán (chức năng kích hoạt), bơm chân không tay",
        expected: "Van đóng/mở đúng lệnh, giữ chân không khi đóng",
      },
    ],
    repair: {
      kind: "repair",
      action: "Thay nắp xăng, ống hoặc van tại điểm rò đã xác định.",
      precheck: ["Xác định điểm rò bằng smoke test"],
    },
    verify: ["Chạy monitor EVAP", "Xóa mã, theo dõi"],
  },
  {
    id: "turbo_boost",
    title: "Boost thấp (rò đường áp, wastegate, turbo)",
    system: "Tăng áp",
    dtc: { P0299: 3 },
    symptoms: { power_loss: 1, whistle: 2 },
    rules: [
      {
        weight: 2,
        check: (r, v) =>
          r.boost != null && v?.stockBoost && r.boost < v.stockBoost * 0.8
            ? `Boost đo ${r.boost} bar < 80% boost gốc khai báo (${v.stockBoost} bar)`
            : null,
      },
    ],
    needs: ["boost"],
    tests: [
      {
        id: "tu1",
        action: "Boost leak test đường áp từ turbo đến cổ hút (bơm khí nén áp thấp).",
        tool: "Bộ test rò boost",
        expected: "Không rò tại ống, co nối, intercooler",
      },
      {
        id: "tu2",
        action: "Kiểm tra wastegate/actuator và van điều khiển boost.",
        tool: "Bơm chân không/áp tay, máy chẩn đoán",
        expected: "Actuator di chuyển đúng, van đáp ứng lệnh",
      },
      {
        id: "tu3",
        action: "Kiểm tra độ rơ trục turbo và dầu ở cửa nạp.",
        tool: "Kiểm tra trực quan",
        expected: "Không rơ dọc, không chạm vỏ, không đọng dầu bất thường",
      },
    ],
    repair: {
      kind: "repair_first",
      action: "Xử lý rò đường áp và actuator trước; thay turbo chỉ khi xác nhận hư hỏng cơ khí.",
      precheck: ["Đã boost leak test", "Đã kiểm tra actuator"],
    },
    verify: ["Ghi boost thực tế so với mục tiêu khi lái thử", "Xóa mã, theo dõi P0299"],
  },
];

export const CAUSE_MAP: Record<string, Cause> = Object.fromEntries(CAUSES.map((c) => [c.id, c]));
export const ALL_STEP_IDS = new Set(CAUSES.flatMap((c) => c.tests.map((t) => t.id)));
export const ALL_REPAIR_IDS = new Set(CAUSES.map((c) => c.id));

export function matchCode(pattern: string, code: string): boolean {
  if (pattern.endsWith("X")) {
    const pre = pattern.slice(0, 4);
    return code.startsWith(pre) && /[1-8]$/.test(code) && code.length === 5;
  }
  return pattern === code;
}

export const GENERIC_VERIFY = [
  "Đọc lại toàn bộ mã lỗi sau sửa",
  "Xóa mã và lái thử theo chu trình (nóng máy, đường trường, không tải)",
  "Đọc lại Live Data liên quan, so với mức trước sửa",
  "Kiểm tra mã pending sau 1–3 chu trình lái",
];
