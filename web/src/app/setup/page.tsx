"use client";

import { getSchoolConfig, getTrainingList, validateSetup } from "@/lib/apps-script";
import type { AppConfig, SchoolConfig, SetupValidationResult, Training } from "@/lib/types";
import { useMemo, useState, type FormEvent } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

type CheckState = "idle" | "success" | "warning" | "error";

const STEPS = ["학교 기본정보", "Apps Script 연결", "Google Drive 폴더", "허브 시트 점검", "테스트"];

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function setupConfig(form: {
  schoolName: string;
  centerName: string;
  schoolLogo: string;
  primaryColor: string;
  appsScriptUrl: string;
}): AppConfig {
  return {
    schoolName: form.schoolName.trim() || "학교명 미설정",
    centerName: form.centerName.trim() || "학교 교직원 교육센터",
    schoolLogo: form.schoolLogo.trim(),
    theme: {
      primaryColor: form.primaryColor.trim() || "#1F2A44",
      secondaryColor: "#EEF4FF"
    },
    appsScriptUrl: form.appsScriptUrl.trim()
  };
}

function statusLabel(state: CheckState) {
  if (state === "success") {
    return "성공";
  }

  if (state === "warning") {
    return "확인필요";
  }

  if (state === "error") {
    return "오류";
  }

  return "대기";
}

