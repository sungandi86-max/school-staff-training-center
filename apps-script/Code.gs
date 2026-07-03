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
  STAFF_ID: "교직원ID",
  STAFF_NAME: "성명",
  DEPARTMENT: "부서",
  ATTENDED_AT: "출석일시",
  METHOD: "출석방법",
  SIGNATURE_REQUIRED: "전자서명필요여부",
  SIGNATURE_SAVED: "전자서명저장여부",
  SIGNATURE_ID: "서명ID",
  NOTE: "비고"
};

const SIGNATURE_COLUMNS = {
  SIGNATURE_ID: "서명ID",
  TRAINING_ID: "교육ID",
  STAFF_ID: "교직원ID",
  STAFF_NAME: "성명",
  SAVED_AT: "서명저장일시",
  FILE_ID: "서명이미지파일ID",
  FILE_URL: "서명이미지URL",
  NOTE: "비고"
};

const ACTIONS = {
  GET_SCHOOL_CONFIG: "getSchoolConfig",
  GET_TRAINING_LIST: "getTrainingList",
  VERIFY_STAFF: "verifyStaff",
  CHECK_TRAINING_TARGET: "checkTrainingTarget",
  SAVE_QR_ATTENDANCE: "saveQrAttendance",
  SAVE_SIGNATURE: "saveSignature",
  GET_MY_TRAINING_STATUS: "getMyTrainingStatus",
  GENERATE_FINAL_ATTENDANCE_SHEET: "generateFinalAttendanceSheet",
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
      case ACTIONS.VERIFY_STAFF:
        return verifyStaff(payload);
      case ACTIONS.CHECK_TRAINING_TARGET:
        return checkTrainingTarget(payload);
      case ACTIONS.SAVE_QR_ATTENDANCE:
        return saveQrAttendance(payload);
      case ACTIONS.SAVE_SIGNATURE:
        return saveSignature(payload);
      case ACTIONS.GET_MY_TRAINING_STATUS:
        return getMyTrainingStatus(payload);
      case ACTIONS.GENERATE_FINAL_ATTENDANCE_SHEET:
        return generateFinalAttendanceSheet(payload);
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
 * Read training list from 01_교육목록.
 *
 * Input: { includeInactive?: boolean }
 * Output: list of training rows with minimum display fields.
 * TODO: Normalize TRUE/FALSE and active status values after real sheet samples are confirmed.
 */
function getTrainingList(payload) {
  const includeInactive = Boolean(payload && payload.includeInactive);
  const rows = readRows(SHEET_NAMES.TRAININGS);
  const trainings = rows
    .filter(function (row) {
      return includeInactive || isTruthy(row[TRAINING_COLUMNS.ACTIVE_STATUS]);
    })
    .map(function (row) {
      return {
        trainingId: row[TRAINING_COLUMNS.TRAINING_ID] || "",
        title: row[TRAINING_COLUMNS.TITLE] || "",
        date: row[TRAINING_COLUMNS.DATE] || "",
        time: row[TRAINING_COLUMNS.TIME] || "",
        location: row[TRAINING_COLUMNS.LOCATION] || "",
        department: row[TRAINING_COLUMNS.DEPARTMENT] || "",
        category: row[TRAINING_COLUMNS.CATEGORY] || "",
        qrEnabled: isTruthy(row[TRAINING_COLUMNS.QR_ENABLED]),
        signatureRequired: isTruthy(row[TRAINING_COLUMNS.SIGNATURE_REQUIRED]),
        activeStatus: row[TRAINING_COLUMNS.ACTIVE_STATUS] || ""
      };
    });

  return jsonResponse({ trainings: trainings });
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

  const targetResult = extractJsonData(checkTrainingTarget({ trainingId: trainingId, staffId: staffId }));
  if (!targetResult.isTarget) {
    return errorResponse("교육 대상자가 아닙니다.", "NOT_TRAINING_TARGET");
  }

  const existing = readRows(SHEET_NAMES.ATTENDANCE).find(function (row) {
    return String(row[ATTENDANCE_COLUMNS.TRAINING_ID] || "").trim() === trainingId &&
      String(row[ATTENDANCE_COLUMNS.STAFF_ID] || "").trim() === staffId;
  });

  if (existing) {
    return jsonResponse({
      attendanceId: existing[ATTENDANCE_COLUMNS.ATTENDANCE_ID] || "",
      trainingId: trainingId,
      attendedAt: existing[ATTENDANCE_COLUMNS.ATTENDED_AT] || "",
      status: "already"
    });
  }

  const staff = findByColumn(SHEET_NAMES.STAFF, STAFF_COLUMNS.STAFF_ID, staffId);
  const training = findByColumn(SHEET_NAMES.TRAININGS, TRAINING_COLUMNS.TRAINING_ID, trainingId);
  const attendanceId = createId_("ATT");
  const attendedAt = new Date();
  const signatureRequired = training ? isTruthy(training[TRAINING_COLUMNS.SIGNATURE_REQUIRED]) && !targetResult.signatureExcluded : false;

  appendRow(SHEET_NAMES.ATTENDANCE, {
    [ATTENDANCE_COLUMNS.ATTENDANCE_ID]: attendanceId,
    [ATTENDANCE_COLUMNS.TRAINING_ID]: trainingId,
    [ATTENDANCE_COLUMNS.STAFF_ID]: staffId,
    [ATTENDANCE_COLUMNS.STAFF_NAME]: staff ? staff[STAFF_COLUMNS.NAME] : "",
    [ATTENDANCE_COLUMNS.DEPARTMENT]: staff ? staff[STAFF_COLUMNS.DEPARTMENT] : "",
    [ATTENDANCE_COLUMNS.ATTENDED_AT]: attendedAt,
    [ATTENDANCE_COLUMNS.METHOD]: payload && payload.method ? payload.method : "QR",
    [ATTENDANCE_COLUMNS.SIGNATURE_REQUIRED]: signatureRequired,
    [ATTENDANCE_COLUMNS.SIGNATURE_SAVED]: false,
    [ATTENDANCE_COLUMNS.SIGNATURE_ID]: "",
    [ATTENDANCE_COLUMNS.NOTE]: "TODO: signature linkage pending"
  });

  return jsonResponse({
    attendanceId: attendanceId,
    trainingId: trainingId,
    attendedAt: attendedAt,
    signatureRequired: signatureRequired,
    signatureSaved: false,
    status: "saved"
  });
}

/**
 * Save signature metadata to 05_전자서명기록.
 *
 * Input: { trainingId: string, staffId: string, signatureImageBase64: string }
 * Output: placeholder response until Drive save is implemented.
 * TODO: Save signature image to CONFIG_KEYS.SIGNATURE_FOLDER_ID and record only file ID/URL in Sheet.
 */
function saveSignature(payload) {
  if (!payload || !payload.trainingId || !payload.staffId) {
    return errorResponse("교육ID와 교직원ID가 필요합니다.", "MISSING_SIGNATURE_KEYS");
  }

  return jsonResponse({
    status: "todo",
    message: "전자서명 Drive 저장은 다음 단계에서 구현합니다."
  });
}

/**
 * Read current user's training status.
 *
 * Input: { staffId: string }
 * Output: list of target trainings with attendance/signature summary.
 * TODO: Include certificate submission status if 06_이수증제출 is enabled.
 */
function getMyTrainingStatus(payload) {
  const staffId = payload && payload.staffId ? String(payload.staffId).trim() : "";

  if (!staffId) {
    return errorResponse("교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  }

  const targets = readRows(SHEET_NAMES.TARGETS).filter(function (row) {
    return String(row[TARGET_COLUMNS.STAFF_ID] || "").trim() === staffId &&
      isTruthy(row[TARGET_COLUMNS.IS_TARGET]);
  });
  const trainings = readRows(SHEET_NAMES.TRAININGS);
  const attendances = readRows(SHEET_NAMES.ATTENDANCE);
  const signatures = readRows(SHEET_NAMES.SIGNATURES);

  const items = targets.map(function (target) {
    const trainingId = target[TARGET_COLUMNS.TRAINING_ID] || "";
    const training = findInRows_(trainings, TRAINING_COLUMNS.TRAINING_ID, trainingId);
    const attendance = attendances.find(function (row) {
      return row[ATTENDANCE_COLUMNS.TRAINING_ID] === trainingId &&
        row[ATTENDANCE_COLUMNS.STAFF_ID] === staffId;
    });
    const signature = signatures.find(function (row) {
      return row[SIGNATURE_COLUMNS.TRAINING_ID] === trainingId &&
        row[SIGNATURE_COLUMNS.STAFF_ID] === staffId;
    });

    return {
      trainingId: trainingId,
      title: training ? training[TRAINING_COLUMNS.TITLE] : "",
      date: training ? training[TRAINING_COLUMNS.DATE] : "",
      required: isTruthy(target[TARGET_COLUMNS.REQUIRED]),
      completed: Boolean(attendance),
      signatureCompleted: Boolean(signature),
      attendedAt: attendance ? attendance[ATTENDANCE_COLUMNS.ATTENDED_AT] : ""
    };
  });

  return jsonResponse({ items: items });
}

/**
 * Generate final attendance sheet.
 *
 * Input: { trainingId: string }
 * Output: placeholder response until document/spreadsheet generation is implemented.
 * TODO: Create final roster file in CONFIG_KEYS.FINAL_ROSTER_FOLDER_ID and append file URL to 08_최종서명부.
 */
function generateFinalAttendanceSheet(payload) {
  if (!payload || !payload.trainingId) {
    return errorResponse("교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  }

  return jsonResponse({
    trainingId: payload.trainingId,
    status: "todo",
    message: "최종 서명부 파일 생성은 다음 단계에서 구현합니다."
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

  const headers = values[0];
  return values.slice(1)
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
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = headers.map(function (header) {
    return row[String(header)] !== undefined ? row[String(header)] : "";
  });

  sheet.appendRow(values);
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
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};

  headers.forEach(function (header, index) {
    if (header) {
      map[String(header)] = index;
    }
  });

  return map;
}

function isTruthy(value) {
  if (value === true) {
    return true;
  }
  const normalized = String(value || "").trim().toLowerCase();
  return ["true", "y", "yes", "1", "사용", "활성", "대상", "필수", "재직"].indexOf(normalized) !== -1;
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
