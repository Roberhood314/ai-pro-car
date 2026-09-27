import type { Readings } from "./types";

export interface Scenario {
  id: string;
  title: string;
  desc: string;
  dtcs: string[];
  sensors: Readings;
  freezeDtc: string;
  freeze: Readings;
  symptoms: string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "lean",
    title: "Hỗn hợp nghèo P0171",
    desc: "Fuel trim cao ở không tải, tiếng xì khoang máy.",
    dtcs: ["P0171:current"],
    sensors: { rpm: 720, ect: 90, iat: 34, maf: 2.4, map: 38, load: 24, stft1: 8, ltft1: 17, o2s1: 0.32, battery: 14.1 },
    freezeDtc: "P0171",
    freeze: { rpm: 760, ect: 88, load: 22, stft1: 9, ltft1: 18, speed: 0 },
    symptoms: ["rough_idle", "hissing"],
  },
  {
    id: "misfire",
    title: "Bỏ máy xy lanh 2",
    desc: "P0300 + P0302, đèn check engine nhấp nháy khi tăng tải.",
    dtcs: ["P0300:current", "P0302:current"],
    sensors: { rpm: 680, ect: 92, stft1: 3, ltft1: 2, load: 31, battery: 14.0 },
    freezeDtc: "P0302",
    freeze: { rpm: 2200, ect: 91, load: 62, speed: 48 },
    symptoms: ["rough_idle", "flashing_mil", "power_loss"],
  },
  {
    id: "catalyst",
    title: "Xúc tác P0420",
    desc: "Mã xúc tác kèm mùi ống xả, Live Data cơ bản.",
    dtcs: ["P0420:current"],
    sensors: { rpm: 740, ect: 93, stft1: 1, ltft1: 3, o2s1: 0.52, o2s2: 0.47 },
    freezeDtc: "",
    freeze: {},
    symptoms: ["egg_smell"],
  },
  {
    id: "thermostat",
    title: "Máy không đạt nhiệt P0128",
    desc: "ECT thấp sau khi chạy, sưởi yếu.",
    dtcs: ["P0128:current"],
    sensors: { rpm: 760, ect: 66, iat: 28, battery: 14.2 },
    freezeDtc: "P0128",
    freeze: { ect: 64, rpm: 1900, speed: 62 },
    symptoms: ["heater_weak"],
  },
  {
    id: "single",
    title: "Chỉ có một mã P0101",
    desc: "Minh họa cảnh báo khi chỉ dựa trên một mã lỗi.",
    dtcs: ["P0101:current"],
    sensors: {},
    freezeDtc: "",
    freeze: {},
    symptoms: [],
  },
  {
    id: "charging",
    title: "Điện áp thấp P0562",
    desc: "Điện áp sạc thấp, khó nổ buổi sáng.",
    dtcs: ["P0562:current"],
    sensors: { rpm: 750, ect: 90, battery: 12.4 },
    freezeDtc: "",
    freeze: {},
    symptoms: ["dim_lights", "hard_start"],
  },
  {
    id: "abs",
    title: "ABS C0035 (SAFE READ)",
    desc: "Mã hệ thống phanh — chỉ đọc, không can thiệp.",
    dtcs: ["C0035:current"],
    sensors: { rpm: 750, battery: 14.1 },
    freezeDtc: "",
    freeze: {},
    symptoms: ["brake_warning"],
  },
];
