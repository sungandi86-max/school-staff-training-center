import type {
  AppConfig,
  AdminAttendanceStatusResult,
  AdminStaff,
  AppsScriptEnvelope,
  BulkSignatureResult,
  CertificateRequiredTrainingsResult,
  CertificateSubmissionResult,
  DuplicateAttendanceResult,
  FinalAttendanceGenerateResult,
  FinalAttendancePreviewResult,
  MyTrainingStatusResult,
  SaveAttendanceResult,
  SaveSignatureResult,
  SchoolConfig,
  SchoolConfigUpdate,
  SetupValidationResult,
  SignatureExistsResult,
  SignatureRequiredTrainingsResult,
  Staff,
  StaffListResult,
  Training,
  TrainingTargetResult
} from "@/lib/types";
import { getAssetPath } from "@/lib/paths";

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
  | "createTraining"
  | "updateTraining"
  | "updateTrainingStatus"
  | "getStaffDetail"
  | "getStaffByNameDept"
  | "getStaffList"
  | "createStaff"
  | "updateStaff"
  | "deactivateStaff"
  | "verifyAdminCode"
  | "verifyStaff"
  | "getTrainingTargets"
  | "checkTrainingTarget"
  | "checkDuplicateAttendance"
  | "saveQrAttendance"
  | "checkSignatureExists"
  | "saveSignature"
  | "getSignatureRequiredTrainings"
  | "saveBulkSignature"
  | "getMyTrainingStatus"
  | "getMyTrainingStatusByNameDept"
  | "getCertificateRequiredTrainings"
  | "saveCertificateSubmission"
  | "getTrainingAttendanceStatus"
  | "getFinalAttendancePreview"
  | "generateFinalAttendanceSheet"
  | "getNotices"
  | "getDepartments"
  | "getCodeValues"
  | "validateSetup"
  | "updateSchoolConfig";

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

const APP_CONFIG_PATH = getAssetPath("app-config.json");

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

function stripSensitiveSchoolConfig(data: Partial<SchoolConfig> & { adminCode?: unknown }): Partial<SchoolConfig> {
  const safeData = { ...data };
  delete safeData.adminCode;
  return safeData;
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
  const overrides: Partial<SchoolConfig> = {};

  if (nonEmptyString(config.schoolName) && config.schoolName.trim() !== "학교명 미설정") {
    overrides.schoolName = config.schoolName.trim();
  }

  if (nonEmptyString(config.centerName) && config.centerName.trim() !== "학교 교직원 교육센터") {
    overrides.centerName = config.centerName.trim();
  }

  if (nonEmptyString(config.schoolLogo)) {
    overrides.schoolLogoUrl = config.schoolLogo.trim();
  }

  if (typeof config.theme === "object" && config.theme !== null) {
    const themeColors = themeToColors(config.theme);
    overrides.primaryColor = themeColors.primaryColor;
    overrides.secondaryColor = themeColors.secondaryColor;
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
    return { data: mergeSchoolConfig({ ...stripSensitiveSchoolConfig(data), ...schoolConfigOverridesFromAppConfig(config) }) };
  } catch (error) {
    return {
      data: schoolConfigFromAppConfig(config),
      error: error instanceof Error ? error.message : "학교설정을 불러오지 못했습니다."
    };
  }
}

export async function updateSchoolConfig(
  config: AppConfig,
  settings: SchoolConfigUpdate
): Promise<{ data?: SchoolConfig; error?: string }> {
  try {
    const data = await requestAppsScript<Partial<SchoolConfig>>(config, "updateSchoolConfig", { settings });
    return { data: mergeSchoolConfig({ ...stripSensitiveSchoolConfig(data), ...schoolConfigOverridesFromAppConfig(config) }) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "학교설정을 저장하지 못했습니다."
    };
  }
}

export async function getTrainingList(config: AppConfig, options: { includeInactive?: boolean } = {}): Promise<{ data: Training[]; error?: string }> {
  try {
    const payload = await requestAppsScript<{ trainings?: Training[] } | Training[]>(config, "getTrainingList", options);
    const trainings = Array.isArray(payload) ? payload : payload.trainings ?? [];
    return { data: trainings.map(normalizeTraining) };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "교육목록을 불러오지 못했습니다."
    };
  }
}

export type TrainingMutation = Partial<Training> & {
  note?: string;
};

export async function createTraining(config: AppConfig, training: TrainingMutation): Promise<{ data?: Training; error?: string }> {
  try {
    const data = await requestAppsScript<Training>(config, "createTraining", { training });
    return { data: normalizeTraining(data) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교육을 추가하지 못했습니다."
    };
  }
}

export async function updateTraining(
  config: AppConfig,
  trainingId: string,
  training: TrainingMutation
): Promise<{ data?: Training; error?: string }> {
  try {
    const data = await requestAppsScript<Training>(config, "updateTraining", { trainingId, training });
    return { data: normalizeTraining(data) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교육 정보를 저장하지 못했습니다."
    };
  }
}

