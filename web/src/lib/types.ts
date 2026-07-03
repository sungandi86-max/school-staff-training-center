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

export type AppsScriptEnvelope<T> = {
  ok?: boolean;
  data?: T;
  message?: string;
  error?: string;
};
