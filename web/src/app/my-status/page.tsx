"use client";

import { getMyTrainingStatusByNameDept, loadAppConfig } from "@/lib/apps-script";
import type { AppConfig, MyTrainingStatusItem, MyTrainingStatusResult } from "@/lib/types";
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

function joinDetails(values: Array<string | undefined>) {
  return values.filter(Boolean).join(" · ");
}

function trainingMeta(item: MyTrainingStatusItem) {
  return joinDetails([item.date, item.time, item.place, item.department]);
}

function signatureLabel(item: MyTrainingStatusItem) {
  if (!item.signatureRequired) {
    return "해당 없음";
  }

  return item.signatureCompleted ? "서명완료" : "서명필요";
}

function certificateLabel(item: MyTrainingStatusItem) {
  if (!item.certificateRequired) {
    return "해당 없음";
  }

  return item.certificateSubmitted ? "제출완료" : "미제출";
}

function certificateMissingCount(result: MyTrainingStatusResult) {
  return result.summary.certificateMissing ?? result.items.filter((item) => item.certificateRequired && !item.certificateSubmitted).length;
}

export default function MyStatusPage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [staffName, setStaffName] = useState("");
  const [department, setDepartment] = useState("");
  const [statusResult, setStatusResult] = useState<MyTrainingStatusResult>();
  const [step, setStep] = useState<PageStep>("ready");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => Boolean(staffName.trim() && step !== "checking"), [staffName, step]);
  const missingCertificates = statusResult ? certificateMissingCount(statusResult) : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!staffName.trim()) {
      setMessage("성명을 입력해 주세요.");
      return;
    }

    setStep("checking");
    setStatusResult(undefined);
    setMessage("교직원 정보를 확인하고 있습니다.");

    const configResult = runtimeConfig ? { ok: true as const, config: runtimeConfig } : await loadAppConfig();

    if (!configResult.ok) {
      setStep("ready");
      setMessage(configResult.message);
      return;
    }

    setRuntimeConfig(configResult.config);

    const status = await getMyTrainingStatusByNameDept(configResult.config, staffName.trim(), department.trim());

    if (status.error || !status.data) {
      setStep("ready");
      setMessage(status.error || "내 이수현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setStatusResult(status.data);
    setStep("loaded");
    setMessage("");
  }

  function resetLookup() {
    setStatusResult(undefined);
    setStep("ready");
    setMessage("");
  }

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">내 이수현황</span>
          <button className="ghost-button" onClick={() => window.history.back()} type="button">
            뒤로가기
          </button>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
          {statusResult ? (
            <button className="ghost-button" onClick={resetLookup} type="button">
              다시 조회
            </button>
          ) : null}
        </div>

        <section className="today-card" aria-label="내 이수현황">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>내 이수현황</span>
            </div>
            <h1>내 이수현황</h1>
            <p>본인 확인 후 교육별 이수 내역과 이수증 제출 상태를 확인합니다.</p>
          </div>
        </section>

        {!statusResult ? (
          <section className="training-section" aria-label="성명으로 교직원 조회">
            <div className="section-head">
              <div>
                <span className="section-kicker">내 이수 확인</span>
                <h2>성명으로 교직원 조회</h2>
                <p>조회된 교직원 정보가 QR 출석, 이수증 제출, 내 이수현황에 동일하게 사용됩니다.</p>
              </div>
            </div>

            {message ? (
              <div className="soft-alert" role="alert">
                {message}
              </div>
            ) : null}

            <form className="attendance-form" onSubmit={handleSubmit}>
              <label className="field-group">
                <span>성명 *</span>
                <input autoComplete="name" onChange={(event) => setStaffName(event.target.value)} placeholder="예: 박숙현" type="text" value={staffName} />
              </label>

              <label className="field-group">
                <span>소속부서</span>
                <input autoComplete="organization" onChange={(event) => setDepartment(event.target.value)} placeholder="동명이인일 때 입력" type="text" value={department} />
              </label>

              <div className="route-actions">
                <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
                  닫기
                </a>
                <button className="primary-action" disabled={!canSubmit} type="submit">
                  {step === "checking" ? "조회 중" : "조회하기"}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <>
            {missingCertificates > 0 ? (
              <div className="soft-alert" role="status">
                이수증 미제출 교육이 있습니다. 이수증을 제출해 주세요.
              </div>
            ) : null}

            <section className="training-section" aria-label="교직원 정보">
              <div className="section-head">
                <div>
                  <h2>{statusResult.staff.name}</h2>
                  <p>{joinDetails([statusResult.staff.department, statusResult.staff.position]) || "교직원 정보"}</p>
                </div>
                <div className="badge-row">
                  <span>{statusResult.staff.staffId}</span>
                </div>
              </div>
            </section>

            <section className="status-summary-grid" aria-label="이수현황 요약">
              <div className="status-summary-card">
                <span>총 교육 수</span>
                <strong>{statusResult.summary.total}</strong>
              </div>
              <div className="status-summary-card">
                <span>이수 완료</span>
                <strong>{statusResult.summary.completed}</strong>
              </div>
              <div className="status-summary-card">
                <span>이수증 제출 완료</span>
                <strong>{statusResult.summary.certificateSubmitted ?? 0}</strong>
              </div>
              <div className="status-summary-card">
                <span>이수증 미제출</span>
                <strong>{missingCertificates}</strong>
              </div>
            </section>

            <section className="training-section" aria-label="교육별 이수 내역">
              <div className="section-head">
                <div>
                  <h2>교육별 이수 내역</h2>
                  <p>미이수 또는 확인필요 항목을 먼저 표시합니다.</p>
                </div>
              </div>

              {statusResult.items.length ? (
                <div className="status-list">
                  {statusResult.items.map((item) => (
                    <article className="training-card status-card" key={item.trainingId}>
                      <div className="status-card-head">
                        <div>
                          <strong>{item.title || item.trainingId}</strong>
                          <p>{trainingMeta(item) || item.trainingId}</p>
                        </div>
                        <span className={statusClassName(item)}>{item.finalStatus}</span>
                      </div>

                      <div className="badge-row">
                        <span>출석 {item.attendanceCompleted ? "완료" : "미완료"}</span>
                        <span>전자서명 {signatureLabel(item)}</span>
                        <span>이수증 {certificateLabel(item)}</span>
                      </div>

                      <div className="status-list">
                        <p>출석일시: {item.attendedAt || "-"}</p>
                        {item.signedAt ? <p>서명일시: {item.signedAt}</p> : null}
                        {item.certificateSubmittedAt ? <p>제출일시: {item.certificateSubmittedAt}</p> : null}
                      </div>

                      {item.certificateRequired ? (
                        <div className="route-actions">
                          <a className={item.certificateSubmitted ? "ghost-button" : "primary-action"} href={`${APP_BASE_PATH}/certificate`}>
                            {item.certificateSubmitted ? "이수증 보기" : "이수증 제출하기"}
                          </a>
                        </div>
                      ) : null}
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
        )}
      </div>
    </main>
  );
}
