export type SchoolConfig = {
  schoolName: string;
  centerName: string;
  schoolLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  departmentName?: string;
  managerName?: string;
  managerContact?: string;
  privacyNotice?: string;
};

export type Training = {
  trainingId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  department: string;
  category: string;
  qrEnabled: boolean;
  signatureRequired: boolean;
  activeStatus: string;
};

export type AppsScriptEnvelope<T> = {
  ok?: boolean;
  data?: T;
  message?: string;
  error?: string;
};
