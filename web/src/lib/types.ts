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

export type AppsScriptEnvelope<T> = {
  ok?: boolean;
  data?: T;
  message?: string;
  error?: string;
};
