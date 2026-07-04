"use client";

import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";
import { getSchoolConfig, loadAppConfig, updateSchoolConfig } from "@/lib/apps-script";
import type { AppConfig, SchoolConfig } from "@/lib/types";
import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

type SettingsForm = {
  schoolName: string;
  centerName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  ownerDepartment: string;
  ownerName: string;
  ownerContact: string;
  signatureFolderId: string;
  certificateFolderId: string;
  finalRosterFolderId: string;
  privacyNotice: string;
  adminCode: string;
  activeSemester: string;
};

const emptyForm: SettingsForm = {
  schoolName: "",
  centerName: "",
  logoUrl: "",
  primaryColor: "#1F2A44",
  secondaryColor: "#EEF4FF",
  ownerDepartment: "",
  ownerName: "",
  ownerContact: "",
  signatureFolderId: "",
  certificateFolderId: "",
  finalRosterFolderId: "",
  privacyNotice: "",
  adminCode: "",
  activeSemester: ""
};

function formFromSchoolConfig(config: SchoolConfig): SettingsForm {
  return {
    schoolName: config.schoolName ?? "",
    centerName: config.centerName ?? "",
    logoUrl: config.logoUrl ?? config.schoolLogoUrl ?? config.schoolLogo ?? "",
    primaryColor: config.primaryColor || "#1F2A44",
    secondaryColor: config.secondaryColor || "#EEF4FF",
    ownerDepartment: config.ownerDepartment ?? config.departmentName ?? "",
    ownerName: config.ownerName ?? config.managerName ?? "",
    ownerContact: config.ownerContact ?? config.managerContact ?? "",
    signatureFolderId: config.signatureFolderId ?? "",
    certificateFolderId: config.certificateFolderId ?? "",
    finalRosterFolderId: config.finalRosterFolderId ?? "",
    privacyNotice: config.privacyNotice ?? "",
    adminCode: config.adminCode ?? "",
    activeSemester: config.activeSemester ?? ""
  };
}