export async function updateTrainingStatus(
  config: AppConfig,
  trainingId: string,
  status: string
): Promise<{ data?: Training; error?: string }> {
  try {
    const data = await requestAppsScript<Training>(config, "updateTrainingStatus", { trainingId, status });
    return { data: normalizeTraining(data) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교육 상태를 변경하지 못했습니다."
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

export async function getStaffByNameDept(
  config: AppConfig,
  name: string,
  department: string
): Promise<{ data?: Staff; error?: string }> {
  try {
    const payload = await requestAppsScript<{ staff?: Staff } | Staff>(config, "getStaffByNameDept", {
      name,
      department
    });
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

export async function getStaffList(config: AppConfig): Promise<{ data?: StaffListResult; error?: string }> {
  try {
    const data = await requestAppsScript<StaffListResult>(config, "getStaffList");
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교직원 명단을 불러오지 못했습니다."
    };
  }
}

export async function verifyAdminCode(config: AppConfig, adminCode: string): Promise<{ data?: { verified: boolean }; error?: string }> {
  try {
    const data = await requestAppsScript<{ verified: boolean }>(config, "verifyAdminCode", { adminCode });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "관리자 코드가 일치하지 않습니다."
    };
  }
}

export async function createStaff(config: AppConfig, staff: Partial<AdminStaff>): Promise<{ data?: AdminStaff; error?: string }> {
  try {
    const data = await requestAppsScript<AdminStaff>(config, "createStaff", { staff });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교직원을 추가하지 못했습니다."
    };
  }
}

export async function updateStaff(
  config: AppConfig,
  staffId: string,
  staff: Partial<AdminStaff>
): Promise<{ data?: AdminStaff; error?: string }> {
  try {
    const data = await requestAppsScript<AdminStaff>(config, "updateStaff", { staffId, staff });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "교직원 정보를 저장하지 못했습니다."
    };
  }
}

export async function deactivateStaff(config: AppConfig, staffId: string): Promise<{ data?: AdminStaff; error?: string }> {
  try {
    const data = await requestAppsScript<AdminStaff>(config, "deactivateStaff", { staffId });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "재직상태를 변경하지 못했습니다."
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

export async function getSignatureRequiredTrainings(
  config: AppConfig,
  staffId: string,
  excludeSigned = true
): Promise<{ data?: SignatureRequiredTrainingsResult; error?: string }> {
  try {
    const data = await requestAppsScript<SignatureRequiredTrainingsResult>(config, "getSignatureRequiredTrainings", {
      staffId,
      excludeSigned
    });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "전자서명 대상 교육을 불러오지 못했습니다."
    };
  }
}

export async function saveBulkSignature(
  config: AppConfig,
  staffId: string,
  trainingIds: string[],
  signatureImage: string,
  selectedDate?: string
): Promise<{ data?: BulkSignatureResult; error?: string }> {
  try {
    const data = await requestAppsScript<BulkSignatureResult>(config, "saveBulkSignature", {
      staffId,
      trainingIds,
      signatureImage,
      selectedDate
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

export async function getMyTrainingStatusByNameDept(
  config: AppConfig,
  name: string,
  department: string
): Promise<{ data?: MyTrainingStatusResult; error?: string }> {
  try {
    const data = await requestAppsScript<MyTrainingStatusResult>(config, "getMyTrainingStatusByNameDept", {
      name,
      department
    });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "내 이수현황을 불러오지 못했습니다."
    };
  }
}

export async function getCertificateRequiredTrainings(
  config: AppConfig,
  name: string,
  department: string
): Promise<{ data?: CertificateRequiredTrainingsResult; error?: string }> {
  try {
    const data = await requestAppsScript<CertificateRequiredTrainingsResult>(config, "getCertificateRequiredTrainings", {
      name,
      department
    });
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "이수증 제출 대상 교육을 불러오지 못했습니다."
    };
  }
}

export type CertificateSubmissionPayload = {
  trainingId: string;
  staffId: string;
  completedDate: string;
  issuer: string;
  certificateNumber: string;
  fileName: string;
  fileMimeType: string;
  fileBase64: string;
};

export async function saveCertificateSubmission(
  config: AppConfig,
  payload: CertificateSubmissionPayload
): Promise<{ data?: CertificateSubmissionResult; error?: string }> {
  try {
    const data = await requestAppsScript<CertificateSubmissionResult>(config, "saveCertificateSubmission", payload);
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "이수증을 제출하지 못했습니다."
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
    activeStatus: status,
    folderMode: training.folderMode ?? "",
    driveFolderId: training.driveFolderId ?? "",
    signatureFolderId: training.signatureFolderId ?? "",
    certificateFolderId: training.certificateFolderId ?? "",
    finalRosterFolderId: training.finalRosterFolderId ?? "",
    note: training.note ?? ""
  };
}
