export type Source = "live" | "sim" | "manual";
export type DtcStatus = "current" | "pending" | "history";
export type Stage = "data" | "analysis" | "testing" | "repair" | "verify";
export type Level = "confirmed" | "probable" | "possible" | "need_test";
export type VerifyStatus = "" | "fixed" | "not_fixed" | "monitor";
export type Aspiration = "na" | "turbo" | "sc";
export type Fuel = "gasoline" | "diesel" | "hybrid";
export type Transmission = "mt" | "at" | "cvt" | "dct";
export type TestMark = "ok" | "bad";
export type UpgradeGoal = "daily" | "sport" | "track";

export type PidId =
  | "rpm"
  | "ect"
  | "iat"
  | "maf"
  | "map"
  | "load"
  | "stft1"
  | "ltft1"
  | "stft2"
  | "ltft2"
  | "o2s1"
  | "o2s2"
  | "tps"
  | "battery"
  | "spark"
  | "fuelp"
  | "boost"
  | "speed";

export type Readings = Partial<Record<PidId, number>>;

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  engine: string;
  displacement: number | null;
  aspiration: Aspiration;
  transmission: Transmission;
  fuel: Fuel;
  stockHp: number | null;
  stockBoost: number | null;
  odo: number | null;
  goal: UpgradeGoal;
  createdAt: number;
}

export interface Maint {
  id: string;
  date: string;
  km: number | null;
  item: string;
  note: string;
}

export interface Session {
  id: string;
  vehicleId: string;
  title: string;
  source: Source;
  scenarioId: string;
  stage: Stage;
  /** "P0171:current" */
  dtcs: string[];
  sensors: Readings;
  freezeDtc: string;
  freeze: Readings;
  symptoms: string[];
  notes: string;
  tests: Record<string, TestMark>;
  repairsDone: string[];
  verifyStatus: VerifyStatus;
  verifyNote: string;
  verifyChecks: string[];
  createdAt: number;
  updatedAt: number;
}

export interface VehicleData {
  maint: Maint[];
  sessions: Session[];
}

export const STAGES: { id: Stage; label: string; short: string }[] = [
  { id: "data", label: "Dữ liệu", short: "Data" },
  { id: "analysis", label: "Phân tích", short: "Analysis" },
  { id: "testing", label: "Kiểm tra", short: "Testing" },
  { id: "repair", label: "Sửa chữa", short: "Repair" },
  { id: "verify", label: "Xác minh", short: "Verification" },
];

export const SOURCE_LABEL: Record<Source, string> = {
  live: "Trực tiếp từ xe",
  sim: "Mô phỏng",
  manual: "Nhập tay",
};

export const LEVEL_META: Record<Level, { label: string; blurb: string }> = {
  confirmed: { label: "Đã xác nhận", blurb: "Có kết quả kiểm tra bất thường chứng minh" },
  probable: { label: "Khả năng cao", blurb: "Nhiều nguồn bằng chứng độc lập cùng chỉ về" },
  possible: { label: "Có thể", blurb: "Có bằng chứng nhưng chưa đủ để kết luận" },
  need_test: { label: "Cần kiểm tra thêm", blurb: "Thiếu dữ liệu — chưa thể đánh giá" },
};

export const ASPIRATION_LABEL: Record<Aspiration, string> = {
  na: "Hút khí tự nhiên",
  turbo: "Turbo",
  sc: "Supercharger",
};
export const FUEL_LABEL: Record<Fuel, string> = { gasoline: "Xăng", diesel: "Dầu diesel", hybrid: "Hybrid" };
export const TRANS_LABEL: Record<Transmission, string> = {
  mt: "Số sàn",
  at: "Tự động",
  cvt: "CVT",
  dct: "Ly hợp kép",
};
export const GOAL_LABEL: Record<UpgradeGoal, string> = {
  daily: "Đi hàng ngày, bền bỉ",
  sport: "Thể thao đường phố",
  track: "Đường đua",
};

export function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function parseDtc(entry: string): { code: string; status: DtcStatus } {
  const [code, st] = entry.split(":");
  const status: DtcStatus = st === "pending" || st === "history" ? st : "current";
  return { code: (code || "").toUpperCase(), status };
}

export function vehicleName(v: Vehicle | null | undefined): string {
  if (!v) return "Chưa chọn xe";
  return [v.make, v.model, v.year ?? ""].filter(Boolean).join(" ");
}

export function relativeTime(ts: number, now = Date.now()): string {
  const d = Math.max(0, now - ts);
  const m = Math.floor(d / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
}
