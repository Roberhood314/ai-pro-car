import {
  CAUSES,
  PID_MAP,
  PIDS,
  decodeDtc,
  matchCode,
  symptomLabel,
  type Cause,
  type DecodedDtc,
  type TestStep,
} from "./knowledge";
import { parseDtc, type DtcStatus, type Level, type PidId, type Readings, type Session, type Vehicle } from "./types";

export interface DtcView extends DecodedDtc {
  status: DtcStatus;
}

export interface CauseResult {
  cause: Cause;
  level: Level | "ruled_out";
  score: number;
  evidence: string[];
  basis: string[];
  missing: string[];
  confirmedBy: TestStep | null;
  capped: boolean;
}

export interface SensorFlag {
  pid: PidId;
  label: string;
  value: number;
  unit: string;
  state: "low" | "high";
  from: "sensor" | "freeze";
}

export interface Analysis {
  hasData: boolean;
  dtcs: DtcView[];
  safety: DtcView[];
  causes: CauseResult[];
  byLevel: Record<Level, CauseResult[]>;
  ruledOut: CauseResult[];
  warnings: string[];
  missingData: string[];
  flags: SensorFlag[];
  singleDtcOnly: boolean;
  summary: string;
  next: string;
}

const STATUS_FACTOR: Record<DtcStatus, number> = { current: 1, pending: 0.75, history: 0.5 };
const LEVEL_RANK: Record<string, number> = { confirmed: 0, probable: 1, possible: 2, need_test: 3, ruled_out: 4 };

export function sensorFlags(r: Readings, from: "sensor" | "freeze" = "sensor"): SensorFlag[] {
  const out: SensorFlag[] = [];
  for (const p of PIDS) {
    const v = r[p.id];
    if (v == null) continue;
    if (p.min != null && v < p.min) out.push({ pid: p.id, label: p.label, value: v, unit: p.unit, state: "low", from });
    else if (p.max != null && v > p.max) out.push({ pid: p.id, label: p.label, value: v, unit: p.unit, state: "high", from });
  }
  return out;
}

export function testState(cause: Cause, tests: Session["tests"]): {
  confirmedBy: TestStep | null;
  ruledOut: boolean;
  nextIndex: number;
} {
  for (let i = 0; i < cause.tests.length; i++) {
    const m = tests[cause.tests[i].id];
    if (m === "bad") return { confirmedBy: cause.tests[i], ruledOut: false, nextIndex: -1 };
    if (m !== "ok") return { confirmedBy: null, ruledOut: false, nextIndex: i };
  }
  return { confirmedBy: null, ruledOut: cause.tests.length > 0, nextIndex: -1 };
}

