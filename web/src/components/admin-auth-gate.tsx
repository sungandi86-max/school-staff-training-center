"use client";

import { loadAppConfig, verifyAdminCode } from "@/lib/apps-script";
import type { AppConfig } from "@/lib/types";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

const APP_BASE_PATH = "/school-staff-training-center";
const ADMIN_SESSION_KEY = "school-health-hub-admin-verified";

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function clearAdminSession() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function AdminLogoutButton() {
  function handleLogout() {
    clearAdminSession();
    window.location.reload();
  }

  return (
    <button className="ghost-button" onClick={handleLogout} type="button">
      인증 해제
    </button>
  );
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [adminCode, setAdminCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("관리자 기능은 학교 담당자만 사용할 수 있습니다.");
  const [messageTone, setMessageTone] = useState<"info" | "error">("info");

  useEffect(() => {
    async function loadRuntimeConfig() {
      const stored = window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
      setAuthenticated(stored);

      const result = await loadAppConfig();
      if (!result.ok) {
        setMessage(result.message);
        setMessageTone("error");
        setLoading(false);
        return;
      }

      setRuntimeConfig(result.config);
      setLoading(false);
    }

    void loadRuntimeConfig();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!runtimeConfig) {
      setMessage("app-config.json의 Apps Script URL을 먼저 확인해주세요.");
      setMessageTone("error");
      return;
    }

    setChecking(true);
    setMessage("관리자 코드를 확인하는 중입니다.");
    setMessageTone("info");

    const result = await verifyAdminCode(runtimeConfig, adminCode);
    setChecking(false);

    if (result.error || !result.data?.verified) {
      setMessage("관리자 코드가 일치하지 않습니다.");
      setMessageTone("error");
      setAdminCode("");
      return;
    }

    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    setAuthenticated(true);
    setAdminCode("");
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">관리자 인증</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
        </div>

        <section className="today-card" aria-label="관리자 인증">
          <div className="today-copy">
            <div className="section-kicker">
              <ShieldIcon />
              <span>관리자 인증</span>
            </div>
            <h1>관리자 코드를 입력해주세요.</h1>
            <p>관리자 기능은 학교 담당자만 사용할 수 있습니다.</p>
          </div>
        </section>

        <section className="training-section" aria-label="관리자 코드 입력">
          <div className="section-head">
            <div>
              <h2>관리자 코드</h2>
              <p>00_학교설정 탭의 adminCode 값과 비교합니다. 코드는 이 브라우저에 저장되지 않습니다.</p>
            </div>
          </div>

          {message ? <div className={messageTone === "error" ? "soft-alert danger" : "soft-alert"}>{loading ? "설정을 불러오는 중입니다." : message}</div> : null}

          <form className="attendance-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span>관리자 코드</span>
              <input autoComplete="current-password" disabled={loading || checking} onChange={(event) => setAdminCode(event.target.value)} type="password" value={adminCode} />
            </label>
            <button className="primary-action" disabled={loading || checking || !adminCode.trim()} type="submit">
              {checking ? "확인 중" : "관리자 화면 열기"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
