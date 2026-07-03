/**
 * School Staff Training Center - Apps Script skeleton
 *
 * This file is the first scaffold for the shared school staff training center template.
 * It is intended to be bound to each school's Google Sheet.
 *
 * Privacy rule:
 * - Store staff lists, attendance records, and signature file links only in the school's Google Sheet/Drive.
 * - Do not store sensitive staff data on GitHub Pages or Vercel.
 * - Return only the minimum fields required by the UI.
 */

const SHEET_NAMES = {
  CONFIG: "00_학교설정",
  TRAININGS: "01_교육목록",
  STAFF: "02_교직원명단",
  TARGETS: "03_교육대상",
  ATTENDANCE: "04_QR출석기록",
  SIGNATURES: "05_전자서명기록",
  CERTIFICATES: "06_이수증제출",
  MY_STATUS: "07_내이수현황",
  FINAL_ROSTER: "08_최종서명부",
  CODE_VALUES: "99_코드값"
};

const CONFIG_KEYS = {
  SCHOOL_NAME: "학교명",
  CENTER_NAME: "교육센터명",
  SCHOOL_LOGO_URL: "학교로고URL",
  PRIMARY_COLOR: "메인컬러",
  SECONDARY_COLOR: "보조컬러",
  DEPARTMENT_NAME: "담당부서명",
  MANAGER_NAME: "담당자명",
  MANAGER_CONTACT: "담당자 연락처",
  SIGNATURE_FOLDER_ID: "전자서명 저장 폴더 ID",
  FINAL_ROSTER_FOLDER_ID: "최종 서명부 저장 폴더 ID",
  CERTIFICATE_FOLDER_ID: "이수증 저장 폴더 ID",
  PRIVACY_NOTICE: "개인정보 안내문"
};

const TRAINING_COLUMNS = {
  TRAINING_ID: "교육ID",
  TITLE: "교육명",
  DATE: "교육일자",
  TIME: "교육시간",
  LOCATION: "장소",
  DEPARTMENT: "담당부서",
  CATEGORY: "교육구분",
  QR_ENABLED: "QR사용여부",
  SIGNATURE_REQUIRED: "전자서명필요여부",
  CERTIFICATE_REQUIRED: "이수증제출필요여부",
  ACTIVE_STATUS: "활성상태",
  NOTE: "비고"
};

const STAFF_COLUMNS = {
  STAFF_ID: "교직원ID",
  NAME: "성명",
  DEPARTMENT: "부서",
  POSITION: "직위",
  AUTH_CODE: "인증코드",
  EMPLOYMENT_STATUS: "재직상태",
  NOTE: "비고"
};

const TARGET_COLUMNS = {
  TRAINING_ID: "교육ID",
  STAFF_ID: "교직원ID",
  IS_TARGET: "대상여부",
  SIGNATURE_EXCLUDED: "서명제외여부",
  REQUIRED: "필수여부",
  NOTE: "비고"
};

const ATTENDANCE_COLUMNS = {
  ATTENDANCE_ID: "출석ID",
  TRAINING_ID: "교육ID",
  TRAINING_TITLE: "교육명",
  STAFF_ID: "교직원ID",
  STAFF_NAME: "성명",
  DEPARTMENT: "부서",
  ATTENDED_AT: "출석일시",
  METHOD: "출석방법",
  DUPLICATE: "중복여부",
  PROCESS_STATUS: "처리상태",
  RECORDER: "기록자",
  NOTE: "비고"
};

const SIGNATURE_COLUMNS = {
  SIGNATURE_ID: "서명ID",
  TRAINING_ID: "교육ID",
  TRAINING_TITLE: "교육명",
  STAFF_ID: "교직원ID",
  STAFF_NAME: "성명",
  DEPARTMENT: "부서",
  SIGNED_AT: "서명일시",
  FILE_URL: "서명파일URL",
  FILE_ID: "서명파일ID",
  SAVE_STATUS: "저장상태",
  NOTE: "비고"
};

const CERTIFICATE_COLUMNS = {
  CERTIFICATE_ID: "제출ID",
  TRAINING_ID: "교육ID",
  STAFF_ID: "교직원ID",
  STAFF_NAME: "성명",
  SUBMITTED_AT: "제출일시",
  FILE_URL: "이수증파일URL",
  FILE_ID: "이수증파일ID",
  SUBMIT_STATUS: "제출상태",
  APPROVAL_STATUS: "승인상태",
  NOTE: "비고"
};

const FINAL_SHEET_COLUMNS = {
  SEQUENCE: "순번",
  TRAINING_ID: "교육ID",
  TRAINING_TITLE: "교육명",
  TRAINING_DATE: "교육일자",
  STAFF_NAME: "성명",
  DEPARTMENT: "부서",
  POSITION: "직위",
  ATTENDED_AT: "출석일시",
  SIGNATURE_STATUS: "서명여부",
  SIGNATURE_FILE_URL: "서명파일URL",
  COMPLETION_STATUS: "이수상태",
  NOTE: "비고"
};

const ACTIONS = {
  GET_SCHOOL_CONFIG: "getSchoolConfig",
  GET_TRAINING_LIST: "getTrainingList",
  GET_TRAINING_DETAIL: "getTrainingDetail",
  GET_STAFF_DETAIL: "getStaffDetail",
  VERIFY_STAFF: "verifyStaff",
  CHECK_TRAINING_TARGET: "checkTrainingTarget",
  CHECK_DUPLICATE_ATTENDANCE: "checkDuplicateAttendance",
  SAVE_QR_ATTENDANCE: "saveQrAttendance",
  SAVE_SIGNATURE: "saveSignature",
  CHECK_SIGNATURE_EXISTS: "checkSignatureExists",
  GET_MY_TRAINING_STATUS: "getMyTrainingStatus",
  GET_TRAINING_ATTENDANCE_STATUS: "getTrainingAttendanceStatus",
  GET_FINAL_ATTENDANCE_PREVIEW: "getFinalAttendancePreview",
  GENERATE_FINAL_ATTENDANCE_SHEET: "generateFinalAttendanceSheet",
  VALIDATE_SETUP: "validateSetup",
  GET_ADMIN_DASHBOARD_DATA: "getAdminDashboardData"
};

/**
 * GET health check.
 *
 * Input: optional query parameter action
 * Output: JSON response with service status or requested read-only data.
 * TODO: Limit GET to health/config only if deployment policy requires stricter behavior.
 */
function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";

  if (action === ACTIONS.GET_SCHOOL_CONFIG) {
    return getSchoolConfig();
  }

  if (action === ACTIONS.GET_TRAINING_LIST) {
    return getTrainingList(e.parameter);
  }

  if (action === ACTIONS.GET_TRAINING_DETAIL) {
    return getTrainingDetail(e.parameter);
  }

  if (action === ACTIONS.GET_STAFF_DETAIL) {
    return getStaffDetail(e.parameter);
  }

  if (action === ACTIONS.CHECK_SIGNATURE_EXISTS) {
    return checkSignatureExists(e.parameter);
  }

  if (action === ACTIONS.GET_TRAINING_ATTENDANCE_STATUS) {
    return getTrainingAttendanceStatus(e.parameter);
  }

  if (action === ACTIONS.GET_FINAL_ATTENDANCE_PREVIEW) {
    return getFinalAttendancePreview(e.parameter);
  }

  if (action === ACTIONS.VALIDATE_SETUP) {
    return validateSetup();
  }

  return jsonResponse({
    ok: true,
    service: "School Staff Training Center Apps Script",
    message: "Apps Script endpoint is ready."
  });
}

