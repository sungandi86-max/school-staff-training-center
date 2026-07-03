import type { AppsScriptEnvelope, SchoolConfig, Training } from "@/lib/types";

export const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: "학교명 미설정",
  centerName: "학교 교직원 교육센터",
  primaryColor: "#1F2A44",
  secondaryColor: "#EEF4FF",
  privacyNotice: "전자서명과 출석 기록은 연수 증빙용으로 학교 Google Sheet와 Google Drive에 저장됩니다."
};

export type AppsScriptAction = "getSchoolConfig" | "getTrainingList";

export type RuntimeConfig = {
  appsScriptUrl?: string;
};

const STORAGE_KEY = "school-staff-training-center.appsScriptUrl";

function mergeSchoolConfig(data: Partial<SchoolConfig>): SchoolConfig {
  return {
    ...DEFAULT_CONFIG,
    ...Object.fromEntries(
      Object.entries(data).filter(([, value]) => (typeof value === "string" ? value.trim().length > 0 : value !== undefined))
    )
  };
}

async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (typeof window === "undefined") {
    return {};
  }

  const storedUrl = window.localStorage.getItem(STORAGE_KEY);
  if (storedUrl) {
    return { appsScriptUrl: storedUrl };
  }

  try {
    const response = await fetch("app-config.json", { cache: "no-store" });
    if (!response.ok) {
      return {};
    }

    return (await response.json()) as RuntimeConfig;
  } catch {
    return {};
  }
}

export async function resolveAppsScriptUrl(): Promise<string | undefined> {
  const runtimeConfig = await loadRuntimeConfig();
  return runtimeConfig.appsScriptUrl;
}

async function requestAppsScript<T>(action: AppsScriptAction): Promise<T> {
  const url = await resolveAppsScriptUrl();

  if (!url) {
    throw new Error("Apps Script URL이 설정되지 않았습니다.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({ action }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("학교 데이터를 불러오지 못했습니다.");
  }

  const payload = (await response.json()) as AppsScriptEnvelope<T> | T;

  if (typeof payload === "object" && payload && "ok" in payload && payload.ok === false) {
    throw new Error(payload.message ?? payload.error ?? "학교 데이터를 불러오지 못했습니다.");
  }

  if (typeof payload === "object" && payload && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export async function getSchoolConfig(): Promise<{ data: SchoolConfig; error?: string }> {
  try {
    const data = await requestAppsScript<Partial<SchoolConfig>>("getSchoolConfig");
    return { data: mergeSchoolConfig(data) };
  } catch (error) {
    return {
      data: DEFAULT_CONFIG,
      error: error instanceof Error ? error.message : "학교설정을 불러오지 못했습니다."
    };
  }
}

export async function getTrainingList(): Promise<{ data: Training[]; error?: string }> {
  try {
    const payload = await requestAppsScript<{ trainings?: Training[] } | Training[]>("getTrainingList");
    const trainings = Array.isArray(payload) ? payload : payload.trainings ?? [];
    return { data: trainings };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "교육목록을 불러오지 못했습니다."
    };
  }
}