function payloadFromForm(form: SettingsForm): Partial<SchoolConfig> {
  const payload: Partial<SchoolConfig> = {
    schoolName: form.schoolName,
    centerName: form.centerName,
    logoUrl: form.logoUrl,
    primaryColor: form.primaryColor,
    secondaryColor: form.secondaryColor,
    ownerDepartment: form.ownerDepartment,
    ownerName: form.ownerName,
    ownerContact: form.ownerContact,
    signatureFolderId: form.signatureFolderId,
    certificateFolderId: form.certificateFolderId,
    finalRosterFolderId: form.finalRosterFolderId,
    privacyNotice: form.privacyNotice,
    activeSemester: form.activeSemester
  };

  if (form.adminCode.trim()) {
    payload.adminCode = form.adminCode.trim();
  }

  return payload;
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Field({
  help,
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  help?: string;
  label: string;
  name: keyof SettingsForm;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <input name={name} onChange={onChange} placeholder={placeholder} type={type} value={value} />
      {help ? <small className="field-help">{help}</small> : null}
    </label>
  );
}

export default function AdminSettingsPage() {
  const [appConfig, setAppConfig] = useState<AppConfig>();
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("학교설정을 불러오는 중입니다.");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">("info");

  const previewStyle = useMemo(
    () =>
      ({
        "--school-primary": form.primaryColor || "#1F2A44",
        "--primary": form.primaryColor || "#1F2A44",
        "--surface-soft": form.secondaryColor || "#EEF4FF"
      }) as CSSProperties,
    [form.primaryColor, form.secondaryColor]
  );

  useEffect(() => {
    async function loadSettings() {
      const runtime = await loadAppConfig();

      if (!runtime.ok) {
        setMessage(runtime.message);
        setMessageTone("error");
        setForm(formFromSchoolConfig(runtime.schoolConfig));
        setLoading(false);
        return;
      }

      setAppConfig(runtime.config);
      const result = await getSchoolConfig(runtime.config);
      setForm(formFromSchoolConfig(result.data));
      setMessage(result.error ? result.error : "현재 학교설정을 불러왔습니다.");
      setMessageTone(result.error ? "error" : "success");
      setLoading(false);
    }

    void loadSettings();
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!appConfig) {
      setMessage("app-config.json의 Apps Script URL을 먼저 확인해주세요.");
      setMessageTone("error");
      return;
    }

    setSaving(true);
    setMessage("학교설정을 저장하는 중입니다.");
    setMessageTone("info");

    const result = await updateSchoolConfig(appConfig, payloadFromForm(form));
    setSaving(false);

    if (result.error || !result.data) {
      setMessage(result.error || "학교설정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
      setMessageTone("error");
      return;
    }

    setForm(formFromSchoolConfig(result.data));
    setMessage("학교설정을 저장했습니다. 홈 화면을 새로 열면 변경된 학교명과 색상이 반영됩니다.");
    setMessageTone("success");
  }

  return (
    <AdminAuthGate>
      <main className="page" style={previewStyle}>
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">설정 관리</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/admin/`}>
            관리자 메뉴로
          </a>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
          <AdminLogoutButton />
        </div>

        <section className="today-card" aria-label="설정 관리">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>설정 관리</span>
            </div>
            <h1>학교 운영 설정을 관리합니다.</h1>
            <p>저장한 값은 Google Sheet의 00_학교설정 탭에만 기록되며 GitHub Pages에는 저장되지 않습니다.</p>
          </div>
        </section>

        {message ? (
          <div className={messageTone === "error" ? "soft-alert danger" : messageTone === "success" ? "soft-alert success" : "soft-alert"} role="status">
            {message}
          </div>
        ) : null}

        <form className="settings-form" onSubmit={handleSubmit}>
          <section className="training-section" aria-label="기본 정보">
            <div className="section-head">
              <div>
                <h2>기본 정보</h2>
                <p>홈 화면과 문서에 표시되는 학교명과 교육센터명을 관리합니다.</p>
              </div>
            </div>
            <div className="settings-grid">
              <Field label="학교명" name="schoolName" onChange={handleChange} value={form.schoolName} />
              <Field label="교육센터명" name="centerName" onChange={handleChange} value={form.centerName} />
              <Field label="운영학기" name="activeSemester" onChange={handleChange} placeholder="2026학년도 1학기" value={form.activeSemester} />
            </div>
          </section>

          <section className="training-section" aria-label="브랜드">
            <div className="section-head">
              <div>
                <h2>브랜드</h2>
                <p>로고 URL과 화면에 적용할 대표 색상을 관리합니다.</p>
              </div>
            </div>
            <div className="settings-grid">
              <Field label="학교 로고 URL" name="logoUrl" onChange={handleChange} placeholder="https://..." type="url" value={form.logoUrl} />
              <Field label="메인 컬러" name="primaryColor" onChange={handleChange} type="color" value={form.primaryColor} />
              <Field label="보조 컬러" name="secondaryColor" onChange={handleChange} type="color" value={form.secondaryColor} />
            </div>
          </section>

          <section className="training-section" aria-label="담당자">
            <div className="section-head">
              <div>
                <h2>담당자</h2>
                <p>학교 담당 부서와 담당자 연락 정보를 관리합니다.</p>
              </div>
            </div>
            <div className="settings-grid">
              <Field label="담당부서" name="ownerDepartment" onChange={handleChange} value={form.ownerDepartment} />
              <Field label="담당자명" name="ownerName" onChange={handleChange} value={form.ownerName} />
              <Field label="담당자 연락처" name="ownerContact" onChange={handleChange} value={form.ownerContact} />
            </div>
          </section>

          <section className="training-section" aria-label="저장 폴더">
            <div className="section-head">
              <div>
                <h2>저장 폴더</h2>
                <p>전자서명, 이수증, 최종 서명부 파일이 저장될 학교 Google Drive 폴더 ID입니다.</p>
              </div>
            </div>
            <div className="settings-grid">
              <Field help="서명 PNG 파일이 저장되는 Drive 폴더 ID입니다." label="전자서명 저장 폴더 ID" name="signatureFolderId" onChange={handleChange} value={form.signatureFolderId} />
              <Field help="이수증 파일 저장 기능을 연결할 때 사용할 Drive 폴더 ID입니다." label="이수증 저장 폴더 ID" name="certificateFolderId" onChange={handleChange} value={form.certificateFolderId} />
              <Field help="최종 서명부 산출물이 저장될 Drive 폴더 ID입니다." label="최종 서명부 저장 폴더 ID" name="finalRosterFolderId" onChange={handleChange} value={form.finalRosterFolderId} />
            </div>
          </section>

          <section className="training-section" aria-label="개인정보 안내">
            <div className="section-head">
              <div>
                <h2>개인정보 안내</h2>
                <p>출석과 전자서명 화면에서 안내할 개인정보 처리 문구입니다.</p>
              </div>
            </div>
            <label className="field-group">
              <span>개인정보 안내문</span>
              <textarea name="privacyNotice" onChange={handleChange} rows={5} value={form.privacyNotice} />
            </label>
          </section>

          <section className="training-section" aria-label="운영 설정">
            <div className="section-head">
              <div>
                <h2>운영 설정</h2>
                <p>관리자 화면 접근과 운영 구분에 필요한 설정입니다.</p>
              </div>
            </div>
            <div className="settings-grid">
              <Field help="기존 코드는 화면에 표시하지 않습니다. 새 코드를 입력한 경우에만 변경됩니다." label="관리자코드" name="adminCode" onChange={handleChange} type="password" value={form.adminCode} />
            </div>
          </section>

          <div className="settings-actions">
            <button className="primary-action" disabled={loading || saving} type="submit">
              {saving ? "저장 중" : "설정 저장"}
            </button>
          </div>
        </form>
      </div>
      </main>
    </AdminAuthGate>
  );
}
