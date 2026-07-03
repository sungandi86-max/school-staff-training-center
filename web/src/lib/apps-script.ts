import type {
  AppConfig,
  AdminAttendanceStatusResult,
  AppsScriptEnvelope,
  DuplicateAttendanceResult,
  FinalAttendanceGenerateResult,
  FinalAttendancePreviewResult,
  MyTrainingStatusResult,
  SaveAttendanceResult,
  SaveSignatureResult,
  SchoolConfig,
  SetupValidationResult,
  SignatureExistsResult,
  Staff,
  Training,
  TrainingTargetResult
} from "@/lib/types";

export const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: "학교명 미설정",
  centerName: "학교 교직원 교육센터",
  schoolLogoUrl: "",
  primaryColor: "#1F2A44",
  secondaryColor: "#EEF4FF",
  privacyNotice: "전자서명과 출석 기록은 연수 증빙용으로 학교 Google Sheet와 Google Drive에 저장됩니다."
};

export type AppsScriptAction =
  | "getSchoolConfig"
  | "getTrainingList"
  | "getTrainingDetail"
  | "getStaffDetail"
  | "verifyStaff"
  | "checkTrainingTarget"
  | "checkDuplicateAttendance"
  | "saveQrAttendance"
  | "checkSignatureExists"
  | "saveSignature"
  | "getMyTrainingStatus"
  | "getTrainingAttendanceStatus"
  | "getFinalAttendancePreview"
  | "generateFinalAttendanceSheet"
  | "validateSetup";

export type RuntimeConfigResult =
  | {
      ok: true;
      config: AppConfig;
      schoolConfig: SchoolConfig;
    }
  | {
      ok: false;
      schoolConfig: SchoolConfig;
      message: string;
    };

const APP_CONFIG_PATH = "app-config.json";

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStaff(value: unknown): value is Staff {
  return typeof value === "object" && value !== null && "staffId" in value && "name" in value && "department" in value;
}

function mergeSchoolConfig(data: Partial<SchoolConfig>): SchoolConfig {
  return {
    ...DEFAULT_CONFIG,
    ...Object.fromEntries(
      Object.entries(data).filter(([, value]) => (typeof value === "string" ? value.trim().length > 0 : value !== undefined))
    )
  };
}

function themeToColors(theme: AppConfig["theme"]): Pick<SchoolConfig, "primaryColor" | "secondaryColor"> {
  if (!theme || theme === "default") {
    return {
      primaryColor: DEFAULT_CONFIG.primaryColor,
      secondaryColor: DEFAULT_CONFIG.secondaryColor
    };
  }

  return {
    primaryColor: nonEmptyString(theme.primaryColor) ? theme.primaryColor.trim() : DEFAULT_CONFIG.primaryColor,
    secondaryColor: nonEmptyString(theme.secondaryColor) ? theme.secondaryColor.trim() : DEFAULT_CONFIG.secondaryColor
  };
}

function schoolConfigFromAppConfig(config: Partial<AppConfig>): SchoolConfig {
  const themeColors = themeToColors(config.theme);

  return mergeSchoolConfig({
    schoolName: config.schoolName,
    centerName: config.centerName,
    schoolLogoUrl: config.schoolLogo,
    primaryColor: themeColors.primaryColor,
    secondaryColor: themeColors.secondaryColor
  });
}

function schoolConfigOverridesFromAppConfig(config: AppConfig): Partial<SchoolConfig> {
  const themeColors = themeToColors(config.theme);
  const overrides: Partial<SchoolConfig> = {
    primaryColor: themeColors.primaryColor,
    secondaryColor: themeColors.secondaryColor
  };

  if (nonEmptyString(config.schoolName)) {
    overrides.schoolName = config.schoolName.trim();
  }

  if (nonEmptyString(config.centerName)) {
    overrides.centerName = config.centerName.trim();
  }

  if (nonEmptyString(config.schoolLogo)) {
    overrides.schoolLogoUrl = config.schoolLogo.trim();
  }

  return overrides;
}

