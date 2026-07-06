/**
 * School Health Hub - Hub Sheet v1.1 Apps Script API
 *
 * Data is stored only in the school's Google Sheet and Google Drive.
 * General staff flows never use or expose authentication codes.
 * adminCode is read only for verifyAdminCode() and is never returned.
 */

const SHEETS = {
  CONFIG: "00_학교설정",
  TRAININGS: "01_교육목록",
  STAFF: "02_교직원명단",
  TARGETS: "03_교육대상",
  ATTENDANCE: "04_QR출석기록",
  SIGNATURES: "05_전자서명기록",
  CERTIFICATES: "06_이수증업로드",
  UPLOAD_STATUS_VIEW: "07_업로드상태_VIEW",
  FINAL_ROSTER: "08_최종서명부",
  NOTICES: "09_공지사항",
  DEPARTMENTS: "10_부서관리",
  TARGET_MEMO: "11_교육대상_설계메모",
  CODE_VALUES: "99_코드값"
};

const CONFIG = {
  KEY: "설정키",
  VALUE: "설정값",
  SCHOOL_NAME: "schoolName",
  CENTER_NAME: "centerName",
  LOGO_URL: "logoUrl",
  PRIMARY_COLOR: "primaryColor",
  SECONDARY_COLOR: "secondaryColor",
  OWNER_DEPARTMENT: "ownerDepartment",
  OWNER_NAME: "ownerName",
  OWNER_CONTACT: "ownerContact",
  SIGNATURE_FOLDER_ID: "signatureFolderId",
  CERTIFICATE_FOLDER_ID: "certificateFolderId",
  FINAL_ROSTER_FOLDER_ID: "finalRosterFolderId",
  PRIVACY_NOTICE: "privacyNotice",
  ADMIN_CODE: "adminCode",
  ACTIVE_SEMESTER: "activeSemester"
};

const TRAINING = {
  ID: "교육ID",
  TITLE: "교육명",
  DATE: "교육일자",
  TIME: "교육시간",
  PLACE: "장소",
  DEPARTMENT: "담당부서",
  CATEGORY: "교육구분",
  QR_ENABLED: "QR사용여부",
  SIGNATURE_REQUIRED: "전자서명필요여부",
  CERTIFICATE_REQUIRED: "이수증제출필요여부",
  STATUS: "활성상태",
  FOLDER_MODE: "folderMode",
  DRIVE_FOLDER_ID: "driveFolderId",
  SIGNATURE_FOLDER_ID: "signatureFolderId",
  CERTIFICATE_FOLDER_ID: "certificateFolderId",
  FINAL_ROSTER_FOLDER_ID: "finalRosterFolderId",
  NOTE: "비고"
};

const STAFF = {
  ID: "교직원ID",
  NAME: "성명",
  DEPARTMENT: "부서",
  POSITION: "직위",
  STATUS: "재직상태",
  ROLE: "권한",
  NOTE: "비고"
};

const TARGET = {
  TRAINING_ID: "교육ID",
  STAFF_ID: "교직원ID",
  IS_TARGET: "대상여부",
  REQUIRED: "필수여부",
  SIGNATURE_EXCLUDED: "서명제외여부",
  NOTE: "비고"
};

const ATTENDANCE = {
  ID: "출석ID",
  TRAINING_ID: "교육ID",
  TRAINING_TITLE: "교육명",
  STAFF_ID: "교직원ID",
  STAFF_NAME: "성명",
  DEPARTMENT: "부서",
  ATTENDED_AT: "출석일시",
  METHOD: "출석방법",
  DUPLICATE: "중복여부",
  STATUS: "처리상태",
  RECORDER: "기록자",
  NOTE: "비고"
};

const SIGNATURE = {
  ID: "서명ID",
  TRAINING_ID: "교육ID",
  TRAINING_TITLE: "교육명",
  STAFF_ID: "교직원ID",
  STAFF_NAME: "성명",
  DEPARTMENT: "부서",
  SIGNED_AT: "서명일시",
  FILE_URL: "서명파일URL",
  FILE_ID: "서명파일ID",
  STATUS: "저장상태",
  NOTE: "비고"
};

const CERTIFICATE = {
  ID: "제출ID",
  TRAINING_ID: "교육ID",
  TRAINING_TITLE: "교육명",
  STAFF_ID: "교직원ID",
  STAFF_NAME: "성명",
  DEPARTMENT: "부서",
  SUBMITTED_AT: "제출일시",
  COMPLETED_DATE: "이수일자",
  ISSUER: "이수기관",
  CERTIFICATE_NUMBER: "이수증번호",
  FILE_URL: "파일URL",
  FILE_ID: "파일ID",
  STATUS: "상태",
  REVIEWER: "확인자",
  NOTE: "비고"
};

const FINAL = {
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
  getSchoolConfig: getSchoolConfig,
  verifyAdminCode: verifyAdminCode,
  updateSchoolConfig: updateSchoolConfig,
  validateSetup: validateSetup,
  getTrainingList: getTrainingList,
  getTrainingDetail: getTrainingDetail,
  createTraining: createTraining,
  updateTraining: updateTraining,
  updateTrainingStatus: updateTrainingStatus,
  getStaffByNameDept: getStaffByNameDept,
  getStaffDetail: getStaffDetail,
  getStaffList: getStaffList,
  createStaff: createStaff,
  updateStaff: updateStaff,
  deactivateStaff: deactivateStaff,
  verifyStaff: verifyStaff,
  getTrainingTargets: getTrainingTargets,
  checkTrainingTarget: checkTrainingTarget,
  checkDuplicateAttendance: checkDuplicateAttendance,
  saveQrAttendance: saveQrAttendance,
  getSignatureRequiredTrainings: getSignatureRequiredTrainings,
  checkSignatureExists: checkSignatureExists,
  saveSignature: saveSignature,
  saveBulkSignature: saveBulkSignature,
  getCertificateRequiredTrainings: getCertificateRequiredTrainings,
  saveCertificateSubmission: saveCertificateSubmission,
  getMyTrainingStatus: getMyTrainingStatus,
  getMyTrainingStatusByNameDept: getMyTrainingStatusByNameDept,
  getTrainingAttendanceStatus: getTrainingAttendanceStatus,
  getFinalAttendancePreview: getFinalAttendancePreview,
  generateFinalAttendanceSheet: generateFinalAttendanceSheet,
  getNotices: getNotices,
  getDepartments: getDepartments,
  getCodeValues: getCodeValues,
  getAdminDashboardData: getAdminDashboardData
};

function doGet(e) {
  return route_(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  var payload = {};
  try {
    payload = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
  } catch (error) {
    return errorResponse("요청 형식을 확인해 주세요.", "INVALID_JSON");
  }
  return route_(payload);
}

function route_(payload) {
  try {
    var action = payload && payload.action ? String(payload.action) : "";
    if (!action) {
      return successResponse({
        service: "School Health Hub Apps Script",
        version: "hub-v1.1",
        status: "ready"
      });
    }
    if (!ACTIONS[action]) {
      return errorResponse("지원하지 않는 요청입니다.", "UNKNOWN_ACTION");
    }
    return ACTIONS[action](payload || {});
  } catch (error) {
    return errorResponse(error && error.userMessage ? error.userMessage : "처리 중 오류가 발생했습니다.", error && error.code ? error.code : "SERVER_ERROR");
  }
}

function getSchoolConfig() {
  var config = getConfigMap_();
  return successResponse(publicSchoolConfig_(config));
}

function verifyAdminCode(payload) {
  var config = getConfigMap_();
  var input = String(payload.adminCode || "").trim();
  var saved = String(configValue_(config, ["adminCode", "관리자코드", "관리자 코드"]) || "").trim();
  if (!saved) {
    return errorResponse("관리자 코드가 설정되지 않았습니다.", "ADMIN_CODE_NOT_SET");
  }
  if (!input || input !== saved) {
    return errorResponse("관리자 코드가 일치하지 않습니다.", "ADMIN_CODE_MISMATCH");
  }
  return successResponse({ verified: true });
}

function updateSchoolConfig(payload) {
  var settings = payload.settings || payload || {};
  var keyMap = {
    schoolName: CONFIG.SCHOOL_NAME,
    centerName: CONFIG.CENTER_NAME,
    logoUrl: CONFIG.LOGO_URL,
    schoolLogoUrl: CONFIG.LOGO_URL,
    primaryColor: CONFIG.PRIMARY_COLOR,
    secondaryColor: CONFIG.SECONDARY_COLOR,
    ownerDepartment: CONFIG.OWNER_DEPARTMENT,
    ownerName: CONFIG.OWNER_NAME,
    ownerContact: CONFIG.OWNER_CONTACT,
    signatureFolderId: CONFIG.SIGNATURE_FOLDER_ID,
    certificateFolderId: CONFIG.CERTIFICATE_FOLDER_ID,
    finalRosterFolderId: CONFIG.FINAL_ROSTER_FOLDER_ID,
    privacyNotice: CONFIG.PRIVACY_NOTICE,
    activeSemester: CONFIG.ACTIVE_SEMESTER,
    adminCode: CONFIG.ADMIN_CODE
  };
  var rows = Object.keys(keyMap).filter(function (key) {
    return settings[key] !== undefined && (key !== "adminCode" || String(settings[key] || "").trim());
  }).map(function (key) {
    return { key: keyMap[key], value: String(settings[key] || "").trim() };
  });

  if (!rows.length) {
    return errorResponse("저장할 설정값이 없습니다.", "NO_CONFIG_UPDATES");
  }

  upsertConfigRows_(rows);
  return getSchoolConfig();
}

function validateSetup() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var config = getConfigMap_();
  var sheetChecks = [
    [SHEETS.CONFIG, "학교설정"],
    [SHEETS.TRAININGS, "교육목록"],
    [SHEETS.STAFF, "교직원명단"],
    [SHEETS.TARGETS, "교육대상"],
    [SHEETS.ATTENDANCE, "QR출석기록"],
    [SHEETS.SIGNATURES, "전자서명기록"],
    [SHEETS.FINAL_ROSTER, "최종서명부"]
  ].map(function (item) {
    return { key: item[0], label: item[1], name: item[0], exists: Boolean(spreadsheet.getSheetByName(item[0])) };
  });
  var folderChecks = [
    ["signatureFolderId", "전자서명 저장 폴더", config.signatureFolderId],
    ["finalRosterFolderId", "최종 서명부 저장 폴더", config.finalRosterFolderId],
    ["certificateFolderId", "이수증 저장 폴더", config.certificateFolderId]
  ].map(function (item) {
    return { key: item[0], label: item[1], configured: Boolean(String(item[2] || "").trim()) };
  });
  var trainings = spreadsheet.getSheetByName(SHEETS.TRAININGS) ? readTable(SHEETS.TRAININGS, [TRAINING.ID, TRAINING.TITLE, TRAINING.STATUS]) : [];
  var activeCount = trainings.filter(function (row) { return isActiveTraining_(row); }).length;
  return successResponse({
    ok: sheetChecks.every(function (item) { return item.exists; }) && activeCount > 0,
    schoolConfig: publicSchoolConfig_(config),
    folders: folderChecks,
    sheets: sheetChecks,
    training: { totalCount: trainings.length, activeCount: activeCount }
  });
}