/**
 * POST action dispatcher.
 *
 * Input: JSON body with { action: string, ...payload }
 * Output: JSON response from the selected action.
 * TODO: Add deployment-specific origin checks if needed.
 */
function doPost(e) {
  try {
    const payload = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = payload.action;

    switch (action) {
      case ACTIONS.GET_SCHOOL_CONFIG:
        return getSchoolConfig();
      case ACTIONS.GET_TRAINING_LIST:
        return getTrainingList(payload);
      case ACTIONS.GET_TRAINING_DETAIL:
        return getTrainingDetail(payload);
      case ACTIONS.GET_STAFF_DETAIL:
        return getStaffDetail(payload);
      case ACTIONS.VERIFY_STAFF:
        return verifyStaff(payload);
      case ACTIONS.CHECK_TRAINING_TARGET:
        return checkTrainingTarget(payload);
      case ACTIONS.CHECK_DUPLICATE_ATTENDANCE:
        return checkDuplicateAttendance(payload);
      case ACTIONS.SAVE_QR_ATTENDANCE:
        return saveQrAttendance(payload);
      case ACTIONS.SAVE_SIGNATURE:
        return saveSignature(payload);
      case ACTIONS.CHECK_SIGNATURE_EXISTS:
        return checkSignatureExists(payload);
      case ACTIONS.GET_MY_TRAINING_STATUS:
        return getMyTrainingStatus(payload);
      case ACTIONS.GET_TRAINING_ATTENDANCE_STATUS:
        return getTrainingAttendanceStatus(payload);
      case ACTIONS.GET_FINAL_ATTENDANCE_PREVIEW:
        return getFinalAttendancePreview(payload);
      case ACTIONS.GENERATE_FINAL_ATTENDANCE_SHEET:
        return generateFinalAttendanceSheet(payload);
      case ACTIONS.VALIDATE_SETUP:
        return validateSetup();
      case ACTIONS.GET_ADMIN_DASHBOARD_DATA:
        return getAdminDashboardData();
      default:
        return errorResponse("지원하지 않는 action입니다.", "UNKNOWN_ACTION");
    }
  } catch (error) {
    return errorResponse("요청을 처리하지 못했습니다.", "REQUEST_FAILED", {
      detail: error && error.message ? error.message : String(error)
    });
  }
}

/**
 * Read school configuration from 00_학교설정.
 *
 * Input: none
 * Output: minimum school display settings for the UI.
 * TODO: Decide whether manager contact should be returned to all users or admin only.
 */
function getSchoolConfig() {
  const rows = readRows(SHEET_NAMES.CONFIG);
  const config = {};

  rows.forEach(function (row) {
    const key = row["설정키"] || row["항목"] || row["key"];
    const value = row["설정값"] || row["값"] || row["value"] || "";
    if (key) {
      config[key] = value;
    }
  });

  return jsonResponse({
    schoolName: config[CONFIG_KEYS.SCHOOL_NAME] || "",
    centerName: config[CONFIG_KEYS.CENTER_NAME] || "학교 교직원 교육센터",
    schoolLogoUrl: config[CONFIG_KEYS.SCHOOL_LOGO_URL] || "",
    primaryColor: config[CONFIG_KEYS.PRIMARY_COLOR] || "#1F2A44",
    secondaryColor: config[CONFIG_KEYS.SECONDARY_COLOR] || "#EEF4FF",
    departmentName: config[CONFIG_KEYS.DEPARTMENT_NAME] || "",
    managerName: config[CONFIG_KEYS.MANAGER_NAME] || "",
    managerContact: config[CONFIG_KEYS.MANAGER_CONTACT] || "",
    privacyNotice: config[CONFIG_KEYS.PRIVACY_NOTICE] || ""
  });
}

/**
 * Validate installation prerequisites without exposing staff data.
 *
 * Input: none
 * Output: folder config status, required sheet status, and active training count.
 */
function validateSetup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfigMap_();
  const requiredSheets = [
    { key: "schoolConfig", label: "학교설정", name: SHEET_NAMES.CONFIG },
    { key: "trainings", label: "교육목록", name: SHEET_NAMES.TRAININGS },
    { key: "staff", label: "교직원명단", name: SHEET_NAMES.STAFF },
    { key: "targets", label: "교육대상", name: SHEET_NAMES.TARGETS },
    { key: "attendance", label: "QR출석기록", name: SHEET_NAMES.ATTENDANCE },
    { key: "signatures", label: "전자서명기록", name: SHEET_NAMES.SIGNATURES },
    { key: "finalRoster", label: "최종서명부", name: SHEET_NAMES.FINAL_ROSTER }
  ];
  const sheets = requiredSheets.map(function (sheet) {
    return {
      key: sheet.key,
      label: sheet.label,
      name: sheet.name,
      exists: Boolean(spreadsheet.getSheetByName(sheet.name))
    };
  });
  const folders = [
    {
      key: "signatureFolderId",
      label: "전자서명 저장 폴더",
      value: getConfigValue_(config, ["signatureFolderId", CONFIG_KEYS.SIGNATURE_FOLDER_ID, "전자서명저장폴더ID"])
    },
    {
      key: "finalRosterFolderId",
      label: "최종 서명부 저장 폴더",
      value: getConfigValue_(config, ["finalRosterFolderId", CONFIG_KEYS.FINAL_ROSTER_FOLDER_ID, "최종서명부저장폴더ID"])
    },
    {
      key: "certificateFolderId",
      label: "이수증 저장 폴더",
      value: getConfigValue_(config, ["certificateFolderId", CONFIG_KEYS.CERTIFICATE_FOLDER_ID, "이수증저장폴더ID"])
    }
  ].map(function (folder) {
    return {
      key: folder.key,
      label: folder.label,
      configured: Boolean(String(folder.value || "").trim())
    };
  });
  const trainings = sheets.some(function (sheet) {
    return sheet.name === SHEET_NAMES.TRAININGS && sheet.exists;
  }) ? readRows(SHEET_NAMES.TRAININGS) : [];
  const activeTrainingCount = trainings.filter(function (row) {
    return isActiveTrainingStatus(row[TRAINING_COLUMNS.ACTIVE_STATUS]);
  }).length;

  return jsonResponse({
    schoolConfig: {
      schoolName: config[CONFIG_KEYS.SCHOOL_NAME] || "",
      centerName: config[CONFIG_KEYS.CENTER_NAME] || "학교 교직원 교육센터"
    },
    folders: folders,
    sheets: sheets,
    training: {
      totalCount: trainings.length,
      activeCount: activeTrainingCount
    },
    ok: folders.every(function (folder) { return folder.configured; }) &&
      sheets.every(function (sheet) { return sheet.exists; }) &&
      activeTrainingCount > 0
  });
}

/**
 * Read training list from 01_교육목록.
 *
 * Input: { includeInactive?: boolean }
 * Output: list of training rows with minimum display fields.
 * TODO: Normalize TRUE/FALSE and active status values after real sheet samples are confirmed.
 */