export async function loadAppConfig(): Promise<RuntimeConfigResult> {
  if (typeof window === "undefined") {
    return {
      ok: false,
      schoolConfig: DEFAULT_CONFIG,
      message: "브라우저에서 app-config.json을 다시 불러와 주세요."
    };
  }

  try {
    const response = await fetch(APP_CONFIG_PATH, { cache: "no-store" });

    if (!response.ok) {
      return {
        ok: false,
        schoolConfig: DEFAULT_CONFIG,
        message: "app-config.json 파일을 찾을 수 없습니다. app-config.example.json을 복사해 학교 설정을 입력해 주세요."
      };
    }

    const config = (await response.json()) as AppConfig;
    const schoolConfig = schoolConfigFromAppConfig(config);

    if (!nonEmptyString(config.appsScriptUrl)) {
      return {
        ok: false,
        schoolConfig,
        message: "app-config.json의 appsScriptUrl 값을 입력해 주세요."
      };
    }

    return {
      ok: true,
      config: {
        ...config,
        appsScriptUrl: config.appsScriptUrl.trim()
      },
      schoolConfig
    };
  } catch {
    return {
      ok: false,
      schoolConfig: DEFAULT_CONFIG,
      message: "app-config.json을 읽을 수 없습니다. JSON 형식과 배포 위치를 확인해 주세요."
    };
  }
}

async function requestAppsScript<T>(config: AppConfig, action: AppsScriptAction, requestPayload: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(config.appsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({ action, ...requestPayload }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("학교 데이터를 불러오지 못했습니다.");
  }

  const responsePayload = (await response.json()) as AppsScriptEnvelope<T> | T;

  if (typeof responsePayload === "object" && responsePayload && "ok" in responsePayload && responsePayload.ok === false) {
    throw new Error(responsePayload.message ?? responsePayload.error ?? "학교 데이터를 불러오지 못했습니다.");
  }

  if (typeof responsePayload === "object" && responsePayload && "data" in responsePayload) {
    return responsePayload.data as T;
  }

  return responsePayload as T;
}

export async function getSchoolConfig(config: AppConfig): Promise<{ data: SchoolConfig; error?: string }> {
  try {
    const data = await requestAppsScript<Partial<SchoolConfig>>(config, "getSchoolConfig");
    return { data: mergeSchoolConfig({ ...data, ...schoolConfigOverridesFromAppConfig(config) }) };
  } catch (error) {
    return {
      data: schoolConfigFromAppConfig(config),
      error: error instanceof Error ? error.message : "학교설정을 불러오지 못했습니다."
    };
  }
}

export async function getTrainingList(config: AppConfig): Promise<{ data: Training[]; error?: string }> {
  try {
    const payload = await requestAppsScript<{ trainings?: Training[] } | Training[]>(config, "getTrainingList");
    const trainings = Array.isArray(payload) ? payload : payload.trainings ?? [];
    return { data: trainings.map(normalizeTraining) };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "교육목록을 불러오지 못했습니다."
    };
  }
}

export async function getTrainingDetail(config: AppConfig, trainingId: string): Promise<{ data?: Training; error?: string }> {
  try {
    const training = await requestAppsScript<Training>(config, "getTrainingDetail", { trainingId });
    return { data: normalizeTraining(training) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교육 정보를 불러오지 못했습니다."
    };
  }
}

export async function getStaffDetail(config: AppConfig, staffId: string): Promise<{ data?: Staff; error?: string }> {
  try {
    const staff = await requestAppsScript<Staff>(config, "getStaffDetail", { staffId });
    return { data: staff };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교직원 정보를 불러오지 못했습니다."
    };
  }
}

export async function verifyStaff(config: AppConfig, staffQuery: string, authCode: string): Promise<{ data?: Staff; error?: string }> {
  try {
    const payload = await requestAppsScript<{ staff?: Staff } | Staff>(config, "verifyStaff", { staffQuery, authCode });
    const staff = isStaff(payload) ? payload : payload.staff;

    if (!staff) {
      return { error: "교직원 정보를 확인할 수 없습니다." };
    }

    return { data: staff };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교직원 정보를 확인할 수 없습니다."
    };
  }
}

export async function checkTrainingTarget(
  config: AppConfig,
  trainingId: string,
  staffId: string
): Promise<{ data?: TrainingTargetResult; error?: string }> {
  try {
    const data = await requestAppsScript<TrainingTargetResult>(config, "checkTrainingTarget", { trainingId, staffId });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교육대상 여부를 확인하지 못했습니다."
    };
  }
}

