export type SchoolConfig = {
  schoolName: string;
  centerName: string;
  schoolLogo?: string;
  schoolLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  departmentName?: string;
  managerName?: string;
  managerContact?: string;
  privacyNotice?: string;
};

export type AppConfig = {
  schoolName: string;
  centerName?: string;
  schoolLogo?: string;
  theme?:
    | "default"
    | {
        primaryColor?: string;
        secondaryColor?: string;
      };
  appsScriptUrl: string;
};

export type Training = {
  trainingId: string;
  title: string;
  date: string;
  time: string;
  place?: string;
  location: string;
  department: string;
  category: string;
  qrEnabled: boolean;
  signatureRequired: boolean;
  certificateRequired?: boolean;
  status?: string;
  activeStatus: string;
};

export type Staff = {
  staffId: string;
  name: string;
  department: string;
  position?: string;
};

export type TrainingTargetResult = {
  isTarget: boolean;
  signatureExcluded?: boolean;
  required?: boolean;
};

export type DuplicateAttendanceResult = {
  duplicate: boolean;
  attendanceId?: string;
  attendedAt?: string;
  processStatus?: string;
};

export type SaveAttendanceResult = {
  attendanceId: string;
  trainingId: string;
  trainingTitle?: string;
  attendedAt: string;
  duplicate: boolean;
  processStatus: string;
  signatureRequired?: boolean;
  status: "saved" | "already";
};

export type SignatureExistsResult = {
  exists: boolean;
  signatureId?: string;
  signedAt?: string;
  fileUrl?: string;
  fileId?: string;
  saveStatus?: string;
};

export type SaveSignatureResult = {
  status: "saved" | "already";
  duplicate: boolean;
  signatureId: string;
  trainingId: string;
  trainingTitle?: string;
  staffId: string;
  staffName?: string;
  department?: string;
  signedAt: string;
  fileUrl?: string;
  fileId?: string;
  saveStatus: string;
};

export type MyTrainingStatusGroup = "completed" | "incomplete" | "review";

export type MyTrainingStatusItem = {
  trainingId: string;
  title: string;
  date: string;
  time: string;
  place: string;
  department: string;
  required: boolean;
  attendanceRequired: boolean;
  attendanceCompleted: boolean;
  signatureRequired: boolean;
  signatureCompleted: boolean;
  certificateRequired: boolean;
  certificateSubmitted: boolean;
  certificateApproved?: boolean;
  finalStatus: "이수완료" | "미이수" | "확인필요";
  statusGroup: MyTrainingStatusGroup;
  attendedAt?: string;
  signedAt?: string;
  certificateSubmittedAt?: string;
};

export type MyTrainingStatusSummary = {
  total: number;
  completed: number;
  incomplete: number;
  review: number;
};

export type MyTrainingStatusResult = {
  staff: Staff;
  summary: MyTrainingStatusSummary;
  items: MyTrainingStatusItem[];
};

export type AdminAttendanceStatusGroup = "completed" | "signature" | "absent";

export type AdminAttendanceStatusItem = {
  trainingId: string;
  staffId: string;
  name: string;
  department: string;
  position: string;
  isTarget: boolean;
  required: boolean;
  attendanceCompleted: boolean;
  attendedAt?: string;
  signatureRequired: boolean;
  signatureCompleted: boolean;
  signedAt?: string;
  finalStatus: "완료" | "서명 필요" | "미출석";
  statusGroup: AdminAttendanceStatusGroup;
};

export type AdminAttendanceStatusSummary = {
  targetCount: number;
  attendanceCompleted: number;
  signatureCompleted: number;
  incomplete: number;
};

export type AdminAttendanceStatusResult = {
  training: Training;
  summary: AdminAttendanceStatusSummary;
  items: AdminAttendanceStatusItem[];
};

export type FinalAttendanceRow = {
  sequence: number;
  trainingId: string;
  trainingTitle: string;
  trainingDate: string;
  staffId?: string;
  name: string;
  department: string;
  position: string;
  attendedAt: string;
  signatureStatus: "완료" | "필요" | "불필요";
  signatureFileUrl: string;
  completionStatus: "이수완료" | "서명필요" | "미이수";
  note?: string;
};

export type FinalAttendanceSummary = {
  targetCount: number;
  completed: number;
  signatureRequired: number;
  incomplete: number;
};

export type FinalAttendancePreviewResult = {
  training: Training;
  summary: FinalAttendanceSummary;
  rows: FinalAttendanceRow[];
};

export type FinalAttendanceGenerateResult = FinalAttendancePreviewResult & {
  status: "generated";
  generatedAt: string;
  writtenCount: number;
};

export type SetupFolderCheck = {
  key: "signatureFolderId" | "finalRosterFolderId" | "certificateFolderId";
  label: string;
  configured: boolean;
};

export type SetupSheetCheck = {
  key: string;
  label: string;
  name: string;
  exists: boolean;
};

export type SetupValidationResult = {
  ok: boolean;
  schoolConfig: {
    schoolName?: string;
    centerName?: string;
  };
  folders: SetupFolderCheck[];
  sheets: SetupSheetCheck[];
  training: {
    totalCount: number;
    activeCount: number;
  };
};

export type AppsScriptEnvelope<T> = {
  ok?: boolean;
  data?: T;
  message?: string;
  error?: string;
};