export default function SetupPage() {
  const [step, setStep] = useState(0);
  const [schoolName, setSchoolName] = useState("학교명 미설정");
  const [centerName, setCenterName] = useState("학교 교직원 교육센터");
  const [schoolLogo, setSchoolLogo] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1F2A44");
  const [appsScriptUrl, setAppsScriptUrl] = useState("");
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>();
  const [setupStatus, setSetupStatus] = useState<SetupValidationResult>();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [connectionState, setConnectionState] = useState<CheckState>("idle");
  const [testState, setTestState] = useState<CheckState>("idle");
  const [message, setMessage] = useState("학교 기본정보를 입력해 주세요.");

  const config = useMemo(
    () => setupConfig({ schoolName, centerName, schoolLogo, primaryColor, appsScriptUrl }),
    [appsScriptUrl, centerName, primaryColor, schoolLogo, schoolName]
  );
  const appConfigJson = useMemo(() => JSON.stringify(config, null, 2), [config]);
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  function handleBasicInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("기본정보를 저장했습니다. Apps Script URL을 입력하고 연결을 테스트해 주세요.");
    setStep(1);
  }

  async function handleConnectionTest() {
    if (!config.appsScriptUrl) {
      setConnectionState("error");
      setMessage("Apps Script URL을 입력해 주세요.");
      return;
    }

    setConnectionState("idle");
    setMessage("Apps Script 연결을 테스트하는 중입니다.");
    const result = await getSchoolConfig(config);

    if (result.error) {
      setConnectionState("error");
      setMessage(result.error);
      return;
    }

    setSchoolConfig(result.data);
    setConnectionState("success");
    setMessage("Apps Script 연결에 성공했습니다.");
    setStep(2);
  }

  async function handleSetupValidation(nextStep: number) {
    if (!config.appsScriptUrl) {
      setMessage("Apps Script URL을 먼저 입력해 주세요.");
      setConnectionState("error");
      setStep(1);
      return;
    }

    setMessage("설치 상태를 점검하는 중입니다.");
    const result = await validateSetup(config);

    if (result.error || !result.data) {
      setMessage(result.error || "설치 상태를 점검하지 못했습니다.");
      return;
    }

    setSetupStatus(result.data);
    const hasMissing = !result.data.ok;
    setMessage(hasMissing ? "일부 설정이 누락되었습니다. 표시된 항목을 확인해 주세요." : "필수 설정 점검이 완료되었습니다.");
    setStep(nextStep);
  }

  async function handleFinalTest() {
    if (!config.appsScriptUrl) {
      setMessage("Apps Script URL을 먼저 입력해 주세요.");
      setStep(1);
      return;
    }

    setTestState("idle");
    setMessage("교육목록과 학교 표시 정보를 확인하는 중입니다.");

    const [trainingResult, configResult] = await Promise.all([getTrainingList(config), getSchoolConfig(config)]);

    if (trainingResult.error || configResult.error) {
      setTestState("error");
      setMessage(trainingResult.error || configResult.error || "테스트에 실패했습니다.");
      return;
    }

    setTrainings(trainingResult.data);
    setSchoolConfig(configResult.data);
    const activeCount = trainingResult.data.filter((training) => (training.status ?? training.activeStatus ?? "").trim() === "활성").length;
    setTestState(activeCount > 0 ? "success" : "warning");
    setMessage(activeCount > 0 ? "설치 점검이 완료되었습니다. 이제 홈으로 이동해 사용할 수 있습니다." : "교육목록은 연결되었지만 활성 교육이 없습니다.");
  }

  async function handleCopyConfig() {
    await navigator.clipboard.writeText(appConfigJson);
    setMessage("app-config.json 내용을 복사했습니다. web/public/app-config.json에 반영해 주세요.");
  }

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
        </div>

        <section className="today-card" aria-label="설치 마법사">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>설치 마법사</span>
            </div>
            <h1>5분 안에 학교 설정을 점검합니다.</h1>
            <p>Google Sheet와 Apps Script를 준비한 뒤 연결, 폴더, 시트, 교육목록을 순서대로 확인합니다.</p>
          </div>
        </section>

        <section className="setup-progress" aria-label="설치 진행률">
          <div className="setup-progress-bar">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="setup-steps">
            {STEPS.map((label, index) => (
              <button className={index === step ? "setup-step active" : "setup-step"} key={label} onClick={() => setStep(index)} type="button">
                <span>{index + 1}</span>
                {label}
              </button>
            ))}
          </div>
        </section>

        {message ? (
          <div className="soft-alert" role="status">
            {message}
          </div>
        ) : null}

        {step === 0 ? (
          <section className="training-section" aria-label="학교 기본정보">
            <div className="section-head">
              <div>
                <h2>학교 기본정보</h2>
                <p>이 값은 app-config.json에 들어갈 표시 설정입니다.</p>
              </div>
            </div>
            <form className="attendance-form" onSubmit={handleBasicInfo}>
              <label className="field-group">
                <span>학교명</span>
                <input onChange={(event) => setSchoolName(event.target.value)} type="text" value={schoolName} />
              </label>
              <label className="field-group">
                <span>교육센터명</span>
                <input onChange={(event) => setCenterName(event.target.value)} type="text" value={centerName} />
              </label>
              <label className="field-group">
                <span>학교 로고(URL)</span>
                <input onChange={(event) => setSchoolLogo(event.target.value)} placeholder="https://..." type="url" value={schoolLogo} />
              </label>
              <label className="field-group">
                <span>메인 컬러</span>
                <input onChange={(event) => setPrimaryColor(event.target.value)} type="color" value={primaryColor} />
              </label>
              <button className="primary-action" type="submit">
                저장
              </button>
            </form>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="training-section" aria-label="Apps Script 연결">
            <div className="section-head">
              <div>
                <h2>Apps Script 연결</h2>
                <p>배포된 웹앱 URL을 입력하고 getSchoolConfig 호출을 테스트합니다.</p>
              </div>
              <span className={`setup-state setup-${connectionState}`}>{statusLabel(connectionState)}</span>
            </div>
            <label className="field-group">
              <span>Apps Script URL</span>
              <input onChange={(event) => setAppsScriptUrl(event.target.value)} placeholder="https://script.google.com/macros/s/.../exec" type="url" value={appsScriptUrl} />
            </label>
            {schoolConfig ? (
              <div className="setup-status-card success">
                <strong>{schoolConfig.schoolName || config.schoolName}</strong>
                <p>{schoolConfig.centerName || config.centerName}</p>
              </div>
            ) : null}
            <button className="primary-action" onClick={handleConnectionTest} type="button">
              연결 테스트
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="training-section" aria-label="Google Drive 폴더 확인">
            <div className="section-head">
              <div>
                <h2>Google Drive 폴더 확인</h2>
                <p>전자서명, 최종 서명부, 이수증 저장 폴더 ID 설정 여부를 확인합니다.</p>
              </div>
              <button className="ghost-button" onClick={() => void handleSetupValidation(2)} type="button">
                다시 점검
              </button>
            </div>
            <div className="setup-check-grid">
              {(setupStatus?.folders ?? []).map((folder) => (
                <div className={folder.configured ? "setup-status-card success" : "setup-status-card warning"} key={folder.key}>
                  <strong>{folder.label}</strong>
                  <p>{folder.configured ? "설정됨" : "누락됨"}</p>
                </div>
              ))}
            </div>
            {!setupStatus ? (
              <button className="primary-action" onClick={() => void handleSetupValidation(2)} type="button">
                폴더 설정 확인
              </button>
            ) : (
              <button className="primary-action" onClick={() => setStep(3)} type="button">
                다음
              </button>
            )}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="training-section" aria-label="허브 시트 점검">
            <div className="section-head">
              <div>
                <h2>허브 시트 점검</h2>
                <p>필수 시트 탭이 모두 있는지 확인합니다.</p>
              </div>
              <button className="ghost-button" onClick={() => void handleSetupValidation(3)} type="button">
                다시 점검
              </button>
            </div>
            <div className="setup-check-grid">
              {(setupStatus?.sheets ?? []).map((sheet) => (
                <div className={sheet.exists ? "setup-status-card success" : "setup-status-card error"} key={sheet.key}>
                  <strong>{sheet.label}</strong>
                  <p>{sheet.exists ? sheet.name : "시트 없음"}</p>
                </div>
              ))}
            </div>
            <button className="primary-action" onClick={() => setStep(4)} type="button">
              테스트로 이동
            </button>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="training-section" aria-label="테스트">
            <div className="section-head">
              <div>
                <h2>테스트</h2>
                <p>교육목록 조회, 학교명 표시, 활성 교육 여부를 마지막으로 확인합니다.</p>
              </div>
              <span className={`setup-state setup-${testState}`}>{statusLabel(testState)}</span>
            </div>
            <div className="setup-check-grid">
              <div className="setup-status-card">
                <strong>학교명 표시</strong>
                <p>{schoolConfig?.schoolName || config.schoolName}</p>
              </div>
              <div className={(setupStatus?.training.activeCount ?? trainings.length) > 0 ? "setup-status-card success" : "setup-status-card warning"}>
                <strong>활성 교육</strong>
                <p>{setupStatus?.training.activeCount ?? trainings.length}건</p>
              </div>
              <div className="setup-status-card">
                <strong>app-config.json</strong>
                <p>설정 JSON을 복사해 web/public/app-config.json에 반영하세요.</p>
              </div>
            </div>
            <pre className="setup-config-preview">{appConfigJson}</pre>
            <div className="route-actions">
              <button className="ghost-button" onClick={() => void handleCopyConfig()} type="button">
                설정 JSON 복사
              </button>
              <button className="primary-action" onClick={handleFinalTest} type="button">
                최종 테스트
              </button>
              {testState === "success" ? (
                <a className="primary-action" href={`${APP_BASE_PATH}/`}>
                  설정 완료 후 홈으로
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