function getTrainingList(payload) {
  const includeInactive = payload && isTruthy(payload.includeInactive);
  const rows = readRows(SHEET_NAMES.TRAININGS);
  const trainings = rows
    .filter(function (row) {
      return includeInactive || isActiveTrainingStatus(row[TRAINING_COLUMNS.ACTIVE_STATUS]);
    })
    .map(function (row) {
      return normalizeTrainingRow_(row);
    });

  return jsonResponse(trainings);
}

/**
 * Read one training from 01_교육목록.
 *
 * Input: { trainingId: string }
 * Output: normalized training object.
 */
function getTrainingDetail(payload) {
  const trainingId = payload && payload.trainingId ? String(payload.trainingId).trim() : "";

  if (!trainingId) {
    return errorResponse("교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  }

  const training = findByColumn(SHEET_NAMES.TRAININGS, TRAINING_COLUMNS.TRAINING_ID, trainingId);

  if (!training) {
    return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  }

  return jsonResponse(normalizeTrainingRow_(training));
}

/**
 * Verify staff identity from 02_교직원명단.
 *
 * Input: { staffQuery: string, authCode: string }
 * Output: { staffId, name, department, position }
 * TODO: Add lockout/rate-limit strategy outside this skeleton if needed.
 */
function verifyStaff(payload) {
  const staffQuery = payload && payload.staffQuery ? String(payload.staffQuery).trim() : "";
  const authCode = payload && payload.authCode ? String(payload.authCode).trim() : "";

  if (!staffQuery || !authCode) {
    return errorResponse("교직원 확인 정보가 필요합니다.", "MISSING_STAFF_AUTH");
  }

  const rows = readRows(SHEET_NAMES.STAFF);
  const staff = rows.find(function (row) {
    const staffId = String(row[STAFF_COLUMNS.STAFF_ID] || "").trim();
    const name = String(row[STAFF_COLUMNS.NAME] || "").trim();
    const code = String(row[STAFF_COLUMNS.AUTH_CODE] || "").trim();
    return (staffId === staffQuery || name === staffQuery) && code === authCode;
  });

  if (!staff || !isActiveStaff(staff)) {
    return errorResponse("교직원 정보를 확인할 수 없습니다.", "STAFF_NOT_FOUND");
  }

  return jsonResponse({
    staff: {
      staffId: staff[STAFF_COLUMNS.STAFF_ID] || "",
      name: staff[STAFF_COLUMNS.NAME] || "",
      department: staff[STAFF_COLUMNS.DEPARTMENT] || "",
      position: staff[STAFF_COLUMNS.POSITION] || ""
    }
  });
}

/**
 * Read one staff member from 02_교직원명단.
 *
 * Input: { staffId: string }
 * Output: { staffId, name, department, position }
 */
function getStaffDetail(payload) {
  const staffId = payload && payload.staffId ? String(payload.staffId).trim() : "";

  if (!staffId) {
    return errorResponse("교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  }

  const staff = findByColumn(SHEET_NAMES.STAFF, STAFF_COLUMNS.STAFF_ID, staffId);

  if (!staff || !isActiveStaff(staff)) {
    return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  }

  return jsonResponse(normalizeStaffRow_(staff));
}

/**
 * Check target status from 03_교육대상.
 *
 * Input: { trainingId: string, staffId: string }
 * Output: { isTarget, signatureExcluded, required }
 * TODO: Confirm whether blank target rows should default to false or throw a setup warning.
 */
function checkTrainingTarget(payload) {
  const trainingId = payload && payload.trainingId ? String(payload.trainingId).trim() : "";
  const staffId = payload && payload.staffId ? String(payload.staffId).trim() : "";

  if (!trainingId || !staffId) {
    return errorResponse("교육ID와 교직원ID가 필요합니다.", "MISSING_TARGET_KEYS");
  }

  const target = readRows(SHEET_NAMES.TARGETS).find(function (row) {
    return String(row[TARGET_COLUMNS.TRAINING_ID] || "").trim() === trainingId &&
      String(row[TARGET_COLUMNS.STAFF_ID] || "").trim() === staffId;
  });

  if (!target) {
    return jsonResponse({
      isTarget: false,
      signatureExcluded: false,
      required: false
    });
  }

  return jsonResponse({
    isTarget: isTruthy(target[TARGET_COLUMNS.IS_TARGET]),
    signatureExcluded: isTruthy(target[TARGET_COLUMNS.SIGNATURE_EXCLUDED]),
    required: isTruthy(target[TARGET_COLUMNS.REQUIRED])
  });
}

/**
 * Check duplicate QR attendance from 04_QR출석기록.
 *
 * Input: { trainingId: string, staffId: string }
 * Output: { duplicate, attendanceId, attendedAt, processStatus }
 */
function checkDuplicateAttendance(payload) {
  const trainingId = payload && payload.trainingId ? String(payload.trainingId).trim() : "";
  const staffId = payload && payload.staffId ? String(payload.staffId).trim() : "";

  if (!trainingId || !staffId) {
    return errorResponse("교육ID와 교직원ID가 필요합니다.", "MISSING_DUPLICATE_KEYS");
  }

  const existing = findAttendance_(trainingId, staffId);

  if (!existing) {
    return jsonResponse({
      duplicate: false,
      attendanceId: "",
      attendedAt: "",
      processStatus: ""
    });
  }

  return jsonResponse({
    duplicate: true,
    attendanceId: existing[ATTENDANCE_COLUMNS.ATTENDANCE_ID] || "",
    attendedAt: serializeDateTime_(existing[ATTENDANCE_COLUMNS.ATTENDED_AT]),
    processStatus: existing[ATTENDANCE_COLUMNS.PROCESS_STATUS] || "완료"
  });
}

/**
 * Save QR attendance to 04_QR출석기록.
 *
 * Input: { trainingId: string, staffId: string, method?: string }
 * Output: { attendanceId, trainingId, attendedAt, status }
 * TODO: Connect with saveSignature() when signature flow is finalized.
 */
function saveQrAttendance(payload) {
  const trainingId = payload && payload.trainingId ? String(payload.trainingId).trim() : "";
  const staffId = payload && payload.staffId ? String(payload.staffId).trim() : "";

  if (!trainingId || !staffId) {
    return errorResponse("교육ID와 교직원ID가 필요합니다.", "MISSING_ATTENDANCE_KEYS");
  }

  const training = findByColumn(SHEET_NAMES.TRAININGS, TRAINING_COLUMNS.TRAINING_ID, trainingId);
  if (!training) {
    return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  }

  const normalizedTraining = normalizeTrainingRow_(training);
  if (!isActiveTrainingStatus(normalizedTraining.status)) {
    return errorResponse("활성 교육만 QR 출석할 수 있습니다.", "INACTIVE_TRAINING");
  }

  if (!normalizedTraining.qrEnabled) {
    return errorResponse("QR 출석을 사용하지 않는 교육입니다.", "QR_DISABLED");
  }

  const targetResult = extractJsonData(checkTrainingTarget({ trainingId: trainingId, staffId: staffId }));
  if (!targetResult.isTarget) {
    return errorResponse("교육 대상자가 아닙니다.", "NOT_TRAINING_TARGET");
  }

  const existing = findAttendance_(trainingId, staffId);

  if (existing) {
    return jsonResponse({
      attendanceId: existing[ATTENDANCE_COLUMNS.ATTENDANCE_ID] || "",
      trainingId: trainingId,
      attendedAt: serializeDateTime_(existing[ATTENDANCE_COLUMNS.ATTENDED_AT]),
      duplicate: true,
      processStatus: existing[ATTENDANCE_COLUMNS.PROCESS_STATUS] || "중복",
      status: "already"
    });
  }

  const staff = findByColumn(SHEET_NAMES.STAFF, STAFF_COLUMNS.STAFF_ID, staffId);
  const attendanceId = createId_("ATT");
  const attendedAt = new Date();
  const signatureRequired = normalizedTraining.signatureRequired && !targetResult.signatureExcluded;

  appendRow(SHEET_NAMES.ATTENDANCE, {
    [ATTENDANCE_COLUMNS.ATTENDANCE_ID]: attendanceId,
    [ATTENDANCE_COLUMNS.TRAINING_ID]: trainingId,
    [ATTENDANCE_COLUMNS.TRAINING_TITLE]: normalizedTraining.title,
    [ATTENDANCE_COLUMNS.STAFF_ID]: staffId,
    [ATTENDANCE_COLUMNS.STAFF_NAME]: staff ? staff[STAFF_COLUMNS.NAME] : "",
    [ATTENDANCE_COLUMNS.DEPARTMENT]: staff ? staff[STAFF_COLUMNS.DEPARTMENT] : "",
    [ATTENDANCE_COLUMNS.ATTENDED_AT]: attendedAt,
    [ATTENDANCE_COLUMNS.METHOD]: payload && payload.method ? payload.method : "QR",
    [ATTENDANCE_COLUMNS.DUPLICATE]: "N",
    [ATTENDANCE_COLUMNS.PROCESS_STATUS]: "완료",
    [ATTENDANCE_COLUMNS.RECORDER]: "GitHub Pages",
    [ATTENDANCE_COLUMNS.NOTE]: signatureRequired ? "전자서명은 다음 단계에서 연결됩니다." : ""
  });

  return jsonResponse({
    attendanceId: attendanceId,
    trainingId: trainingId,
    trainingTitle: normalizedTraining.title,
    attendedAt: serializeDateTime_(attendedAt),
    duplicate: false,
    processStatus: "완료",
    signatureRequired: signatureRequired,
    status: "saved"
  });
}

/**
 * Check signature duplication from 05_전자서명기록.
 *
 * Input: { trainingId: string, staffId: string }
 * Output: { exists, signatureId, signedAt, fileUrl, saveStatus }
 */
function checkSignatureExists(payload) {
  const trainingId = payload && payload.trainingId ? String(payload.trainingId).trim() : "";
  const staffId = payload && payload.staffId ? String(payload.staffId).trim() : "";

  if (!trainingId || !staffId) {
    return errorResponse("교육ID와 교직원ID가 필요합니다.", "MISSING_SIGNATURE_KEYS");
  }

  const existing = findSignature_(trainingId, staffId);

  if (!existing) {
    return jsonResponse({
      exists: false,
      signatureId: "",
      signedAt: "",
      fileUrl: "",
      saveStatus: ""
    });
  }

  return jsonResponse({
    exists: true,
    signatureId: existing[SIGNATURE_COLUMNS.SIGNATURE_ID] || "",
    signedAt: serializeDateTime_(existing[SIGNATURE_COLUMNS.SIGNED_AT]),
    fileUrl: existing[SIGNATURE_COLUMNS.FILE_URL] || "",
    fileId: existing[SIGNATURE_COLUMNS.FILE_ID] || "",
    saveStatus: existing[SIGNATURE_COLUMNS.SAVE_STATUS] || "완료"
  });
}

/**
 * Save signature image to Google Drive and metadata to 05_전자서명기록.
 *
 * Input: { trainingId: string, staffId: string, signatureImageBase64: string }
 * Output: saved signature metadata.
 */
function saveSignature(payload) {
  const trainingId = payload && payload.trainingId ? String(payload.trainingId).trim() : "";
  const staffId = payload && payload.staffId ? String(payload.staffId).trim() : "";
  const signatureImageBase64 = payload && payload.signatureImageBase64 ? String(payload.signatureImageBase64) : "";

  if (!trainingId || !staffId) {
    return errorResponse("교육ID와 교직원ID가 필요합니다.", "MISSING_SIGNATURE_KEYS");
  }

  if (!signatureImageBase64) {
    return errorResponse("서명 이미지가 필요합니다.", "MISSING_SIGNATURE_IMAGE");
  }

  const training = findByColumn(SHEET_NAMES.TRAININGS, TRAINING_COLUMNS.TRAINING_ID, trainingId);
  if (!training) {
    return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  }

  const staff = findByColumn(SHEET_NAMES.STAFF, STAFF_COLUMNS.STAFF_ID, staffId);
  if (!staff || !isActiveStaff(staff)) {
    return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  }

  const existing = findSignature_(trainingId, staffId);
  if (existing) {
    return jsonResponse({
      status: "already",
      duplicate: true,
      signatureId: existing[SIGNATURE_COLUMNS.SIGNATURE_ID] || "",
      trainingId: trainingId,
      staffId: staffId,
      signedAt: serializeDateTime_(existing[SIGNATURE_COLUMNS.SIGNED_AT]),
      fileUrl: existing[SIGNATURE_COLUMNS.FILE_URL] || "",
      fileId: existing[SIGNATURE_COLUMNS.FILE_ID] || "",
      saveStatus: existing[SIGNATURE_COLUMNS.SAVE_STATUS] || "완료"
    });
  }

  const folderId = getSignatureFolderId_();
  if (!folderId) {
    return errorResponse("전자서명 저장 폴더가 설정되지 않았습니다.", "SIGNATURE_FOLDER_NOT_CONFIGURED");
  }

  const normalizedTraining = normalizeTrainingRow_(training);
  const normalizedStaff = normalizeStaffRow_(staff);
  const signedAt = new Date();
  const signatureId = createId_("SIG");
  const blob = signatureImageBlob_(signatureImageBase64, signatureId + ".png");
  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);
  const fileUrl = file.getUrl();
  const fileId = file.getId();

  appendRow(SHEET_NAMES.SIGNATURES, {
    [SIGNATURE_COLUMNS.SIGNATURE_ID]: signatureId,
    [SIGNATURE_COLUMNS.TRAINING_ID]: trainingId,
    [SIGNATURE_COLUMNS.TRAINING_TITLE]: normalizedTraining.title,
    [SIGNATURE_COLUMNS.STAFF_ID]: staffId,
    [SIGNATURE_COLUMNS.STAFF_NAME]: normalizedStaff.name,
    [SIGNATURE_COLUMNS.DEPARTMENT]: normalizedStaff.department,
    [SIGNATURE_COLUMNS.SIGNED_AT]: signedAt,
    [SIGNATURE_COLUMNS.FILE_URL]: fileUrl,
    [SIGNATURE_COLUMNS.FILE_ID]: fileId,
    [SIGNATURE_COLUMNS.SAVE_STATUS]: "완료",
    [SIGNATURE_COLUMNS.NOTE]: ""
  });

  return jsonResponse({
    status: "saved",
    duplicate: false,
    signatureId: signatureId,
    trainingId: trainingId,
    trainingTitle: normalizedTraining.title,
    staffId: staffId,
    staffName: normalizedStaff.name,
    department: normalizedStaff.department,
    signedAt: serializeDateTime_(signedAt),
    fileUrl: fileUrl,
    fileId: fileId,
    saveStatus: "완료"
  });
}

/**
 * Read current user's training status.
 *
 * Input: { staffId: string }
 * Output: staff-scoped target trainings with attendance/signature/certificate summary.
 */
function getMyTrainingStatus(payload) {
  const staffId = payload && payload.staffId ? String(payload.staffId).trim() : "";

  if (!staffId) {
    return errorResponse("교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  }

  const staff = findByColumn(SHEET_NAMES.STAFF, STAFF_COLUMNS.STAFF_ID, staffId);

  if (!staff || !isActiveStaff(staff)) {
    return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  }

  const targets = readRows(SHEET_NAMES.TARGETS).filter(function (row) {
    return String(row[TARGET_COLUMNS.STAFF_ID] || "").trim() === staffId &&
      isTruthy(row[TARGET_COLUMNS.IS_TARGET]);
  });
  const trainings = readRows(SHEET_NAMES.TRAININGS);
  const attendances = readRows(SHEET_NAMES.ATTENDANCE);
  const signatures = readRows(SHEET_NAMES.SIGNATURES);
  const certificates = readRowsOptional_(SHEET_NAMES.CERTIFICATES);

  const items = targets.map(function (target) {
    const trainingId = target[TARGET_COLUMNS.TRAINING_ID] || "";
    const training = findInRows_(trainings, TRAINING_COLUMNS.TRAINING_ID, trainingId);
    const normalizedTraining = training ? normalizeTrainingRow_(training) : {
      trainingId: trainingId,
      title: "",
      date: "",
      time: "",
      place: "",
      location: "",
      department: "",
      category: "",
      qrEnabled: true,
      signatureRequired: false,
      certificateRequired: false,
      status: "",
      activeStatus: ""
    };
    const attendance = attendances.find(function (row) {
      return String(row[ATTENDANCE_COLUMNS.TRAINING_ID] || "").trim() === String(trainingId || "").trim() &&
        String(row[ATTENDANCE_COLUMNS.STAFF_ID] || "").trim() === staffId;
    });
    const signature = signatures.find(function (row) {
      return String(row[SIGNATURE_COLUMNS.TRAINING_ID] || "").trim() === String(trainingId || "").trim() &&
        String(row[SIGNATURE_COLUMNS.STAFF_ID] || "").trim() === staffId;
    });
    const certificate = findCertificate_(certificates, trainingId, staffId);
    const signatureRequired = normalizedTraining.signatureRequired && !isTruthy(target[TARGET_COLUMNS.SIGNATURE_EXCLUDED]);
    const certificateRequired = Boolean(normalizedTraining.certificateRequired);
    const attendanceCompleted = Boolean(attendance);
    const signatureCompleted = signatureRequired ? Boolean(signature) : true;
    const certificateSubmitted = certificateRequired ? Boolean(certificate) : false;
    const certificateApproved = certificate ? isApprovedCertificate_(certificate) : false;
    const finalStatus = calculateTrainingStatus_({
      attendanceCompleted: attendanceCompleted,
      signatureRequired: signatureRequired,
      signatureCompleted: signatureCompleted,
      certificateRequired: certificateRequired,
      certificateSubmitted: certificateSubmitted,
      certificateApproved: certificateApproved
    });

    return {
      trainingId: trainingId,
      title: normalizedTraining.title,
      date: normalizedTraining.date,
      time: normalizedTraining.time,
      place: normalizedTraining.place || normalizedTraining.location,
      department: normalizedTraining.department,
      required: isTruthy(target[TARGET_COLUMNS.REQUIRED]),
      attendanceRequired: true,
      attendanceCompleted: attendanceCompleted,
      signatureRequired: signatureRequired,
      signatureCompleted: signatureRequired ? Boolean(signature) : false,
      certificateRequired: certificateRequired,
      certificateSubmitted: certificateSubmitted,
      certificateApproved: certificateApproved,
      finalStatus: finalStatus.label,
      statusGroup: finalStatus.group,
      attendedAt: attendance ? serializeDateTime_(attendance[ATTENDANCE_COLUMNS.ATTENDED_AT]) : "",
      signedAt: signature ? serializeDateTime_(signature[SIGNATURE_COLUMNS.SIGNED_AT]) : "",
      certificateSubmittedAt: certificate ? serializeDateTime_(certificate[CERTIFICATE_COLUMNS.SUBMITTED_AT] || certificate["제출일"] || certificate["등록일시"]) : ""
    };
  }).sort(function (a, b) {
    return statusPriority_(a.statusGroup) - statusPriority_(b.statusGroup) ||
      String(a.date || "").localeCompare(String(b.date || ""));
  });

  const summary = {
    total: items.length,
    completed: items.filter(function (item) {
      return item.statusGroup === "completed";
    }).length,
    incomplete: items.filter(function (item) {
      return item.statusGroup === "incomplete";
    }).length,
    review: items.filter(function (item) {
      return item.statusGroup === "review";
    }).length
  };

  return jsonResponse({
    staff: normalizeStaffRow_(staff),
    summary: summary,
    items: items
  });
}

/**
 * Read target attendance/signature status for one training.
 *
 * Input: { trainingId: string }
 * Output: target staff rows with attendance/signature/final status summary.
 */
function getTrainingAttendanceStatus(payload) {
  const trainingId = payload && payload.trainingId ? String(payload.trainingId).trim() : "";

  if (!trainingId) {
    return errorResponse("교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  }

  const training = findByColumn(SHEET_NAMES.TRAININGS, TRAINING_COLUMNS.TRAINING_ID, trainingId);

  if (!training) {
    return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  }

  const normalizedTraining = normalizeTrainingRow_(training);
  const targets = readRows(SHEET_NAMES.TARGETS).filter(function (row) {
    return String(row[TARGET_COLUMNS.TRAINING_ID] || "").trim() === trainingId &&
      isTruthy(row[TARGET_COLUMNS.IS_TARGET]);
  });
  const staffRows = readRows(SHEET_NAMES.STAFF);
  const attendances = readRows(SHEET_NAMES.ATTENDANCE);
  const signatures = readRows(SHEET_NAMES.SIGNATURES);

  const items = targets.map(function (target) {
    const staffId = String(target[TARGET_COLUMNS.STAFF_ID] || "").trim();
    const staff = findInRows_(staffRows, STAFF_COLUMNS.STAFF_ID, staffId);
    const attendance = attendances.find(function (row) {
      return String(row[ATTENDANCE_COLUMNS.TRAINING_ID] || "").trim() === trainingId &&
        String(row[ATTENDANCE_COLUMNS.STAFF_ID] || "").trim() === staffId;
    });
    const signature = signatures.find(function (row) {
      return String(row[SIGNATURE_COLUMNS.TRAINING_ID] || "").trim() === trainingId &&
        String(row[SIGNATURE_COLUMNS.STAFF_ID] || "").trim() === staffId;
    });
    const signatureRequired = normalizedTraining.signatureRequired && !isTruthy(target[TARGET_COLUMNS.SIGNATURE_EXCLUDED]);
    const attendanceCompleted = Boolean(attendance);
    const signatureCompleted = Boolean(signature);
    const finalStatus = calculateAttendanceAdminStatus_({
      attendanceCompleted: attendanceCompleted,
      signatureRequired: signatureRequired,
      signatureCompleted: signatureCompleted
    });

    return {
      trainingId: trainingId,
      staffId: staffId,
      name: staff ? staff[STAFF_COLUMNS.NAME] || "" : "",
      department: staff ? staff[STAFF_COLUMNS.DEPARTMENT] || "" : "",
      position: staff ? staff[STAFF_COLUMNS.POSITION] || "" : "",
      isTarget: true,
      required: isTruthy(target[TARGET_COLUMNS.REQUIRED]),
      attendanceCompleted: attendanceCompleted,
      attendedAt: attendance ? serializeDateTime_(attendance[ATTENDANCE_COLUMNS.ATTENDED_AT]) : "",
      signatureRequired: signatureRequired,
      signatureCompleted: signatureCompleted,
      signedAt: signature ? serializeDateTime_(signature[SIGNATURE_COLUMNS.SIGNED_AT]) : "",
      finalStatus: finalStatus.label,
      statusGroup: finalStatus.group
    };
  }).sort(function (a, b) {
    return adminStatusPriority_(a.statusGroup) - adminStatusPriority_(b.statusGroup) ||
      String(a.department || "").localeCompare(String(b.department || "")) ||
      String(a.name || "").localeCompare(String(b.name || ""));
  });

  const summary = {
    targetCount: items.length,
    attendanceCompleted: items.filter(function (item) {
      return item.attendanceCompleted;
    }).length,
    signatureCompleted: items.filter(function (item) {
      return item.signatureCompleted;
    }).length,
    incomplete: items.filter(function (item) {
      return item.statusGroup !== "completed";
    }).length
  };

  return jsonResponse({
    training: normalizedTraining,
    summary: summary,
    items: items
  });
}

/**
 * Preview final attendance roster rows.
 *
 * Input: { trainingId: string }
 * Output: final attendance rows and summary without writing to 08_최종서명부.
 */
function getFinalAttendancePreview(payload) {
  const trainingId = payload && payload.trainingId ? String(payload.trainingId).trim() : "";

  if (!trainingId) {
    return errorResponse("교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  }

  return jsonResponse(buildFinalAttendanceRoster_(trainingId));
}

/**
 * Generate final attendance roster rows and record them to 08_최종서명부.
 *
 * Input: { trainingId: string }
 * Output: final attendance rows and write count. CSV download is handled by GitHub Pages UI.
 */
function generateFinalAttendanceSheet(payload) {
  const trainingId = payload && payload.trainingId ? String(payload.trainingId).trim() : "";

  if (!trainingId) {
    return errorResponse("교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  }

  const roster = buildFinalAttendanceRoster_(trainingId);
  const generatedAt = new Date();

  roster.rows.forEach(function (row) {
    appendRow(SHEET_NAMES.FINAL_ROSTER, {
      [FINAL_SHEET_COLUMNS.SEQUENCE]: row.sequence,
      [FINAL_SHEET_COLUMNS.TRAINING_ID]: row.trainingId,
      [FINAL_SHEET_COLUMNS.TRAINING_TITLE]: row.trainingTitle,
      [FINAL_SHEET_COLUMNS.TRAINING_DATE]: row.trainingDate,
      [FINAL_SHEET_COLUMNS.STAFF_NAME]: row.name,
      [FINAL_SHEET_COLUMNS.DEPARTMENT]: row.department,
      [FINAL_SHEET_COLUMNS.POSITION]: row.position,
      [FINAL_SHEET_COLUMNS.ATTENDED_AT]: row.attendedAt,
      [FINAL_SHEET_COLUMNS.SIGNATURE_STATUS]: row.signatureStatus,
      [FINAL_SHEET_COLUMNS.SIGNATURE_FILE_URL]: row.signatureFileUrl,
      [FINAL_SHEET_COLUMNS.COMPLETION_STATUS]: row.completionStatus,
      [FINAL_SHEET_COLUMNS.NOTE]: row.note || "생성일시 " + serializeDateTime_(generatedAt)
    });
  });

  return jsonResponse({
    status: "generated",
    generatedAt: serializeDateTime_(generatedAt),
    writtenCount: roster.rows.length,
    training: roster.training,
    summary: roster.summary,
    rows: roster.rows
  });
}

/**
 * Read admin dashboard summary.
 *
 * Input: none
 * Output: training summary counts and final roster status.
 * TODO: Add admin authorization before exposing this through production deployment.
 */
function getAdminDashboardData() {
  const trainings = readRows(SHEET_NAMES.TRAININGS);
  const targets = readRows(SHEET_NAMES.TARGETS);
  const attendances = readRows(SHEET_NAMES.ATTENDANCE);
  const signatures = readRows(SHEET_NAMES.SIGNATURES);
  const finalRosters = readRows(SHEET_NAMES.FINAL_ROSTER);

  const summary = trainings.map(function (training) {
    const trainingId = training[TRAINING_COLUMNS.TRAINING_ID] || "";
    return {
      trainingId: trainingId,
      title: training[TRAINING_COLUMNS.TITLE] || "",
      targetCount: countRows_(targets, TARGET_COLUMNS.TRAINING_ID, trainingId),
      attendanceCount: countRows_(attendances, ATTENDANCE_COLUMNS.TRAINING_ID, trainingId),
      signatureCount: countRows_(signatures, SIGNATURE_COLUMNS.TRAINING_ID, trainingId),
      finalRosterCreated: Boolean(findInRows_(finalRosters, "교육ID", trainingId))
    };
  });

  return jsonResponse({ trainings: summary });
}

/**
 * Return JSON response.
 *
 * Input: any serializable data
 * Output: ContentService JSON response
 */
function jsonResponse(data) {
  const payload = Object.prototype.hasOwnProperty.call(data || {}, "ok")
    ? data
    : { ok: true, data: data };

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Return error response.
 *
 * Input: message, code, optional extra data
 * Output: ContentService JSON error response
 */
function errorResponse(message, code, extra) {
  return jsonResponse({
    ok: false,
    error: code || "ERROR",
    message: message || "요청을 처리하지 못했습니다.",
    data: extra || null
  });
}

/**
 * Get a sheet by name from the bound spreadsheet.
 *
 * Input: sheet name
 * Output: Google Apps Script Sheet object
 */
function getSheetByName(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error("Sheet not found: " + name);
  }
  return sheet;
}

/**
 * Read rows from a sheet as objects keyed by header names.
 *
 * Input: sheet name
 * Output: object array
 */
function readRows(sheetName) {
  const sheet = getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headerRowIndex = findHeaderRowIndex_(values, getRequiredHeadersForSheet_(sheetName));
  const headers = values[headerRowIndex];

  return values.slice(headerRowIndex + 1)
    .filter(function (row) {
      return row.some(function (cell) {
        return cell !== "";
      });
    })
    .map(function (row) {
      const item = {};
      headers.forEach(function (header, index) {
        if (header) {
          item[String(header)] = row[index];
        }
      });
      return item;
    });
}

/**
 * Append an object row to a sheet according to the header row.
 *
 * Input: sheet name, row object
 * Output: appended row number
 */
function appendRow(sheetName, row) {
  const sheet = getSheetByName(sheetName);
  const sheetValues = sheet.getDataRange().getValues();
  const headerRowIndex = findHeaderRowIndex_(sheetValues, getRequiredHeadersForSheet_(sheetName));
  const headers = sheetValues[headerRowIndex] || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = headers.map(function (header) {
    return row[String(header)] !== undefined ? row[String(header)] : "";
  });

  sheet.appendRow(rowValues);
  return sheet.getLastRow();
}

/**
 * Find the first row where columnName equals value.
 *
 * Input: sheet name, column name, value
 * Output: row object or null
 */
function findByColumn(sheetName, columnName, value) {
  const rows = readRows(sheetName);
  return findInRows_(rows, columnName, value);
}

/**
 * Build a header-to-index map from a Sheet.
 *
 * Input: Sheet object
 * Output: { [headerName]: zeroBasedIndex }
 */
function getHeaderMap(sheet) {
  const values = sheet.getDataRange().getValues();
  const headerRowIndex = findHeaderRowIndex_(values, []);
  const headers = values[headerRowIndex] || [];
  const map = {};

  headers.forEach(function (header, index) {
    if (header) {
      map[String(header)] = index;
    }
  });

  return map;
}

function getRequiredHeadersForSheet_(sheetName) {
  if (sheetName === SHEET_NAMES.CONFIG) {
    return [
      "설정키",
      "설정값"
    ];
  }

  if (sheetName === SHEET_NAMES.TRAININGS) {
    return [
      TRAINING_COLUMNS.TRAINING_ID,
      TRAINING_COLUMNS.TITLE,
      TRAINING_COLUMNS.ACTIVE_STATUS
    ];
  }

  if (sheetName === SHEET_NAMES.STAFF) {
    return [
      STAFF_COLUMNS.STAFF_ID,
      STAFF_COLUMNS.NAME,
      STAFF_COLUMNS.AUTH_CODE
    ];
  }

  if (sheetName === SHEET_NAMES.TARGETS) {
    return [
      TARGET_COLUMNS.TRAINING_ID,
      TARGET_COLUMNS.STAFF_ID,
      TARGET_COLUMNS.IS_TARGET
    ];
  }

  if (sheetName === SHEET_NAMES.ATTENDANCE) {
    return [
      ATTENDANCE_COLUMNS.ATTENDANCE_ID,
      ATTENDANCE_COLUMNS.TRAINING_ID,
      ATTENDANCE_COLUMNS.STAFF_ID
    ];
  }

  if (sheetName === SHEET_NAMES.SIGNATURES) {
    return [
      SIGNATURE_COLUMNS.SIGNATURE_ID,
      SIGNATURE_COLUMNS.TRAINING_ID,
      SIGNATURE_COLUMNS.STAFF_ID
    ];
  }

  if (sheetName === SHEET_NAMES.CERTIFICATES) {
    return [
      CERTIFICATE_COLUMNS.TRAINING_ID,
      CERTIFICATE_COLUMNS.STAFF_ID
    ];
  }

  if (sheetName === SHEET_NAMES.FINAL_ROSTER) {
    return [
      FINAL_SHEET_COLUMNS.SEQUENCE,
      FINAL_SHEET_COLUMNS.TRAINING_ID,
      FINAL_SHEET_COLUMNS.STAFF_NAME
    ];
  }

  return [];
}

function findHeaderRowIndex_(values, requiredHeaders) {
  const required = requiredHeaders || [];
  const maxScanRows = Math.min(values.length, 20);

  if (!required.length) {
    return 0;
  }

  for (let rowIndex = 0; rowIndex < maxScanRows; rowIndex += 1) {
    const normalizedHeaders = values[rowIndex].map(function (cell) {
      return String(cell || "").trim();
    });
    const hasRequiredHeaders = required.every(function (header) {
      return normalizedHeaders.indexOf(header) !== -1;
    });

    if (hasRequiredHeaders) {
      return rowIndex;
    }
  }

  return 0;
}

function isTruthy(value) {
  if (value === true) {
    return true;
  }
  const normalized = String(value || "").trim().toLowerCase();
  return ["true", "y", "yes", "1", "사용", "활성", "대상", "필수", "재직"].indexOf(normalized) !== -1;
}

function isActiveTrainingStatus(value) {
  return String(value || "").trim() === "활성";
}

function normalizeTrainingRow_(row) {
  const place = row[TRAINING_COLUMNS.LOCATION] || "";
  const status = String(row[TRAINING_COLUMNS.ACTIVE_STATUS] || "").trim();

  return {
    trainingId: row[TRAINING_COLUMNS.TRAINING_ID] || "",
    title: row[TRAINING_COLUMNS.TITLE] || "",
    date: serializeDate_(row[TRAINING_COLUMNS.DATE]),
    time: serializeTime_(row[TRAINING_COLUMNS.TIME]),
    place: place,
    location: place,
    department: row[TRAINING_COLUMNS.DEPARTMENT] || "",
    category: row[TRAINING_COLUMNS.CATEGORY] || "",
    qrEnabled: isTruthy(row[TRAINING_COLUMNS.QR_ENABLED]),
    signatureRequired: isTruthy(row[TRAINING_COLUMNS.SIGNATURE_REQUIRED]),
    certificateRequired: isTruthy(row[TRAINING_COLUMNS.CERTIFICATE_REQUIRED]),
    status: status,
    activeStatus: status
  };
}

function normalizeStaffRow_(row) {
  return {
    staffId: row[STAFF_COLUMNS.STAFF_ID] || "",
    name: row[STAFF_COLUMNS.NAME] || "",
    department: row[STAFF_COLUMNS.DEPARTMENT] || "",
    position: row[STAFF_COLUMNS.POSITION] || ""
  };
}

function findAttendance_(trainingId, staffId) {
  return readRows(SHEET_NAMES.ATTENDANCE).find(function (row) {
    return String(row[ATTENDANCE_COLUMNS.TRAINING_ID] || "").trim() === String(trainingId || "").trim() &&
      String(row[ATTENDANCE_COLUMNS.STAFF_ID] || "").trim() === String(staffId || "").trim();
  }) || null;
}

function findSignature_(trainingId, staffId) {
  return readRows(SHEET_NAMES.SIGNATURES).find(function (row) {
    return String(row[SIGNATURE_COLUMNS.TRAINING_ID] || "").trim() === String(trainingId || "").trim() &&
      String(row[SIGNATURE_COLUMNS.STAFF_ID] || "").trim() === String(staffId || "").trim();
  }) || null;
}

function findCertificate_(certificates, trainingId, staffId) {
  return certificates.find(function (row) {
    return String(row[CERTIFICATE_COLUMNS.TRAINING_ID] || row["교육ID"] || "").trim() === String(trainingId || "").trim() &&
      String(row[CERTIFICATE_COLUMNS.STAFF_ID] || row["교직원ID"] || "").trim() === String(staffId || "").trim();
  }) || null;
}

function isApprovedCertificate_(certificate) {
  const status = String(
    certificate[CERTIFICATE_COLUMNS.APPROVAL_STATUS] ||
      certificate[CERTIFICATE_COLUMNS.SUBMIT_STATUS] ||
      certificate["처리상태"] ||
      certificate["상태"] ||
      ""
  ).trim();

  return ["승인", "승인완료", "확인완료", "완료"].indexOf(status) !== -1;
}

function calculateTrainingStatus_(state) {
  if (!state.attendanceCompleted) {
    return { label: "미이수", group: "incomplete" };
  }

  if (state.signatureRequired && !state.signatureCompleted) {
    return { label: "미이수", group: "incomplete" };
  }

  if (state.certificateRequired) {
    if (state.certificateApproved) {
      return { label: "이수완료", group: "completed" };
    }

    if (state.certificateSubmitted) {
      return { label: "확인필요", group: "review" };
    }

    return { label: "미이수", group: "incomplete" };
  }

  return { label: "이수완료", group: "completed" };
}

function statusPriority_(statusGroup) {
  if (statusGroup === "incomplete") {
    return 0;
  }

  if (statusGroup === "review") {
    return 1;
  }

  return 2;
}

function calculateAttendanceAdminStatus_(state) {
  if (!state.attendanceCompleted) {
    return { label: "미출석", group: "absent" };
  }

  if (state.signatureRequired && !state.signatureCompleted) {
    return { label: "서명 필요", group: "signature" };
  }

  return { label: "완료", group: "completed" };
}

function calculateFinalCompletionStatus_(state) {
  if (!state.attendanceCompleted) {
    return "미이수";
  }

  if (state.signatureRequired && !state.signatureCompleted) {
    return "서명필요";
  }

  return "이수완료";
}

function buildFinalAttendanceRoster_(trainingId) {
  const training = findByColumn(SHEET_NAMES.TRAININGS, TRAINING_COLUMNS.TRAINING_ID, trainingId);

  if (!training) {
    throw new Error("교육 정보를 찾을 수 없습니다.");
  }

  const normalizedTraining = normalizeTrainingRow_(training);
  const targets = readRows(SHEET_NAMES.TARGETS).filter(function (row) {
    return String(row[TARGET_COLUMNS.TRAINING_ID] || "").trim() === String(trainingId || "").trim() &&
      isTruthy(row[TARGET_COLUMNS.IS_TARGET]);
  });
  const staffRows = readRows(SHEET_NAMES.STAFF);
  const attendances = readRows(SHEET_NAMES.ATTENDANCE);
  const signatures = readRows(SHEET_NAMES.SIGNATURES);

  const rows = targets.map(function (target, index) {
    const staffId = String(target[TARGET_COLUMNS.STAFF_ID] || "").trim();
    const staff = findInRows_(staffRows, STAFF_COLUMNS.STAFF_ID, staffId);
    const attendance = attendances.find(function (row) {
      return String(row[ATTENDANCE_COLUMNS.TRAINING_ID] || "").trim() === String(trainingId || "").trim() &&
        String(row[ATTENDANCE_COLUMNS.STAFF_ID] || "").trim() === staffId;
    });
    const signature = signatures.find(function (row) {
      return String(row[SIGNATURE_COLUMNS.TRAINING_ID] || "").trim() === String(trainingId || "").trim() &&
        String(row[SIGNATURE_COLUMNS.STAFF_ID] || "").trim() === staffId;
    });
    const signatureRequired = normalizedTraining.signatureRequired && !isTruthy(target[TARGET_COLUMNS.SIGNATURE_EXCLUDED]);
    const attendanceCompleted = Boolean(attendance);
    const signatureCompleted = Boolean(signature);
    const completionStatus = calculateFinalCompletionStatus_({
      attendanceCompleted: attendanceCompleted,
      signatureRequired: signatureRequired,
      signatureCompleted: signatureCompleted
    });

    return {
      sequence: index + 1,
      trainingId: trainingId,
      trainingTitle: normalizedTraining.title,
      trainingDate: normalizedTraining.date,
      staffId: staffId,
      name: staff ? staff[STAFF_COLUMNS.NAME] || "" : "",
      department: staff ? staff[STAFF_COLUMNS.DEPARTMENT] || "" : "",
      position: staff ? staff[STAFF_COLUMNS.POSITION] || "" : "",
      attendedAt: attendance ? serializeDateTime_(attendance[ATTENDANCE_COLUMNS.ATTENDED_AT]) : "",
      signatureStatus: signatureRequired ? (signatureCompleted ? "완료" : "필요") : "불필요",
      signatureFileUrl: signature ? signature[SIGNATURE_COLUMNS.FILE_URL] || "" : "",
      completionStatus: completionStatus,
      note: ""
    };
  }).sort(function (a, b) {
    return finalStatusPriority_(a.completionStatus) - finalStatusPriority_(b.completionStatus) ||
      String(a.department || "").localeCompare(String(b.department || "")) ||
      String(a.name || "").localeCompare(String(b.name || ""));
  }).map(function (row, index) {
    row.sequence = index + 1;
    return row;
  });

  const summary = {
    targetCount: rows.length,
    completed: rows.filter(function (row) {
      return row.completionStatus === "이수완료";
    }).length,
    signatureRequired: rows.filter(function (row) {
      return row.completionStatus === "서명필요";
    }).length,
    incomplete: rows.filter(function (row) {
      return row.completionStatus === "미이수";
    }).length
  };

  return {
    training: normalizedTraining,
    summary: summary,
    rows: rows
  };
}

function finalStatusPriority_(status) {
  if (status === "미이수") {
    return 0;
  }

  if (status === "서명필요") {
    return 1;
  }

  return 2;
}

function adminStatusPriority_(statusGroup) {
  if (statusGroup === "absent") {
    return 0;
  }

  if (statusGroup === "signature") {
    return 1;
  }

  return 2;
}

function readRowsOptional_(sheetName) {
  try {
    return readRows(sheetName);
  } catch (error) {
    return [];
  }
}

function getConfigMap_() {
  const rows = readRows(SHEET_NAMES.CONFIG);
  const config = {};

  rows.forEach(function (row) {
    const key = row["설정키"] || row["항목"] || row["key"] || row["Key"] || "";
    const value = row["설정값"] || row["값"] || row["value"] || row["Value"] || "";
    if (key) {
      config[String(key).trim()] = value;
    }
  });

  return config;
}

function getConfigValue_(config, keys) {
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (config[key]) {
      return config[key];
    }
  }

  return "";
}

function getSignatureFolderId_() {
  const config = getConfigMap_();
  return String(
    config.signatureFolderId ||
      config["signatureFolderId"] ||
      config[CONFIG_KEYS.SIGNATURE_FOLDER_ID] ||
      config["전자서명저장폴더ID"] ||
      ""
  ).trim();
}

function signatureImageBlob_(signatureImageBase64, filename) {
  const normalized = String(signatureImageBase64 || "").trim();
  const base64 = normalized.indexOf(",") !== -1 ? normalized.split(",").pop() : normalized;
  const bytes = Utilities.base64Decode(base64);
  return Utilities.newBlob(bytes, "image/png", filename);
}

function serializeDate_(value) {
  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  return String(value).trim();
}

function serializeTime_(value) {
  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "HH:mm");
  }

  return String(value).trim();
}

function serializeDateTime_(value) {
  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }

  return String(value).trim();
}

function isActiveStaff(row) {
  const status = String(row[STAFF_COLUMNS.EMPLOYMENT_STATUS] || "").trim();
  return !status || status === "재직" || status.toLowerCase() === "active";
}

function createId_(prefix) {
  return prefix + "-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Utilities.getUuid().slice(0, 8);
}

function findInRows_(rows, columnName, value) {
  const expected = String(value || "").trim();
  return rows.find(function (row) {
    return String(row[columnName] || "").trim() === expected;
  }) || null;
}

function countRows_(rows, columnName, value) {
  return rows.filter(function (row) {
    return String(row[columnName] || "").trim() === String(value || "").trim();
  }).length;
}

function extractJsonData(response) {
  const text = response.getContent();
  const parsed = JSON.parse(text);
  return parsed.data || parsed;
}