export async function checkDuplicateAttendance(
  config: AppConfig,
  trainingId: string,
  staffId: string
): Promise<{ data?: DuplicateAttendanceResult; error?: string }> {
  try {
    const data = await requestAppsScript<DuplicateAttendanceResult>(config, "checkDuplicateAttendance", { trainingId, staffId });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "출석 기록을 확인하지 못했습니다."
    };
  }
}

export async function saveQrAttendance(
  config: AppConfig,
  trainingId: string,
  staffId: string
): Promise<{ data?: SaveAttendanceResult; error?: string }> {
  try {
    const data = await requestAppsScript<SaveAttendanceResult>(config, "saveQrAttendance", {
      trainingId,
      staffId,
      method: "QR"
    });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "출석을 저장하지 못했습니다."
    };
  }
}

export async function checkSignatureExists(
  config: AppConfig,
  trainingId: string,
  staffId: string
): Promise<{ data?: SignatureExistsResult; error?: string }> {
  try {
    const data = await requestAppsScript<SignatureExistsResult>(config, "checkSignatureExists", { trainingId, staffId });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "전자서명 기록을 확인하지 못했습니다."
    };
  }
}

export async function saveSignature(
  config: AppConfig,
  trainingId: string,
  staffId: string,
  signatureImageBase64: string
): Promise<{ data?: SaveSignatureResult; error?: string }> {
  try {
    const data = await requestAppsScript<SaveSignatureResult>(config, "saveSignature", {
      trainingId,
      staffId,
      signatureImageBase64
    });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "전자서명을 저장하지 못했습니다."
    };
  }
}

export async function getMyTrainingStatus(config: AppConfig, staffId: string): Promise<{ data?: MyTrainingStatusResult; error?: string }> {
  try {
    const data = await requestAppsScript<MyTrainingStatusResult>(config, "getMyTrainingStatus", { staffId });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "내 이수현황을 불러오지 못했습니다."
    };
  }
}

export async function getTrainingAttendanceStatus(
  config: AppConfig,
  trainingId: string
): Promise<{ data?: AdminAttendanceStatusResult; error?: string }> {
  try {
    const data = await requestAppsScript<AdminAttendanceStatusResult>(config, "getTrainingAttendanceStatus", { trainingId });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교육별 출석현황을 불러오지 못했습니다."
    };
  }
}

export async function getFinalAttendancePreview(
  config: AppConfig,
  trainingId: string
): Promise<{ data?: FinalAttendancePreviewResult; error?: string }> {
  try {
    const data = await requestAppsScript<FinalAttendancePreviewResult>(config, "getFinalAttendancePreview", { trainingId });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "최종 서명부 미리보기를 불러오지 못했습니다."
    };
  }
}

export async function generateFinalAttendanceSheet(
  config: AppConfig,
  trainingId: string
): Promise<{ data?: FinalAttendanceGenerateResult; error?: string }> {
  try {
    const data = await requestAppsScript<FinalAttendanceGenerateResult>(config, "generateFinalAttendanceSheet", { trainingId });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "최종 서명부를 생성하지 못했습니다."
    };
  }
}

export async function validateSetup(config: AppConfig): Promise<{ data?: SetupValidationResult; error?: string }> {
  try {
    const data = await requestAppsScript<SetupValidationResult>(config, "validateSetup");
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "설치 상태를 점검하지 못했습니다."
    };
  }
}

function normalizeTraining(training: Partial<Training>): Training {
  const place = training.place ?? training.location ?? "";
  const status = training.status ?? training.activeStatus ?? "";

  return {
    trainingId: training.trainingId ?? "",
    title: training.title ?? "",
    date: training.date ?? "",
    time: training.time ?? "",
    place,
    location: place,
    department: training.department ?? "",
    category: training.category ?? "",
    qrEnabled: Boolean(training.qrEnabled),
    signatureRequired: Boolean(training.signatureRequired),
    certificateRequired: Boolean(training.certificateRequired),
    status,
    activeStatus: status
  };
}