function getTrainingList(payload) {
  var includeInactive = normalizeBoolean(payload.includeInactive);
  var trainings = readTable(SHEETS.TRAININGS, [TRAINING.ID, TRAINING.TITLE, TRAINING.STATUS])
    .filter(function (row) { return includeInactive || isActiveTraining_(row); })
    .map(normalizeTraining_);
  return successResponse(trainings);
}

function getTrainingDetail(payload) {
  var trainingId = requireText_(payload.trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var training = findTraining_(trainingId);
  if (!training) {
    return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  }
  return successResponse(normalizeTraining_(training));
}

function createTraining(payload) {
  var input = payload.training || payload || {};
  var title = requireText_(input.title, "교육명을 입력해 주세요.", "MISSING_TRAINING_TITLE");
  var row = {};
  row[TRAINING.ID] = generateTrainingId_();
  row[TRAINING.TITLE] = title;
  row[TRAINING.DATE] = text_(input.date);
  row[TRAINING.TIME] = text_(input.time);
  row[TRAINING.PLACE] = text_(input.place || input.location);
  row[TRAINING.DEPARTMENT] = text_(input.department);
  row[TRAINING.CATEGORY] = text_(input.category);
  row[TRAINING.QR_ENABLED] = yn_(input.qrEnabled);
  row[TRAINING.SIGNATURE_REQUIRED] = yn_(input.signatureRequired);
  row[TRAINING.CERTIFICATE_REQUIRED] = yn_(input.certificateRequired);
  row[TRAINING.STATUS] = text_(input.status || input.activeStatus) || "활성";
  row[TRAINING.FOLDER_MODE] = text_(input.folderMode);
  row[TRAINING.DRIVE_FOLDER_ID] = text_(input.driveFolderId);
  row[TRAINING.SIGNATURE_FOLDER_ID] = text_(input.signatureFolderId);
  row[TRAINING.CERTIFICATE_FOLDER_ID] = text_(input.certificateFolderId);
  row[TRAINING.FINAL_ROSTER_FOLDER_ID] = text_(input.finalRosterFolderId);
  row[TRAINING.NOTE] = text_(input.note);
  appendRowByHeader(SHEETS.TRAININGS, row);
  return successResponse(normalizeTraining_(row));
}

function updateTraining(payload) {
  var trainingId = requireText_(payload.trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var input = payload.training || {};
  var updates = {};
  copyIfDefined_(updates, input, "title", TRAINING.TITLE);
  copyIfDefined_(updates, input, "date", TRAINING.DATE);
  copyIfDefined_(updates, input, "time", TRAINING.TIME);
  copyIfDefined_(updates, input, "department", TRAINING.DEPARTMENT);
  copyIfDefined_(updates, input, "category", TRAINING.CATEGORY);
  copyIfDefined_(updates, input, "folderMode", TRAINING.FOLDER_MODE);
  copyIfDefined_(updates, input, "driveFolderId", TRAINING.DRIVE_FOLDER_ID);
  copyIfDefined_(updates, input, "signatureFolderId", TRAINING.SIGNATURE_FOLDER_ID);
  copyIfDefined_(updates, input, "certificateFolderId", TRAINING.CERTIFICATE_FOLDER_ID);
  copyIfDefined_(updates, input, "finalRosterFolderId", TRAINING.FINAL_ROSTER_FOLDER_ID);
  copyIfDefined_(updates, input, "note", TRAINING.NOTE);
  if (input.place !== undefined || input.location !== undefined) updates[TRAINING.PLACE] = text_(input.place || input.location);
  if (input.qrEnabled !== undefined) updates[TRAINING.QR_ENABLED] = yn_(input.qrEnabled);
  if (input.signatureRequired !== undefined) updates[TRAINING.SIGNATURE_REQUIRED] = yn_(input.signatureRequired);
  if (input.certificateRequired !== undefined) updates[TRAINING.CERTIFICATE_REQUIRED] = yn_(input.certificateRequired);
  if (input.status !== undefined || input.activeStatus !== undefined) updates[TRAINING.STATUS] = text_(input.status || input.activeStatus);
  var updated = updateRowByKey_(SHEETS.TRAININGS, TRAINING.ID, trainingId, updates, normalizeTraining_);
  if (!updated) return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  return successResponse(updated);
}

function updateTrainingStatus(payload) {
  var trainingId = requireText_(payload.trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var status = requireText_(payload.status, "변경할 활성상태가 필요합니다.", "MISSING_TRAINING_STATUS");
  var updated = updateRowByKey_(SHEETS.TRAININGS, TRAINING.ID, trainingId, map_(TRAINING.STATUS, status), normalizeTraining_);
  if (!updated) return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  return successResponse(updated);
}

function getStaffByNameDept(payload) {
  var staff = findStaffByNameDept_(payload.name, payload.department);
  if (!staff.ok) return staff.response;
  return successResponse({ staff: publicStaff_(staff.row) });
}

function verifyStaff(payload) {
  return getStaffByNameDept({ name: payload.name || payload.staffQuery, department: payload.department });
}

function getStaffDetail(payload) {
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var staff = findByColumn_(SHEETS.STAFF, STAFF.ID, staffId);
  if (!staff || !isActiveStaff_(staff)) return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  return successResponse(publicStaff_(staff));
}

function getStaffList() {
  var staff = readTable(SHEETS.STAFF, [STAFF.ID, STAFF.NAME]).map(function (row) {
    return {
      staffId: text_(row[STAFF.ID]),
      name: text_(row[STAFF.NAME]),
      department: text_(row[STAFF.DEPARTMENT]),
      position: text_(row[STAFF.POSITION]),
      authCode: "",
      employmentStatus: text_(row[STAFF.STATUS]) || "재직",
      role: text_(row[STAFF.ROLE]) || "교직원",
      note: text_(row[STAFF.NOTE])
    };
  });
  return successResponse({
    summary: {
      total: staff.length,
      active: staff.filter(function (item) { return isActiveStatus_(item.employmentStatus); }).length,
      inactive: staff.filter(function (item) { return !isActiveStatus_(item.employmentStatus); }).length,
      managers: staff.filter(function (item) { return item.role === "관리자" || item.role === "담당자"; }).length
    },
    staff: staff
  });
}

function createStaff(payload) {
  var input = payload.staff || payload || {};
  var name = requireText_(input.name, "성명을 입력해 주세요.", "MISSING_STAFF_NAME");
  var row = {};
  row[STAFF.ID] = generateStaffId_();
  row[STAFF.NAME] = name;
  row[STAFF.DEPARTMENT] = text_(input.department);
  row[STAFF.POSITION] = text_(input.position);
  row[STAFF.STATUS] = text_(input.employmentStatus) || "재직";
  row[STAFF.ROLE] = text_(input.role) || "교직원";
  row[STAFF.NOTE] = text_(input.note);
  appendRowByHeader(SHEETS.STAFF, row);
  return successResponse(adminStaff_(row));
}

function updateStaff(payload) {
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var input = payload.staff || {};
  var updates = {};
  copyIfDefined_(updates, input, "name", STAFF.NAME);
  copyIfDefined_(updates, input, "department", STAFF.DEPARTMENT);
  copyIfDefined_(updates, input, "position", STAFF.POSITION);
  copyIfDefined_(updates, input, "employmentStatus", STAFF.STATUS);
  copyIfDefined_(updates, input, "role", STAFF.ROLE);
  copyIfDefined_(updates, input, "note", STAFF.NOTE);
  var updated = updateRowByKey_(SHEETS.STAFF, STAFF.ID, staffId, updates, adminStaff_);
  if (!updated) return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  return successResponse(updated);
}

function deactivateStaff(payload) {
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var updated = updateRowByKey_(SHEETS.STAFF, STAFF.ID, staffId, map_(STAFF.STATUS, "비활성"), adminStaff_);
  if (!updated) return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  return successResponse(updated);
}

function getTrainingTargets(payload) {
  var trainingId = text_(payload.trainingId);
  var staffId = text_(payload.staffId);
  var rows = readTable(SHEETS.TARGETS, [TARGET.TRAINING_ID, TARGET.STAFF_ID]);
  rows = rows.filter(function (row) {
    return (!trainingId || text_(row[TARGET.TRAINING_ID]) === trainingId) &&
      (!staffId || text_(row[TARGET.STAFF_ID]) === staffId) &&
      isTargetRow_(row);
  });
  return successResponse(rows.map(function (row) {
    return {
      trainingId: text_(row[TARGET.TRAINING_ID]),
      staffId: text_(row[TARGET.STAFF_ID]),
      isTarget: true,
      required: normalizeBoolean(row[TARGET.REQUIRED]),
      signatureExcluded: normalizeBoolean(row[TARGET.SIGNATURE_EXCLUDED]),
      note: text_(row[TARGET.NOTE])
    };
  }));
}

function checkTrainingTarget(payload) {
  var trainingId = requireText_(payload.trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var target = findTarget_(trainingId, staffId);
  return successResponse({
    isTarget: Boolean(target),
    required: target ? normalizeBoolean(target[TARGET.REQUIRED]) : false,
    signatureExcluded: target ? normalizeBoolean(target[TARGET.SIGNATURE_EXCLUDED]) : false
  });
}

function checkDuplicateAttendance(payload) {
  var trainingId = requireText_(payload.trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var existing = findAttendance_(trainingId, staffId);
  return successResponse({
    duplicate: Boolean(existing),
    attendanceId: existing ? text_(existing[ATTENDANCE.ID]) : "",
    attendedAt: existing ? normalizeDateTime_(existing[ATTENDANCE.ATTENDED_AT]) : "",
    processStatus: existing ? text_(existing[ATTENDANCE.STATUS]) : ""
  });
}

function saveQrAttendance(payload) {
  var trainingId = requireText_(payload.trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var training = findTraining_(trainingId);
  var staff = findByColumn_(SHEETS.STAFF, STAFF.ID, staffId);
  if (!training) return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  if (!staff || !isActiveStaff_(staff)) return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  if (!isActiveTraining_(training)) return errorResponse("활성 교육만 출석할 수 있습니다.", "INACTIVE_TRAINING");
  var normalizedTraining = normalizeTraining_(training);
  if (!normalizedTraining.qrEnabled) return errorResponse("QR 출석을 사용하지 않는 교육입니다.", "QR_DISABLED");
  var target = findTarget_(trainingId, staffId);
  if (!target) return errorResponse("교육 대상자가 아닙니다.", "NOT_TRAINING_TARGET");
  var existing = findAttendance_(trainingId, staffId);
  if (existing) {
    return successResponse({
      attendanceId: text_(existing[ATTENDANCE.ID]),
      trainingId: trainingId,
      trainingTitle: normalizedTraining.title,
      attendedAt: normalizeDateTime_(existing[ATTENDANCE.ATTENDED_AT]),
      duplicate: true,
      processStatus: text_(existing[ATTENDANCE.STATUS]) || "중복",
      signatureRequired: normalizedTraining.signatureRequired && !normalizeBoolean(target[TARGET.SIGNATURE_EXCLUDED]),
      status: "already"
    });
  }
  var attendedAt = new Date();
  var row = {};
  row[ATTENDANCE.ID] = generateId_("ATT");
  row[ATTENDANCE.TRAINING_ID] = trainingId;
  row[ATTENDANCE.TRAINING_TITLE] = normalizedTraining.title;
  row[ATTENDANCE.STAFF_ID] = staffId;
  row[ATTENDANCE.STAFF_NAME] = text_(staff[STAFF.NAME]);
  row[ATTENDANCE.DEPARTMENT] = text_(staff[STAFF.DEPARTMENT]);
  row[ATTENDANCE.ATTENDED_AT] = attendedAt;
  row[ATTENDANCE.METHOD] = text_(payload.method) || "QR";
  row[ATTENDANCE.DUPLICATE] = "N";
  row[ATTENDANCE.STATUS] = "완료";
  row[ATTENDANCE.RECORDER] = "system";
  row[ATTENDANCE.NOTE] = "";
  appendRowByHeader(SHEETS.ATTENDANCE, row);
  return successResponse({
    attendanceId: row[ATTENDANCE.ID],
    trainingId: trainingId,
    trainingTitle: normalizedTraining.title,
    attendedAt: normalizeDateTime_(attendedAt),
    duplicate: false,
    processStatus: "완료",
    signatureRequired: normalizedTraining.signatureRequired && !normalizeBoolean(target[TARGET.SIGNATURE_EXCLUDED]),
    status: "saved"
  });
}

function getSignatureRequiredTrainings(payload) {
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var excludeSigned = payload.excludeSigned === undefined ? true : normalizeBoolean(payload.excludeSigned);
  var staff = findByColumn_(SHEETS.STAFF, STAFF.ID, staffId);
  if (!staff || !isActiveStaff_(staff)) return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  var trainings = readTable(SHEETS.TRAININGS, [TRAINING.ID, TRAINING.TITLE]);
  var targets = readTable(SHEETS.TARGETS, [TARGET.TRAINING_ID, TARGET.STAFF_ID]).filter(function (target) {
    return text_(target[TARGET.STAFF_ID]) === staffId && isTargetRow_(target);
  });
  var attendances = readTableOptional_(SHEETS.ATTENDANCE);
  var signatures = readTableOptional_(SHEETS.SIGNATURES);
  var items = targets.map(function (target) {
    var training = findInRows_(trainings, TRAINING.ID, target[TARGET.TRAINING_ID]);
    if (!training) return null;
    var normalized = normalizeTraining_(training);
    if (!normalized.signatureRequired || normalizeBoolean(target[TARGET.SIGNATURE_EXCLUDED])) return null;
    var attendance = findInRows2_(attendances, ATTENDANCE.TRAINING_ID, normalized.trainingId, ATTENDANCE.STAFF_ID, staffId);
    var signature = findInRows2_(signatures, SIGNATURE.TRAINING_ID, normalized.trainingId, SIGNATURE.STAFF_ID, staffId);
    if (excludeSigned && signature) return null;
    var attendanceRequired = normalized.qrEnabled;
    return {
      trainingId: normalized.trainingId,
      title: normalized.title,
      date: normalized.date,
      time: normalized.time,
      place: normalized.place,
      department: normalized.department,
      attendanceRequired: attendanceRequired,
      attendanceDone: Boolean(attendance),
      attendedAt: attendance ? normalizeDateTime_(attendance[ATTENDANCE.ATTENDED_AT]) : "",
      signatureDone: Boolean(signature),
      signedAt: signature ? normalizeDateTime_(signature[SIGNATURE.SIGNED_AT]) : "",
      selectable: !signature && (!attendanceRequired || Boolean(attendance)),
      blockedReason: attendanceRequired && !attendance ? "출석 후 서명 가능" : ""
    };
  }).filter(Boolean).sort(compareSignatureItems_);
  return successResponse({ staff: publicStaff_(staff), groups: groupByDate_(items) });
}

function checkSignatureExists(payload) {
  var trainingId = requireText_(payload.trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var existing = findSignature_(trainingId, staffId);
  return successResponse({
    exists: Boolean(existing),
    signatureId: existing ? text_(existing[SIGNATURE.ID]) : "",
    signedAt: existing ? normalizeDateTime_(existing[SIGNATURE.SIGNED_AT]) : "",
    fileUrl: existing ? text_(existing[SIGNATURE.FILE_URL]) : "",
    fileId: existing ? text_(existing[SIGNATURE.FILE_ID]) : "",
    saveStatus: existing ? text_(existing[SIGNATURE.STATUS]) : ""
  });
}

function saveSignature(payload) {
  return saveBulkSignature({
    staffId: payload.staffId,
    trainingIds: [payload.trainingId],
    signatureImage: payload.signatureImage || payload.signatureImageBase64,
    selectedDate: payload.selectedDate
  });
}

function saveBulkSignature(payload) {
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var trainingIds = normalizeIdList_(payload.trainingIds || payload.trainingId);
  var signatureImage = text_(payload.signatureImage || payload.signatureImageBase64);
  if (!trainingIds.length) return errorResponse("서명할 교육을 선택해 주세요.", "MISSING_SIGNATURE_TRAININGS");
  if (!signatureImage) return errorResponse("서명 이미지가 필요합니다.", "MISSING_SIGNATURE_IMAGE");
  var staff = findByColumn_(SHEETS.STAFF, STAFF.ID, staffId);
  if (!staff || !isActiveStaff_(staff)) return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  var normalizedStaff = publicStaff_(staff);
  var trainings = readTable(SHEETS.TRAININGS, [TRAINING.ID, TRAINING.TITLE]);
  var rowsToSave = [];
  var skipped = [];
  trainingIds.forEach(function (trainingId) {
    var training = findInRows_(trainings, TRAINING.ID, trainingId);
    var normalized = training ? normalizeTraining_(training) : null;
    var target = findTarget_(trainingId, staffId);
    if (!normalized) return skipped.push({ trainingId: trainingId, title: "", reason: "교육 정보 없음" });
    if (!target) return skipped.push({ trainingId: trainingId, title: normalized.title, reason: "교육대상 아님" });
    if (!normalized.signatureRequired || normalizeBoolean(target[TARGET.SIGNATURE_EXCLUDED])) return skipped.push({ trainingId: trainingId, title: normalized.title, reason: "서명 대상 아님" });
    if (findSignature_(trainingId, staffId)) return skipped.push({ trainingId: trainingId, title: normalized.title, reason: "이미 서명 완료" });
    if (normalized.qrEnabled && !findAttendance_(trainingId, staffId)) return skipped.push({ trainingId: trainingId, title: normalized.title, reason: "출석 후 서명 가능" });
    rowsToSave.push(normalized);
  });
  if (!rowsToSave.length) {
    return successResponse({ status: "skipped", savedCount: 0, skippedCount: skipped.length, rows: [], skipped: skipped });
  }
  var folderId = signatureFolderId_(rowsToSave[0]);
  if (!folderId) return errorResponse("전자서명 저장 폴더가 설정되지 않았습니다. 관리자에게 문의해 주세요.", "SIGNATURE_FOLDER_NOT_CONFIGURED");
  var signedAt = new Date();
  var fileSignatureId = generateId_("SIG");
  var file = DriveApp.getFolderById(folderId).createFile(base64Blob_(signatureImage, "image/png", fileSignatureId + ".png"));
  var fileUrl = file.getUrl();
  var fileId = file.getId();
  var dates = unique_(rowsToSave.map(function (training) { return training.date; }).filter(Boolean));
  var note = "일괄서명 / " + (payload.selectedDate || (dates.length === 1 ? dates[0] : "복수날짜"));
  var savedRows = rowsToSave.map(function (training) {
    var row = {};
    row[SIGNATURE.ID] = rowsToSave.length === 1 ? fileSignatureId : generateId_("SIG");
    row[SIGNATURE.TRAINING_ID] = training.trainingId;
    row[SIGNATURE.TRAINING_TITLE] = training.title;
    row[SIGNATURE.STAFF_ID] = staffId;
    row[SIGNATURE.STAFF_NAME] = normalizedStaff.name;
    row[SIGNATURE.DEPARTMENT] = normalizedStaff.department;
    row[SIGNATURE.SIGNED_AT] = signedAt;
    row[SIGNATURE.FILE_URL] = fileUrl;
    row[SIGNATURE.FILE_ID] = fileId;
    row[SIGNATURE.STATUS] = "완료";
    row[SIGNATURE.NOTE] = rowsToSave.length > 1 ? note : "";
    appendRowByHeader(SHEETS.SIGNATURES, row);
    return {
      signatureId: row[SIGNATURE.ID],
      trainingId: training.trainingId,
      trainingTitle: training.title,
      date: training.date,
      signedAt: normalizeDateTime_(signedAt),
      fileUrl: fileUrl,
      fileId: fileId,
      saveStatus: "완료"
    };
  });
  return successResponse({
    status: "saved",
    savedCount: savedRows.length,
    skippedCount: skipped.length,
    rows: savedRows,
    skipped: skipped,
    staff: normalizedStaff,
    signedAt: normalizeDateTime_(signedAt),
    fileUrl: fileUrl,
    fileId: fileId
  });
}

function getCertificateRequiredTrainings(payload) {
  var staffResult = findStaffByNameDept_(payload.name, payload.department);
  if (!staffResult.ok) return staffResult.response;
  var staff = staffResult.row;
  var staffId = text_(staff[STAFF.ID]);
  var targets = readTable(SHEETS.TARGETS, [TARGET.TRAINING_ID, TARGET.STAFF_ID]).filter(function (row) {
    return text_(row[TARGET.STAFF_ID]) === staffId && isTargetRow_(row);
  });
  var trainings = readTable(SHEETS.TRAININGS, [TRAINING.ID, TRAINING.TITLE]);
  var certificates = readTableOptional_(SHEETS.CERTIFICATES);
  var items = targets.map(function (target) {
    var training = findInRows_(trainings, TRAINING.ID, target[TARGET.TRAINING_ID]);
    if (!training) return null;
    var normalized = normalizeTraining_(training);
    if (!normalized.certificateRequired) return null;
    var certificate = findCertificate_(normalized.trainingId, staffId, certificates);
    return {
      trainingId: normalized.trainingId,
      title: normalized.title,
      date: normalized.date,
      time: normalized.time,
      place: normalized.place,
      department: normalized.department,
      certificateRequired: true,
      certificateSubmitted: Boolean(certificate),
      submittedAt: certificate ? normalizeDateTime_(certificate[CERTIFICATE.SUBMITTED_AT]) : "",
      status: certificate ? text_(certificate[CERTIFICATE.STATUS]) || "승인대기" : "미제출",
      fileUrl: certificate ? text_(certificate[CERTIFICATE.FILE_URL]) : ""
    };
  }).filter(Boolean).sort(function (a, b) {
    if (a.certificateSubmitted !== b.certificateSubmitted) return a.certificateSubmitted ? 1 : -1;
    return String(a.date).localeCompare(String(b.date));
  });
  return successResponse({
    staff: publicStaff_(staff),
    items: items,
    summary: {
      total: items.length,
      submitted: items.filter(function (item) { return item.certificateSubmitted; }).length,
      missing: items.filter(function (item) { return !item.certificateSubmitted; }).length
    }
  });
}

function saveCertificateSubmission(payload) {
  var trainingId = requireText_(payload.trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var fileBase64 = requireText_(payload.fileBase64, "이수증 파일이 필요합니다.", "MISSING_CERTIFICATE_FILE");
  var training = findTraining_(trainingId);
  var staff = findByColumn_(SHEETS.STAFF, STAFF.ID, staffId);
  if (!training) return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  if (!staff || !isActiveStaff_(staff)) return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  var normalizedTraining = normalizeTraining_(training);
  if (!normalizedTraining.certificateRequired) return errorResponse("이수증 제출 대상 교육이 아닙니다.", "CERTIFICATE_NOT_REQUIRED");
  var folderId = certificateFolderId_(normalizedTraining);
  if (!folderId) return errorResponse("이수증 저장 폴더가 설정되지 않았습니다. 관리자에게 문의해 주세요.", "CERTIFICATE_FOLDER_NOT_CONFIGURED");
  var submittedAt = new Date();
  var submissionId = generateId_("CERT");
  var fileName = safeFileName_(payload.fileName || submissionId + ".pdf");
  var mimeType = text_(payload.fileMimeType) || mimeTypeFromName_(fileName);
  var file = DriveApp.getFolderById(folderId).createFile(base64Blob_(fileBase64, mimeType, fileName));
  var row = {};
  row[CERTIFICATE.ID] = submissionId;
  row[CERTIFICATE.TRAINING_ID] = trainingId;
  row[CERTIFICATE.TRAINING_TITLE] = normalizedTraining.title;
  row[CERTIFICATE.STAFF_ID] = staffId;
  row[CERTIFICATE.STAFF_NAME] = text_(staff[STAFF.NAME]);
  row[CERTIFICATE.DEPARTMENT] = text_(staff[STAFF.DEPARTMENT]);
  row[CERTIFICATE.SUBMITTED_AT] = submittedAt;
  row[CERTIFICATE.COMPLETED_DATE] = text_(payload.completedDate);
  row[CERTIFICATE.ISSUER] = text_(payload.issuer);
  row[CERTIFICATE.CERTIFICATE_NUMBER] = text_(payload.certificateNumber);
  row[CERTIFICATE.FILE_URL] = file.getUrl();
  row[CERTIFICATE.FILE_ID] = file.getId();
  row[CERTIFICATE.STATUS] = "승인대기";
  row[CERTIFICATE.REVIEWER] = "";
  row[CERTIFICATE.NOTE] = "";
  appendRowByHeader(SHEETS.CERTIFICATES, row);
  return successResponse({
    submissionId: submissionId,
    trainingId: trainingId,
    trainingTitle: normalizedTraining.title,
    staffId: staffId,
    staffName: text_(staff[STAFF.NAME]),
    department: text_(staff[STAFF.DEPARTMENT]),
    submittedAt: normalizeDateTime_(submittedAt),
    fileUrl: file.getUrl(),
    fileId: file.getId(),
    status: "승인대기"
  });
}

function getMyTrainingStatus(payload) {
  var staffId = requireText_(payload.staffId, "교직원ID가 필요합니다.", "MISSING_STAFF_ID");
  var staff = findByColumn_(SHEETS.STAFF, STAFF.ID, staffId);
  if (!staff || !isActiveStaff_(staff)) return errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND");
  return buildMyTrainingStatus_(staff);
}

function getMyTrainingStatusByNameDept(payload) {
  var staffResult = findStaffByNameDept_(payload.name, payload.department);
  if (!staffResult.ok) return staffResult.response;
  return buildMyTrainingStatus_(staffResult.row);
}

function getTrainingAttendanceStatus(payload) {
  var trainingId = requireText_(payload.trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var training = findTraining_(trainingId);
  if (!training) return errorResponse("교육 정보를 찾을 수 없습니다.", "TRAINING_NOT_FOUND");
  var normalizedTraining = normalizeTraining_(training);
  var targets = readTable(SHEETS.TARGETS, [TARGET.TRAINING_ID, TARGET.STAFF_ID]).filter(function (row) {
    return text_(row[TARGET.TRAINING_ID]) === trainingId && isTargetRow_(row);
  });
  var staffRows = readTable(SHEETS.STAFF, [STAFF.ID, STAFF.NAME]);
  var attendances = readTableOptional_(SHEETS.ATTENDANCE);
  var signatures = readTableOptional_(SHEETS.SIGNATURES);
  var items = targets.map(function (target) {
    var staff = findInRows_(staffRows, STAFF.ID, target[STAFF.ID] || target[TARGET.STAFF_ID]);
    var staffId = text_(target[TARGET.STAFF_ID]);
    var attendance = findInRows2_(attendances, ATTENDANCE.TRAINING_ID, trainingId, ATTENDANCE.STAFF_ID, staffId);
    var signature = findInRows2_(signatures, SIGNATURE.TRAINING_ID, trainingId, SIGNATURE.STAFF_ID, staffId);
    var signatureRequired = normalizedTraining.signatureRequired && !normalizeBoolean(target[TARGET.SIGNATURE_EXCLUDED]);
    var statusGroup = !attendance ? "absent" : signatureRequired && !signature ? "signature" : "completed";
    return {
      trainingId: trainingId,
      staffId: staffId,
      name: staff ? text_(staff[STAFF.NAME]) : "",
      department: staff ? text_(staff[STAFF.DEPARTMENT]) : "",
      position: staff ? text_(staff[STAFF.POSITION]) : "",
      isTarget: true,
      required: normalizeBoolean(target[TARGET.REQUIRED]),
      attendanceCompleted: Boolean(attendance),
      attendedAt: attendance ? normalizeDateTime_(attendance[ATTENDANCE.ATTENDED_AT]) : "",
      signatureRequired: signatureRequired,
      signatureCompleted: signatureRequired ? Boolean(signature) : false,
      signedAt: signature ? normalizeDateTime_(signature[SIGNATURE.SIGNED_AT]) : "",
      finalStatus: statusGroup === "completed" ? "완료" : statusGroup === "signature" ? "서명 필요" : "미출석",
      statusGroup: statusGroup
    };
  });
  return successResponse({
    training: normalizedTraining,
    summary: {
      targetCount: items.length,
      attendanceCompleted: items.filter(function (item) { return item.attendanceCompleted; }).length,
      signatureCompleted: items.filter(function (item) { return item.signatureCompleted; }).length,
      incomplete: items.filter(function (item) { return item.statusGroup !== "completed"; }).length
    },
    items: items
  });
}

function getFinalAttendancePreview(payload) {
  return buildFinalAttendance_(payload.trainingId, false);
}

function generateFinalAttendanceSheet(payload) {
  return buildFinalAttendance_(payload.trainingId, true);
}

function getNotices() {
  var rows = readTableOptional_(SHEETS.NOTICES);
  return successResponse(rows.map(function (row) {
    return {
      noticeId: text_(row["공지ID"] || row["noticeId"]),
      title: text_(row["제목"] || row["title"]),
      content: text_(row["내용"] || row["content"]),
      status: text_(row["상태"] || row["활성상태"] || row["status"]),
      postedAt: normalizeDate_(row["게시일"] || row["postedAt"]),
      note: text_(row["비고"] || row["note"])
    };
  }).filter(function (item) {
    return !item.status || isActiveStatus_(item.status);
  }));
}

function getDepartments() {
  var rows = readTableOptional_(SHEETS.DEPARTMENTS);
  return successResponse(rows.map(function (row) {
    return {
      departmentId: text_(row["부서ID"] || row["departmentId"]),
      name: text_(row["부서명"] || row["부서"] || row["name"]),
      ownerName: text_(row["담당자"] || row["ownerName"]),
      status: text_(row["상태"] || row["활성상태"] || row["status"]),
      note: text_(row["비고"] || row["note"])
    };
  }));
}

function getCodeValues() {
  var rows = readTableOptional_(SHEETS.CODE_VALUES);
  return successResponse(rows.map(function (row) {
    return {
      group: text_(row["코드그룹"] || row["group"]),
      code: text_(row["코드"] || row["code"]),
      label: text_(row["표시명"] || row["label"] || row["값"]),
      value: text_(row["값"] || row["value"]),
      sortOrder: Number(row["정렬순서"] || row["sortOrder"] || 0),
      active: row["활성여부"] === undefined ? true : normalizeBoolean(row["활성여부"])
    };
  }));
}

function getAdminDashboardData() {
  var trainings = readTableOptional_(SHEETS.TRAININGS).map(normalizeTraining_);
  var attendance = readTableOptional_(SHEETS.ATTENDANCE);
  var signatures = readTableOptional_(SHEETS.SIGNATURES);
  return successResponse({
    trainings: trainings.length,
    activeTrainings: trainings.filter(function (training) { return isActiveStatus_(training.status); }).length,
    attendanceRecords: attendance.length,
    signatureRecords: signatures.length
  });
}

function buildMyTrainingStatus_(staff) {
  var staffId = text_(staff[STAFF.ID]);
  var targets = readTable(SHEETS.TARGETS, [TARGET.TRAINING_ID, TARGET.STAFF_ID]).filter(function (row) {
    return text_(row[TARGET.STAFF_ID]) === staffId && isTargetRow_(row);
  });
  var trainings = readTable(SHEETS.TRAININGS, [TRAINING.ID, TRAINING.TITLE]);
  var attendances = readTableOptional_(SHEETS.ATTENDANCE);
  var signatures = readTableOptional_(SHEETS.SIGNATURES);
  var certificates = readTableOptional_(SHEETS.CERTIFICATES);
  var items = targets.map(function (target) {
    var training = findInRows_(trainings, TRAINING.ID, target[TARGET.TRAINING_ID]);
    if (!training) return null;
    var normalized = normalizeTraining_(training);
    var attendance = findInRows2_(attendances, ATTENDANCE.TRAINING_ID, normalized.trainingId, ATTENDANCE.STAFF_ID, staffId);
    var signatureRequired = normalized.signatureRequired && !normalizeBoolean(target[TARGET.SIGNATURE_EXCLUDED]);
    var signature = findInRows2_(signatures, SIGNATURE.TRAINING_ID, normalized.trainingId, SIGNATURE.STAFF_ID, staffId);
    var certificate = findCertificate_(normalized.trainingId, staffId, certificates);
    var final = completionStatus_({
      attendanceCompleted: !normalized.qrEnabled || Boolean(attendance),
      signatureRequired: signatureRequired,
      signatureCompleted: Boolean(signature),
      certificateRequired: normalized.certificateRequired,
      certificateSubmitted: Boolean(certificate),
      certificateApproved: certificate ? isApprovedCertificate_(certificate) : false
    });
    return {
      trainingId: normalized.trainingId,
      title: normalized.title,
      date: normalized.date,
      time: normalized.time,
      place: normalized.place,
      department: normalized.department,
      required: normalizeBoolean(target[TARGET.REQUIRED]),
      attendanceRequired: normalized.qrEnabled,
      attendanceCompleted: Boolean(attendance),
      signatureRequired: signatureRequired,
      signatureCompleted: signatureRequired ? Boolean(signature) : false,
      certificateRequired: normalized.certificateRequired,
      certificateSubmitted: Boolean(certificate),
      certificateApproved: certificate ? isApprovedCertificate_(certificate) : false,
      finalStatus: final.label,
      statusGroup: final.group,
      attendedAt: attendance ? normalizeDateTime_(attendance[ATTENDANCE.ATTENDED_AT]) : "",
      signedAt: signature ? normalizeDateTime_(signature[SIGNATURE.SIGNED_AT]) : "",
      certificateSubmittedAt: certificate ? normalizeDateTime_(certificate[CERTIFICATE.SUBMITTED_AT]) : ""
    };
  }).filter(Boolean).sort(function (a, b) {
    return statusPriority_(a.statusGroup) - statusPriority_(b.statusGroup) || String(a.date).localeCompare(String(b.date));
  });
  return successResponse({
    staff: publicStaff_(staff),
    summary: {
      total: items.length,
      completed: items.filter(function (item) { return item.statusGroup === "completed"; }).length,
      certificateSubmitted: items.filter(function (item) { return item.certificateRequired && item.certificateSubmitted; }).length,
      certificateMissing: items.filter(function (item) { return item.certificateRequired && !item.certificateSubmitted; }).length,
      incomplete: items.filter(function (item) { return item.statusGroup === "incomplete"; }).length,
      review: items.filter(function (item) { return item.statusGroup === "review"; }).length
    },
    items: items
  });
}

function buildFinalAttendance_(trainingId, writeRows) {
  trainingId = requireText_(trainingId, "교육ID가 필요합니다.", "MISSING_TRAINING_ID");
  var status = JSON.parse(getTrainingAttendanceStatus({ trainingId: trainingId }).getContent());
  if (!status.ok) return jsonOutput_(status);
  var training = status.data.training;
  var signatures = readTableOptional_(SHEETS.SIGNATURES);
  var rows = status.data.items.map(function (item, index) {
    var signature = findInRows2_(signatures, SIGNATURE.TRAINING_ID, trainingId, SIGNATURE.STAFF_ID, item.staffId);
    var completion = item.statusGroup === "completed" ? "이수완료" : item.statusGroup === "signature" ? "서명필요" : "미이수";
    return {
      sequence: index + 1,
      trainingId: trainingId,
      trainingTitle: training.title,
      trainingDate: training.date,
      staffId: item.staffId,
      name: item.name,
      department: item.department,
      position: item.position,
      attendedAt: item.attendedAt,
      signatureStatus: item.signatureRequired ? (item.signatureCompleted ? "완료" : "필요") : "불필요",
      signatureFileUrl: signature ? text_(signature[SIGNATURE.FILE_URL]) : "",
      completionStatus: completion,
      note: ""
    };
  });
  if (writeRows) {
    rows.forEach(function (item) {
      var row = {};
      row[FINAL.SEQUENCE] = item.sequence;
      row[FINAL.TRAINING_ID] = item.trainingId;
      row[FINAL.TRAINING_TITLE] = item.trainingTitle;
      row[FINAL.TRAINING_DATE] = item.trainingDate;
      row[FINAL.STAFF_NAME] = item.name;
      row[FINAL.DEPARTMENT] = item.department;
      row[FINAL.POSITION] = item.position;
      row[FINAL.ATTENDED_AT] = item.attendedAt;
      row[FINAL.SIGNATURE_STATUS] = item.signatureStatus;
      row[FINAL.SIGNATURE_FILE_URL] = item.signatureFileUrl;
      row[FINAL.COMPLETION_STATUS] = item.completionStatus;
      row[FINAL.NOTE] = item.note;
      appendRowByHeader(SHEETS.FINAL_ROSTER, row);
    });
  }
  return successResponse({
    training: training,
    summary: {
      targetCount: rows.length,
      completed: rows.filter(function (row) { return row.completionStatus === "이수완료"; }).length,
      signatureRequired: rows.filter(function (row) { return row.completionStatus === "서명필요"; }).length,
      incomplete: rows.filter(function (row) { return row.completionStatus === "미이수"; }).length
    },
    rows: rows,
    status: writeRows ? "generated" : "preview",
    generatedAt: writeRows ? normalizeDateTime_(new Date()) : "",
    writtenCount: writeRows ? rows.length : 0
  });
}

function getSheetByName(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw appError_("필수 시트 `" + name + "`을 찾을 수 없습니다.", "SHEET_NOT_FOUND");
  }
  return sheet;
}

function findHeaderRow(sheet, requiredColumns) {
  var values = sheet.getDataRange().getValues();
  var required = requiredColumns || [];
  for (var rowIndex = 0; rowIndex < Math.min(values.length, 30); rowIndex += 1) {
    var headers = values[rowIndex].map(function (cell) { return text_(cell); });
    var ok = required.every(function (column) {
      return headers.some(function (header) { return sameHeader_(header, column); });
    });
    if (ok) return { index: rowIndex, headers: headers, values: values };
  }
  throw appError_("`" + sheet.getName() + "` 시트의 헤더 행을 찾을 수 없습니다.", "HEADER_ROW_NOT_FOUND");
}

function readTable(sheetName, requiredColumns) {
  var sheet = getSheetByName(sheetName);
  var table = findHeaderRow(sheet, requiredColumns || []);
  var missing = (requiredColumns || []).filter(function (column) {
    return !table.headers.some(function (header) { return sameHeader_(header, column); });
  });
  if (missing.length) {
    throw appError_("`" + sheetName + "` 시트에 필수 컬럼이 없습니다: " + missing.join(", "), "REQUIRED_COLUMNS_MISSING");
  }
  return table.values.slice(table.index + 1).filter(function (row) {
    return row.some(function (cell) { return cell !== ""; });
  }).map(function (row) {
    var item = {};
    table.headers.forEach(function (header, index) {
      if (header) item[canonicalHeader_(header)] = normalizeCell_(row[index]);
    });
    return item;
  }).filter(function (row) {
    return !isExampleRow_(row);
  });
}

function readTableOptional_(sheetName) {
  try {
    return readTable(sheetName, []);
  } catch (error) {
    return [];
  }
}

function appendRowByHeader(sheetName, rowObject) {
  var sheet = getSheetByName(sheetName);
  var table = findHeaderRow(sheet, requiredHeaders_(sheetName));
  var row = table.headers.map(function (header) {
    return valueForHeader_(rowObject, header);
  });
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function successResponse(data) {
  return jsonOutput_({ ok: true, data: data });
}

function errorResponse(message, code) {
  return jsonOutput_({ ok: false, message: message, code: code || "ERROR" });
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function normalizeBoolean(value) {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;
  var normalized = String(value).trim().toLowerCase();
  return ["y", "yes", "true", "1", "사용", "사용함", "활성", "대상", "필수", "필요", "재직", "완료", "제출", "승인"].indexOf(normalized) !== -1;
}

function normalizeDate(value) {
  return normalizeDate_(value);
}

function normalizeTime(value) {
  return normalizeTime_(value);
}

function normalizeDate_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value).trim();
}

function normalizeTime_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "HH:mm");
  }
  return String(value).trim();
}

function normalizeDateTime_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }
  return String(value).trim();
}

function aliases_() {
  var aliases = {};
  aliases[CONFIG.KEY] = ["설정항목", "항목", "key", "Key"];
  aliases[CONFIG.VALUE] = ["값", "value", "Value"];
  aliases[TRAINING.PLACE] = ["교육장소", "장소", "location", "place"];
  aliases[TRAINING.QR_ENABLED] = ["QR 사용 여부", "QR사용", "qrEnabled"];
  aliases[TRAINING.SIGNATURE_REQUIRED] = ["전자서명 필요 여부", "서명필요여부", "signatureRequired"];
  aliases[TRAINING.CERTIFICATE_REQUIRED] = ["이수증 제출 필요 여부", "이수증필요여부", "certificateRequired"];
  aliases[TRAINING.STATUS] = ["상태", "활성", "activeStatus", "status"];
  aliases[STAFF.ID] = ["교직원ID", "직원ID", "staffId"];
  aliases[STAFF.DEPARTMENT] = ["소속부서", "담당부서", "department"];
  aliases[STAFF.STATUS] = ["상태", "재직상태", "employmentStatus"];
  aliases[TARGET.IS_TARGET] = ["대상", "대상여부", "isTarget"];
  aliases[TARGET.REQUIRED] = ["필수", "필수여부", "required"];
  aliases[TARGET.SIGNATURE_EXCLUDED] = ["서명제외", "서명제외여부", "signatureExcluded"];
  aliases[CERTIFICATE.ID] = ["이수증ID", "제출ID", "certificateId", "submissionId"];
  aliases[CERTIFICATE.STATUS] = ["제출상태", "승인상태", "처리상태", "status"];
  aliases[CERTIFICATE.FILE_ID] = ["파일ID", "이수증파일ID", "certificateFileId"];
  aliases[FINAL.SIGNATURE_FILE_URL] = ["서명파일URL", "전자서명파일URL"];
  return aliases;
}

function sameHeader_(a, b) {
  var left = normalizeHeader_(a);
  var right = normalizeHeader_(b);
  if (left === right) return true;
  return (aliases_()[b] || []).map(normalizeHeader_).indexOf(left) !== -1 ||
    (aliases_()[a] || []).map(normalizeHeader_).indexOf(right) !== -1;
}

function canonicalHeader_(header) {
  var normalized = normalizeHeader_(header);
  var aliases = aliases_();
  var keys = Object.keys(aliases);
  for (var i = 0; i < keys.length; i += 1) {
    if (sameHeader_(normalized, keys[i])) return keys[i];
  }
  return text_(header);
}

function normalizeHeader_(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function normalizeCell_(value) {
  return typeof value === "string" ? value.trim() : value;
}

function requiredHeaders_(sheetName) {
  if (sheetName === SHEETS.CONFIG) return [CONFIG.KEY, CONFIG.VALUE];
  if (sheetName === SHEETS.TRAININGS) return [TRAINING.ID, TRAINING.TITLE, TRAINING.STATUS];
  if (sheetName === SHEETS.STAFF) return [STAFF.ID, STAFF.NAME];
  if (sheetName === SHEETS.TARGETS) return [TARGET.TRAINING_ID, TARGET.STAFF_ID];
  if (sheetName === SHEETS.ATTENDANCE) return [ATTENDANCE.ID, ATTENDANCE.TRAINING_ID, ATTENDANCE.STAFF_ID];
  if (sheetName === SHEETS.SIGNATURES) return [SIGNATURE.ID, SIGNATURE.TRAINING_ID, SIGNATURE.STAFF_ID];
  if (sheetName === SHEETS.CERTIFICATES) return [CERTIFICATE.TRAINING_ID, CERTIFICATE.STAFF_ID];
  if (sheetName === SHEETS.FINAL_ROSTER) return [FINAL.SEQUENCE, FINAL.TRAINING_ID, FINAL.STAFF_NAME];
  return [];
}

function valueForHeader_(rowObject, header) {
  var canonical = canonicalHeader_(header);
  if (rowObject[header] !== undefined) return rowObject[header];
  if (rowObject[canonical] !== undefined) return rowObject[canonical];
  var alias = aliases_()[canonical] || [];
  for (var i = 0; i < alias.length; i += 1) {
    if (rowObject[alias[i]] !== undefined) return rowObject[alias[i]];
  }
  return "";
}

function getConfigMap_() {
  var rows = readTable(SHEETS.CONFIG, [CONFIG.KEY, CONFIG.VALUE]);
  var config = {};
  rows.forEach(function (row) {
    var key = text_(row[CONFIG.KEY] || row.key || row.Key);
    var value = row[CONFIG.VALUE] !== undefined ? row[CONFIG.VALUE] : row.value;
    if (key) config[key] = value;
  });
  return config;
}

function configValue_(config, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    if (config[keys[i]] !== undefined && config[keys[i]] !== "") return config[keys[i]];
  }
  return "";
}

function publicSchoolConfig_(config) {
  return {
    schoolName: text_(configValue_(config, ["schoolName", "학교명"])),
    centerName: text_(configValue_(config, ["centerName", "교육센터명", "센터명"])) || "학교 교직원 교육센터",
    logoUrl: text_(configValue_(config, ["logoUrl", "schoolLogoUrl", "학교로고URL", "로고URL"])),
    schoolLogoUrl: text_(configValue_(config, ["logoUrl", "schoolLogoUrl", "학교로고URL", "로고URL"])),
    primaryColor: text_(configValue_(config, ["primaryColor", "메인컬러", "기본색상"])) || "#1F2A44",
    secondaryColor: text_(configValue_(config, ["secondaryColor", "보조컬러", "보조색상"])) || "#EEF4FF",
    ownerDepartment: text_(configValue_(config, ["ownerDepartment", "담당부서명", "담당부서"])),
    ownerName: text_(configValue_(config, ["ownerName", "담당자명", "담당자"])),
    ownerContact: text_(configValue_(config, ["ownerContact", "담당자연락처", "연락처"])),
    departmentName: text_(configValue_(config, ["ownerDepartment", "담당부서명", "담당부서"])),
    managerName: text_(configValue_(config, ["ownerName", "담당자명", "담당자"])),
    managerContact: text_(configValue_(config, ["ownerContact", "담당자연락처", "연락처"])),
    signatureFolderId: text_(configValue_(config, ["signatureFolderId", "전자서명 저장 폴더 ID", "전자서명저장폴더ID"])),
    certificateFolderId: text_(configValue_(config, ["certificateFolderId", "이수증 저장 폴더 ID", "이수증저장폴더ID"])),
    finalRosterFolderId: text_(configValue_(config, ["finalRosterFolderId", "최종 서명부 저장 폴더 ID", "최종서명부저장폴더ID"])),
    activeSemester: text_(configValue_(config, ["activeSemester", "운영학기", "학기"])),
    privacyNotice: text_(configValue_(config, ["privacyNotice", "개인정보 안내문", "개인정보안내문"]))
  };
}

function normalizeTraining_(row) {
  var place = text_(row[TRAINING.PLACE]);
  var status = text_(row[TRAINING.STATUS]);
  return {
    trainingId: text_(row[TRAINING.ID]),
    title: text_(row[TRAINING.TITLE]),
    date: normalizeDate_(row[TRAINING.DATE]),
    time: normalizeTime_(row[TRAINING.TIME]),
    place: place,
    location: place,
    department: text_(row[TRAINING.DEPARTMENT]),
    category: text_(row[TRAINING.CATEGORY]),
    qrEnabled: normalizeBoolean(row[TRAINING.QR_ENABLED]),
    signatureRequired: normalizeBoolean(row[TRAINING.SIGNATURE_REQUIRED]),
    certificateRequired: normalizeBoolean(row[TRAINING.CERTIFICATE_REQUIRED]),
    status: status,
    activeStatus: status,
    folderMode: text_(row[TRAINING.FOLDER_MODE]),
    driveFolderId: text_(row[TRAINING.DRIVE_FOLDER_ID]),
    signatureFolderId: text_(row[TRAINING.SIGNATURE_FOLDER_ID]),
    certificateFolderId: text_(row[TRAINING.CERTIFICATE_FOLDER_ID]),
    finalRosterFolderId: text_(row[TRAINING.FINAL_ROSTER_FOLDER_ID]),
    note: text_(row[TRAINING.NOTE])
  };
}

function publicStaff_(row) {
  return {
    staffId: text_(row[STAFF.ID]),
    name: text_(row[STAFF.NAME]),
    department: text_(row[STAFF.DEPARTMENT]),
    position: text_(row[STAFF.POSITION])
  };
}

function adminStaff_(row) {
  return {
    staffId: text_(row[STAFF.ID]),
    name: text_(row[STAFF.NAME]),
    department: text_(row[STAFF.DEPARTMENT]),
    position: text_(row[STAFF.POSITION]),
    authCode: "",
    employmentStatus: text_(row[STAFF.STATUS]) || "재직",
    role: text_(row[STAFF.ROLE]) || "교직원",
    note: text_(row[STAFF.NOTE])
  };
}

function findStaffByNameDept_(name, department) {
  name = text_(name);
  department = text_(department);
  if (!name) return { ok: false, response: errorResponse("성명을 입력해 주세요.", "MISSING_STAFF_NAME") };
  var matchesByName = readTable(SHEETS.STAFF, [STAFF.ID, STAFF.NAME]).filter(function (row) {
    return isActiveStaff_(row) && text_(row[STAFF.NAME]) === name;
  });
  if (!matchesByName.length) return { ok: false, response: errorResponse("교직원 정보를 찾을 수 없습니다.", "STAFF_NOT_FOUND") };
  var matches = department ? matchesByName.filter(function (row) { return text_(row[STAFF.DEPARTMENT]) === department; }) : matchesByName;
  if (!matches.length) return { ok: false, response: errorResponse("성명과 소속부서를 확인해 주세요.", "STAFF_NOT_FOUND") };
  if (matches.length > 1) return { ok: false, response: errorResponse("동명이인이 있습니다. 소속부서를 입력해 주세요.", "DUPLICATE_STAFF_NAME") };
  return { ok: true, row: matches[0] };
}

function findTraining_(trainingId) {
  return findByColumn_(SHEETS.TRAININGS, TRAINING.ID, trainingId);
}

function findTarget_(trainingId, staffId) {
  return readTable(SHEETS.TARGETS, [TARGET.TRAINING_ID, TARGET.STAFF_ID]).filter(function (row) {
    return text_(row[TARGET.TRAINING_ID]) === text_(trainingId) &&
      text_(row[TARGET.STAFF_ID]) === text_(staffId) &&
      isTargetRow_(row);
  })[0] || null;
}

function findAttendance_(trainingId, staffId) {
  return findInRows2_(readTableOptional_(SHEETS.ATTENDANCE), ATTENDANCE.TRAINING_ID, trainingId, ATTENDANCE.STAFF_ID, staffId);
}

function findSignature_(trainingId, staffId) {
  return findInRows2_(readTableOptional_(SHEETS.SIGNATURES), SIGNATURE.TRAINING_ID, trainingId, SIGNATURE.STAFF_ID, staffId);
}

function findCertificate_(trainingId, staffId, certificates) {
  return findInRows2_(certificates || readTableOptional_(SHEETS.CERTIFICATES), CERTIFICATE.TRAINING_ID, trainingId, CERTIFICATE.STAFF_ID, staffId);
}

function findByColumn_(sheetName, column, value) {
  return findInRows_(readTable(sheetName, [column]), column, value);
}

function findInRows_(rows, column, value) {
  var expected = text_(value);
  return rows.filter(function (row) { return text_(row[column]) === expected; })[0] || null;
}

function findInRows2_(rows, columnA, valueA, columnB, valueB) {
  var a = text_(valueA);
  var b = text_(valueB);
  return rows.filter(function (row) { return text_(row[columnA]) === a && text_(row[columnB]) === b; })[0] || null;
}

function updateRowByKey_(sheetName, keyColumn, keyValue, updates, normalizer) {
  var sheet = getSheetByName(sheetName);
  var table = findHeaderRow(sheet, [keyColumn]);
  var keyIndex = headerIndex_(table.headers, keyColumn);
  for (var rowIndex = table.index + 1; rowIndex < table.values.length; rowIndex += 1) {
    if (text_(table.values[rowIndex][keyIndex]) !== text_(keyValue)) continue;
    Object.keys(updates).forEach(function (column) {
      var columnIndex = headerIndex_(table.headers, column);
      if (columnIndex !== -1) sheet.getRange(rowIndex + 1, columnIndex + 1).setValue(updates[column]);
    });
    var updated = {};
    table.headers.forEach(function (header, index) {
      if (!header) return;
      var canonical = canonicalHeader_(header);
      updated[canonical] = updates[canonical] !== undefined ? updates[canonical] : table.values[rowIndex][index];
    });
    return normalizer ? normalizer(updated) : updated;
  }
  return null;
}

function headerIndex_(headers, column) {
  for (var i = 0; i < headers.length; i += 1) {
    if (sameHeader_(headers[i], column)) return i;
  }
  return -1;
}

function upsertConfigRows_(items) {
  var sheet = getSheetByName(SHEETS.CONFIG);
  var table = findHeaderRow(sheet, [CONFIG.KEY, CONFIG.VALUE]);
  var keyIndex = headerIndex_(table.headers, CONFIG.KEY);
  var valueIndex = headerIndex_(table.headers, CONFIG.VALUE);
  items.forEach(function (item) {
    for (var rowIndex = table.index + 1; rowIndex < table.values.length; rowIndex += 1) {
      if (text_(table.values[rowIndex][keyIndex]) === item.key) {
        sheet.getRange(rowIndex + 1, valueIndex + 1).setValue(item.value);
        return;
      }
    }
    var row = {};
    row[CONFIG.KEY] = item.key;
    row[CONFIG.VALUE] = item.value;
    appendRowByHeader(SHEETS.CONFIG, row);
  });
}

function isActiveTraining_(row) {
  return isActiveStatus_(row[TRAINING.STATUS]);
}

function isActiveStaff_(row) {
  return isActiveStatus_(row[STAFF.STATUS] || "재직");
}

function isActiveStatus_(status) {
  var normalized = text_(status).toLowerCase();
  return !normalized || normalized === "활성" || normalized === "active" || normalized === "재직" || normalized === "y" || normalized === "사용";
}

function isTargetRow_(row) {
  return row[TARGET.IS_TARGET] === undefined || row[TARGET.IS_TARGET] === "" || normalizeBoolean(row[TARGET.IS_TARGET]);
}

function isApprovedCertificate_(certificate) {
  var status = text_(certificate[CERTIFICATE.STATUS]);
  return ["승인", "승인완료", "확인완료", "완료"].indexOf(status) !== -1;
}

function completionStatus_(state) {
  if (!state.attendanceCompleted) return { label: "미이수", group: "incomplete" };
  if (state.signatureRequired && !state.signatureCompleted) return { label: "확인필요", group: "review" };
  if (state.certificateRequired) {
    if (state.certificateApproved) return { label: "이수완료", group: "completed" };
    if (state.certificateSubmitted) return { label: "확인필요", group: "review" };
    return { label: "확인필요", group: "review" };
  }
  return { label: "이수완료", group: "completed" };
}

function statusPriority_(group) {
  if (group === "incomplete") return 0;
  if (group === "review") return 1;
  return 2;
}

function groupByDate_(items) {
  var grouped = {};
  items.forEach(function (item) {
    var date = item.date || "날짜 미입력";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  });
  return Object.keys(grouped).sort().map(function (date) {
    return { date: date, items: grouped[date] };
  });
}

function compareSignatureItems_(a, b) {
  return String(a.date).localeCompare(String(b.date)) || String(a.time).localeCompare(String(b.time));
}

function signatureFolderId_(training) {
  var config = getConfigMap_();
  return text_(training.signatureFolderId || training.driveFolderId || configValue_(config, ["signatureFolderId", "전자서명 저장 폴더 ID", "전자서명저장폴더ID"]));
}

function certificateFolderId_(training) {
  var config = getConfigMap_();
  return text_(training.certificateFolderId || training.driveFolderId || configValue_(config, ["certificateFolderId", "이수증 저장 폴더 ID", "이수증저장폴더ID"]));
}

function base64Blob_(value, mimeType, fileName) {
  var text = String(value || "").trim();
  var base64 = text.indexOf(",") !== -1 ? text.split(",").pop() : text;
  return Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
}

function safeFileName_(name) {
  return String(name || "file").replace(/[\\/:*?"<>|]/g, "_");
}

function mimeTypeFromName_(fileName) {
  var ext = String(fileName || "").split(".").pop().toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  return "application/octet-stream";
}

function normalizeIdList_(value) {
  var list = Array.isArray(value) ? value : [value];
  var seen = {};
  return list.map(text_).filter(Boolean).filter(function (item) {
    if (seen[item]) return false;
    seen[item] = true;
    return true;
  });
}

function generateTrainingId_() {
  var config = getConfigMap_();
  var semester = text_(configValue_(config, ["activeSemester", "운영학기", "학기"]));
  var yearMatch = semester.match(/20\d{2}/);
  var year = yearMatch ? yearMatch[0] : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy");
  var rows = readTableOptional_(SHEETS.TRAININGS);
  var max = 0;
  rows.forEach(function (row) {
    var match = text_(row[TRAINING.ID]).match(new RegExp("^TRN-" + year + "-(\\d+)$"));
    if (match) max = Math.max(max, Number(match[1]) || 0);
  });
  return "TRN-" + year + "-" + String(max + 1).padStart(3, "0");
}

function generateStaffId_() {
  var rows = readTableOptional_(SHEETS.STAFF);
  var max = 0;
  rows.forEach(function (row) {
    var match = text_(row[STAFF.ID]).match(/^STF-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]) || 0);
  });
  return "STF-" + String(max + 1).padStart(4, "0");
}

function generateId_(prefix) {
  return prefix + "-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") + "-" + Utilities.getUuid().slice(0, 8);
}

function unique_(items) {
  var seen = {};
  return items.filter(function (item) {
    if (seen[item]) return false;
    seen[item] = true;
    return true;
  });
}

function map_(key, value) {
  var obj = {};
  obj[key] = value;
  return obj;
}

function copyIfDefined_(target, source, sourceKey, targetKey) {
  if (source[sourceKey] !== undefined) target[targetKey] = text_(source[sourceKey]);
}

function text_(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function yn_(value) {
  return normalizeBoolean(value) ? "Y" : "N";
}

function requireText_(value, message, code) {
  var text = text_(value);
  if (!text) throw appError_(message, code);
  return text;
}

function appError_(message, code) {
  var error = new Error(message);
  error.userMessage = message;
  error.code = code;
  return error;
}

function isExampleRow_(row) {
  var joined = Object.keys(row).map(function (key) { return text_(row[key]); }).join(" ");
  return /예시|샘플|sample|YOUR_|YOUR DEPLOYMENT ID/i.test(joined) && !/(TRN|STF|ATT|SIG|CERT)-/i.test(joined);
}
