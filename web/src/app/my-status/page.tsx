"use client";

import { getMyTrainingStatus, loadAppConfig, verifyStaff } from "@/lib/apps-script";
import type { AppConfig, MyTrainingStatusItem, MyTrainingStatusResult, Staff } from "@/lib/types";
import { useMemo, useState, type FormEvent } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

type PageStep = "ready" | "checking" | "loaded";

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function statusClassName(item: MyTrainingStatusItem) {
  return `status-chip status-${item.statusGroup}`;
}

function statusMeta(item: MyTrainingStatusItem) {
  return [item.date, item.time, item.place, item.department].filter(Boolean).join(" · ");
}

function statusDetail(item: MyTrainingStatusItem) {
  const details = [
    item.required ? "필수" : "선택",
    item.attendanceCompleted ? "출석 완료" : "출석 미완료",
    item.signatureRequired ? (item.signatureCompleted ? "서명 완료" : "서명 필요") : "서명 없음",
    item.certificateRequired ? (item.certificateSubmitted ? "이수증 제출" : "이수증 필요") : "이수증 없음"
  ];

  return details;
}

export default function MyStatusPage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [staffName, setStaffName] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [staff, setStaff] = useState<Staff>();
  const [statusResult, setStatusResult] = useState<MyTrainingStatusResult>();
  const [step, setStep] = useState<PageStep>("ready");
  const [message, setMessage] = useState("성명과 인증코드를 입력해 본인 이수현황을 확인해 주세요.");

  const canSubmit = useMemo(
    () => Boolean(staffName.trim() && authCode.trim() && step !== "checking"),
    [authCode, staffName, step]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("checking");
    setStaff(undefined);
    setStatusResult(undefined);
    setMessage("본인 정보를 확인하고 있습니다.");

    const configResult = runtimeConfig ? { ok: true as const, config: runtimeConfig } : await loadAppConfig();

    if (!configResult.ok) {
      setStep("ready");
      setMessage(configResult.message);
      return;
    }

    setRuntimeConfig(configResult.config);

    const staffResult = await verifyStaff(configResult.config, staffName.trim(), authCode.trim());

    if (staffResult.error || !staffResult.data) {
      setStep("ready");
      setMessage("성명 또는 인증코드를 확인해 주세요.");
      return;
    }

    const status = await getMyTrainingStatus(configResult.config, staffResult.data.staffId);

    if (status.error || !status.data) {
      setStep("ready");
      setMessage(status.error || "내 이수현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setStaff(staffResult.data);
    setStatusResult(status.data);
    setStep("loaded");
    setMessage("본인 이수현황을 불러왔습니다.");
  }

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
          <button className="ghost-button" onClick={() => window.history.back()} type="button">
            뒤로가기
          </button>
        </div>

        <section className="today-card" aria-label="내 이수현황">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>내 이수현황</span>
            </div>
            <h1>교육 대상과 이수 상태를 확인합니다.</h1>
            <p>본인 인증 후 대상 교육의 출석, 전자서명, 이수증 제출 상태를 확인할 수 있습니다.</p>
          </div>
        </section>

        {message ? (
          <div className="soft-alert" role={step === "loaded" ? "status" : "alert"}>
            {message}
          </div>
        ) : null}

        <section className="training-section" aria-label="본인 인증">
          <div className="section-head">
            <div>
              <h2>본인 인증</h2>
              <p>교직원명단의 성명과 인증코드로 본인 정보만 조회합니다.</p>
            </div>
          </div>

          <form className="attendance-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span>성명</span>
              <input autoComplete="name" onChange={(event) => setStaffName(event.target.value)} placeholder="예: 홍길동" type="text" value={staffName} />
            </label>

            <label className="field-group">
              <span>인증코드</span>
              <input autoComplete="off" onChange={(event) => setAuthCode(event.target.value)} placeholder="인증코드 입력" type="password" value={authCode} />
            </label>

            <button className="primary-action" disabled={!canSubmit} type="submit">
              {step === "checking" ? "조회 중" : "내 이수현황 조회"}
            </button>
          </form>
        </section>

        {staff && statusResult ? (
          <>
            <section className="training-section" aria-label="교직원 정보">
              <div className="section-head">
                <div>
                  <h2>교직원 정보</h2>
                  <p>
                    {staff.name} · {staff.department || "부서 미입력"}
                  </p>
                </div>
                <div className="badge-row">
                  <span>{staff.staffId}</span>
                  {staff.position ? <span>{staff.position}</span> : null}
                </div>
              </div>
            </section>

            <section className="status-summary-grid" aria-label="이수현황 요약">
              <div className="status-summary-card">
                <span>전체 대상 교육</span>
                <strong>{statusResult.summary.total}</strong>
              </div>
              <div className="status-summary-card">
                <span>이수완료</span>
                <strong>{statusResult.summary.completed}</strong>
              </div>
              <div className="status-summary-card">
                <span>미이수</span>
                <strong>{statusResult.summary.incomplete}</strong>
              </div>
              <div className="status-summary-card">
                <span>확인필요</span>
                <strong>{statusResult.summary.review}</strong>
              </div>
            </section>

            <section className="training-section" aria-label="교육별 이수현황">
              <div className="section-head">
                <div>
                  <h2>교육별 상태</h2>
                  <p>미이수와 확인필요 항목을 먼저 표시합니다.</p>
                </div>
              </div>

              {statusResult.items.length ? (
                <div className="status-list">
                  {statusResult.items.map((item) => (
                    <article className="training-card status-card" key={item.trainingId}>
                      <div className="status-card-head">
                        <div>
                          <strong>{item.title || item.trainingId}</strong>
                          <p>{statusMeta(item) || item.trainingId}</p>
                        </div>
                        <span className={statusClassName(item)}>{item.finalStatus}</span>
                      </div>

                      <div className="badge-row">
                        {statusDetail(item).map((detail) => (
                          <span key={detail}>{detail}</span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="soft-alert" role="status">
                  현재 대상 교육이 없습니다.
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