export function analyze(s: Session, v: Vehicle | null): Analysis {
  const dtcs: DtcView[] = s.dtcs.map((e) => {
    const p = parseDtc(e);
    return { ...decodeDtc(p.code), status: p.status };
  });
  const safety = dtcs.filter((d) => d.safety);
  const engineDtcs = dtcs.filter((d) => !d.safety);
  const hasSensors = Object.keys(s.sensors).length > 0;
  const hasFreeze = Object.keys(s.freeze).length > 0;
  const hasSymptoms = s.symptoms.length > 0;
  const hasData = dtcs.length > 0 || hasSensors || hasFreeze || hasSymptoms;
  const singleDtcOnly = engineDtcs.length === 1 && !hasSensors && !hasFreeze && !hasSymptoms;

  const causes: CauseResult[] = [];
  for (const cause of CAUSES) {
    let score = 0;
    const evidence: string[] = [];
    const basis = new Set<string>();

    for (const d of engineDtcs) {
      for (const [pat, w] of Object.entries(cause.dtc)) {
        if (matchCode(pat, d.code)) {
          const add = w * STATUS_FACTOR[d.status];
          score += add;
          basis.add("DTC");
          evidence.push(
            `${d.code} (${d.status === "current" ? "hiện hành" : d.status === "pending" ? "chờ xác nhận" : "lịch sử"}): ${d.desc}`,
          );
          break;
        }
      }
    }
    for (const sym of s.symptoms) {
      const w = cause.symptoms[sym];
      if (w) {
        score += w;
        basis.add("Triệu chứng");
        evidence.push(`Triệu chứng: ${symptomLabel(sym)}`);
      }
    }
    for (const rule of cause.rules) {
      const live = hasSensors ? rule.check(s.sensors, v) : null;
      if (live) {
        score += rule.weight;
        basis.add("Live Data");
        evidence.push(live);
        continue;
      }
      const ff = hasFreeze ? rule.check(s.freeze, v) : null;
      if (ff) {
        score += rule.weight * 0.75;
        basis.add("Freeze Frame");
        evidence.push(`${ff} (Freeze Frame${s.freezeDtc ? ` ${s.freezeDtc}` : ""})`);
      }
    }

    const ts = testState(cause, s.tests);
    const anyTested = cause.tests.some((t) => s.tests[t.id]);
    if (score <= 0 && !anyTested) continue;

    const missing = cause.needs
      .filter((id) => s.sensors[id] == null && s.freeze[id] == null)
      .map((id) => PID_MAP[id].label);
    if (cause.id === "maf_dirty" && !v?.displacement) missing.push("Dung tích động cơ (khai báo trong Garage)");
    if (cause.id === "turbo_boost" && !v?.stockBoost) missing.push("Boost gốc của xe");

    let level: CauseResult["level"];
    let capped = false;
    if (ts.confirmedBy) level = "confirmed";
    else if (ts.ruledOut) level = "ruled_out";
    else {
      const types = basis.size;
      if (score >= 4 && types >= 2) level = "probable";
      else if (score >= 2) level = "possible";
      else level = "need_test";
      if (types === 1 && basis.has("DTC") && missing.length > 0) level = "need_test";
      if (singleDtcOnly && level === "probable") {
        level = "possible";
        capped = true;
      }
    }
    causes.push({
      cause,
      level,
      score: Math.round(score * 10) / 10,
      evidence,
      basis: [...basis],
      missing,
      confirmedBy: ts.confirmedBy,
      capped,
    });
  }
  causes.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || b.score - a.score);

  const byLevel: Record<Level, CauseResult[]> = { confirmed: [], probable: [], possible: [], need_test: [] };
  const ruledOut: CauseResult[] = [];
  for (const c of causes) {
    if (c.level === "ruled_out") ruledOut.push(c);
    else byLevel[c.level].push(c);
  }

  const flags = [...sensorFlags(s.sensors, "sensor"), ...(hasSensors ? [] : sensorFlags(s.freeze, "freeze"))];

  const warnings: string[] = [];
  if (singleDtcOnly)
    warnings.push(
      "Kết luận hiện chỉ dựa trên MỘT mã lỗi. Không thay phụ tùng dựa trên một mã duy nhất — hãy bổ sung Live Data, Freeze Frame hoặc triệu chứng.",
    );
  for (const d of dtcs.filter((x) => !x.known))
    warnings.push(`${d.code}: ${d.desc}. Cần kiểm tra thêm, app không suy diễn nguyên nhân cho mã này.`);
  if (engineDtcs.length > 0 && engineDtcs.every((d) => d.status === "history"))
    warnings.push("Tất cả mã đều là mã lịch sử — lỗi có thể đã không còn hiện hành. Xóa mã và theo dõi tái xuất hiện.");
  if (dtcs.some((d) => d.code.startsWith("U")))
    warnings.push("Có mã mạng giao tiếp (U-code): kiểm tra nguồn, mass và mạng CAN trước khi nghi ngờ module.");
  if (s.source !== "live")
    warnings.push(`Dữ liệu phiên này là ${s.source === "sim" ? "MÔ PHỎNG" : "NHẬP TAY"} — cần đối chiếu với dữ liệu đọc trực tiếp từ xe.`);

  const missingSet = new Set<string>();
  if (engineDtcs.length > 0 && !hasFreeze) missingSet.add("Freeze Frame của mã lỗi chính");
  if (!hasSensors) missingSet.add("Live Data (giá trị cảm biến)");
  if (!hasSymptoms) missingSet.add("Triệu chứng người lái ghi nhận");
  for (const c of causes) if (c.level !== "ruled_out" && c.level !== "confirmed") c.missing.forEach((m) => missingSet.add(m));

  let summary: string;
  let next: string;
  if (!hasData) {
    summary = "Chưa có dữ liệu. Cần kiểm tra thêm.";
    next = "Nhập mã lỗi, Live Data hoặc triệu chứng ở bước Dữ liệu.";
  } else if (byLevel.confirmed.length) {
    summary = `Đã xác nhận: ${byLevel.confirmed.map((c) => c.cause.title).join("; ")}.`;
    next = "Chuyển sang bước Sửa chữa theo hướng xử lý đề xuất, sau đó xác minh.";
  } else if (byLevel.probable.length) {
    summary = `Khả năng cao: ${byLevel.probable[0].cause.title}. Chưa xác nhận — cần kiểm tra trước khi sửa.`;
    next = `Thực hiện quy trình kiểm tra cho "${byLevel.probable[0].cause.title}".`;
  } else if (byLevel.possible.length) {
    summary = `Có thể: ${byLevel.possible
      .slice(0, 2)
      .map((c) => c.cause.title)
      .join("; ")}. Bằng chứng chưa đủ để kết luận.`;
    next = "Bổ sung dữ liệu còn thiếu và thực hiện kiểm tra để thu hẹp nguyên nhân.";
  } else if (causes.length === 0 && safety.length === 0 && flags.length === 0) {
    summary =
      engineDtcs.some((d) => !d.known)
        ? "Có mã chưa có trong cơ sở dữ liệu. Cần kiểm tra thêm theo tài liệu hãng."
        : "Không phát hiện bất thường từ dữ liệu đã nhập.";
    next = "Nếu vẫn có triệu chứng, bổ sung thêm dữ liệu hoặc đọc trực tiếp từ xe.";
  } else if (byLevel.need_test.length || flags.length) {
    summary = "Cần kiểm tra thêm — dữ liệu hiện có chưa đủ để đánh giá nguyên nhân.";
    next = "Bổ sung dữ liệu còn thiếu được liệt kê bên dưới.";
  } else {
    summary = ruledOut.length ? "Các nguyên nhân đã kiểm tra đều bị loại trừ. Cần kiểm tra thêm." : "Cần kiểm tra thêm.";
    next = "Bổ sung dữ liệu hoặc tham khảo tài liệu hãng.";
  }
  if (safety.length) {
    summary += ` Có ${safety.length} mã thuộc hệ thống an toàn (SAFE READ).`;
  }

  return {
    hasData,
    dtcs,
    safety,
    causes,
    byLevel,
    ruledOut,
    warnings,
    missingData: [...missingSet],
    flags,
    singleDtcOnly,
    summary,
    next,
  };
}

export interface Health {
  score: number | null;
  label: string;
  tone: "ok" | "warn" | "bad" | "none";
}

export function vehicleHealth(s: Session | null, a: Analysis | null): Health {
  if (!s || !a || !a.hasData) return { score: null, label: "Chưa có dữ liệu", tone: "none" };
  if (s.verifyStatus === "fixed") return { score: 95, label: "Đã khắc phục", tone: "ok" };
  let score = 100;
  for (const d of a.dtcs) {
    if (d.status === "history") continue;
    const w = d.severity === "high" ? 28 : d.severity === "med" ? 15 : 8;
    score -= d.status === "pending" ? Math.round(w * 0.6) : w;
  }
  score -= a.flags.length * 5;
  score = Math.max(5, Math.min(100, score));
  if (score >= 80) return { score, label: "Tốt", tone: "ok" };
  if (score >= 50) return { score, label: "Cần chú ý", tone: "warn" };
  return { score, label: "Nguy cơ", tone: "bad" };
}
