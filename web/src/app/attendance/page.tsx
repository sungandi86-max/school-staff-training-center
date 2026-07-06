"use client";

import {
  checkDuplicateAttendance,
  checkTrainingTarget,
  getStaffByNameDept,
  getTrainingDetail,
  loadAppConfig,
  saveQrAttendance
} from "@/lib/apps-script";
import { getBasePath } from "@/lib/paths";
import type { AppConfig, DuplicateAttendanceResult, SaveAttendanceResult, Staff, Training, TrainingTargetResult } from "@/lib/types";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type AttendanceStep = "loading" | "scan-guide" | "ready" | "submitting" | "complete" | "blocked";

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <rect height="6" rx="1.4" width="6" x="4" y="4" />
      <rect height="6" rx="1.4" width="6" x="14" y="4" />
      <rect height="6" rx="1.4" width="6" x="4" y="14" />
      <path d="M15 15h2v2h-2z" />
      <path d="M20 15v5h-5" />
      <path d="M20 20h-2" />
    </svg>
  );
}

function getTrainingIdFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("trainingId")?.trim() ?? "";
}

function pageHref(path: string) {
  const basePath = getBasePath();
  return path === "/" ? `${basePath}/` : `${basePath}${path}`;
}

function signatureUrl(trainingId: string, staffId: string) {
  return `${pageHref("/signature")}?${new URLSearchParams({ trainingId, staffId }).toString()}`;
}

function isActiveTraining(training?: Training) {
  const status = (training?.status ?? training?.activeStatus ?? "").trim().toLowerCase();
  return ["활성", "진행중", "준비중", "active", "ready", "y", "yes", "사용"].includes(status);
}

function formatTrainingMeta(training?: Training) {
  if (!training) {
    return "교육 정보를 확인해 주세요.";
  }

  return [training.date, training.time, training.place ?? training.location, training.department].filter(Boolean).join(" · ");
}

function getFriendlyError(fallback: string, error?: string) {
  return error?.trim() || fallback;
}

export default function AttendancePage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [trainingId, setTrainingId] = useState("");
  const [training, setTraining] = useState<Training>();
  const [staffName, setStaffName] = useState("");
  const [department, setDepartment] = useState("");
  const [staff, setStaff] = useState<Staff>();
  const [targetResult, setTargetResult] = useState<TrainingTargetResult>();
  const [duplicateResult, setDuplicateResult] = useState<DuplicateAttendanceResult>();
  const [saveResult, setSaveResult] = useState<SaveAttendanceResult>();
  const [step, setStep] = useState<AttendanceStep>("loading");
  const [message, setMessage] = useState("QR 출석 정보를 불러오는 중입니다.");

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      const nextTrainingId = getTrainingIdFromUrl();
      setTrainingId(nextTrainingId);

      const configResult = await loadAppConfig();

      if (ignore) {
        return;
      }

      if (!configResult.ok) {
        setMessage(configResult.message);
        setStep("blocked");
        return;
      }

      setRuntimeConfig(configResult.config);

      if (!nextTrainingId) {
        setMessage("교육장에서 제공된 QR을 스캔해주세요.");
        setStep("scan-guide");
        return;
      }

      const trainingResult = await getTrainingDetail(configResult.config, nextTrainingId);

      if (ignore) {
        return;
      }

      if (trainingResult.error || !trainingResult.data) {
        setMessage(getFriendlyError("교육 정보를 찾을 수 없습니다. 출력된 QR 코드를 다시 확인해 주세요.", trainingResult.error));
        setStep("blocked");
        return;
      }

      setTraining(trainingResult.data);

      if (!isActiveTraining(trainingResult.data)) {
        setMessage("현재 활성 상태인 교육만 QR 출석을 진행할 수 있습니다.");
        setStep("blocked");
        return;
      }

      if (!trainingResult.data.qrEnabled) {
        setMessage("이 교육은 QR 출석을 사용하지 않습니다. 담당자에게 확인해 주세요.");
        setStep("blocked");
        return;
      }

      setMessage("성명과 소속부서를 입력하면 교육대상 여부를 확인한 뒤 출석을 저장합니다.");
      setStep("ready");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  const isTrainingMode = Boolean(trainingId);
  const canSubmitAttendance = useMemo(
    () => Boolean(runtimeConfig && training && staffName.trim() && department.trim() && step !== "submitting" && step !== "complete"),
    [department, runtimeConfig, staffName, step, training]
  );

  async function handleAttendanceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!runtimeConfig || !training || !trainingId) {
      setMessage("교육 QR을 먼저 스캔해 주세요.");
      return;
    }

    setStep("submitting");
    setStaff(undefined);
    setTargetResult(undefined);
    setDuplicateResult(undefined);
    setSaveResult(undefined);
    setMessage("본인 정보와 출석 가능 여부를 확인하고 있습니다.");

    const staffResult = await getStaffByNameDept(runtimeConfig, staffName.trim(), department.trim());

    if (staffResult.error || !staffResult.data) {
      setStep("ready");
      setMessage(getFriendlyError("교직원 정보를 확인할 수 없습니다. 동명이인이 있으면 소속부서를 입력해 주세요.", staffResult.error));
      return;
    }

    setStaff(staffResult.data);

    const target = await checkTrainingTarget(runtimeConfig, training.trainingId, staffResult.data.staffId);
    setTargetResult(target.data);

    if (target.error || !target.data?.isTarget) {
      setStep("ready");
      setMessage(getFriendlyError("교육 대상자가 아닙니다.", target.error));
      return;
    }

    const duplicate = await checkDuplicateAttendance(runtimeConfig, training.trainingId, staffResult.data.staffId);
    setDuplicateResult(duplicate.data);

    if (duplicate.error || !duplicate.data) {
      setStep("ready");
      setMessage(getFriendlyError("기존 출석 여부를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.", duplicate.error));
      return;
    }

    if (duplicate.data.duplicate) {
      setStep("complete");
      setMessage("이미 출석한 기록이 있습니다. 중복 저장하지 않았습니다.");
      return;
    }

    setMessage("출석을 저장하고 있습니다.");
    const result = await saveQrAttendance(runtimeConfig, training.trainingId, staffResult.data.staffId);

    if (result.error || !result.data) {
      setStep("ready");
      setMessage(getFriendlyError("출석 저장에 실패했습니다. 다시 시도해 주세요.", result.error));
      return;
    }

    if (result.data.duplicate || result.data.status === "already") {
      setDuplicateResult({
        attendanceId: result.data.attendanceId,
        attendedAt: result.data.attendedAt,
        duplicate: true,
        processStatus: result.data.processStatus
      });
      setStep("complete");
      setMessage("이미 출석한 기록이 있어 새로 저장하지 않았습니다.");
      return;
    }

    setSaveResult(result.data);
    setStep("complete");
    setMessage("출석이 완료되었습니다.");
  }

  return (
    <main className="page">
      <div className="attendance-shell">
        <header className="attendance-appbar">
          <button className="ghost-button compact" onClick={() => window.history.back()} type="button">
            뒤로가기
          </button>
          <strong>QR 출석</strong>
          <a className="ghost-button compact" href={pageHref("/")}>
            홈으로
          </a>
        </header>

        {message ? (
          <div className="soft-alert" role={step === "complete" ? "status" : "alert"}>
            {message}
          </div>
        ) : null}

        {!isTrainingMode ? (
          <>
            <section aria-label="QR 스캔 안내" className="today-card attendance-start-card">
              <div className="today-copy">
                <div className="section-kicker">
                  <QrIcon />
                  <span>QR ATTENDANCE</span>
                </div>
                <h1>QR 링크로 접속해주세요</h1>
                <p>교육장에서 제공된 QR을 스캔하면 해당 교육 출석 화면이 열립니다.</p>
                <p className="permission-note">이 화면에서는 교육 목록이나 수동 출석 버튼을 제공하지 않습니다.</p>
              </div>
            </section>
          </>
        ) : (
          <>
            <section aria-label="선택된 교육" className="today-card">
              <div className="today-copy">
                <div className="section-kicker">
                  <QrIcon />
                  <span>선택된 교육</span>
                </div>
                <h1>{training?.title ?? "교육 정보를 확인하는 중입니다"}</h1>
                <p>{training ? formatTrainingMeta(training) : "QR에 연결된 교육 정보를 불러오고 있습니다."}</p>
                {trainingId ? <span className="permission-note">교육ID {trainingId}</span> : null}
              </div>
            </section>

            {training && step !== "blocked" ? (
              <section aria-label="본인 확인" className="training-section">
                <div className="section-head">
                  <div>
                    <h2>본인 확인</h2>
                    <p>성명과 소속부서로 교육대상 여부를 확인하고 출석을 저장합니다. 동명이인이 있을 때는 소속부서를 입력해 주세요.</p>
                  </div>
                </div>

                <form className="attendance-form" onSubmit={handleAttendanceSubmit}>
                  <label className="field-group">
                    <span>성명</span>
                    <input autoComplete="name" onChange={(event) => setStaffName(event.target.value)} placeholder="예: 박숙현" type="text" value={staffName} />
                  </label>

                  <label className="field-group">
                    <span>소속부서</span>
                    <input autoComplete="organization" onChange={(event) => setDepartment(event.target.value)} placeholder="예: 교무부" type="text" value={department} />
                  </label>

                  <button className="primary-action" disabled={!canSubmitAttendance} type="submit">
                    {step === "submitting" ? "출석 처리 중" : "출석하기"}
                  </button>
                </form>
              </section>
            ) : null}

            {staff ? (
              <section aria-label="출석 확인 결과" className="training-section">
                <div className="section-head">
                  <div>
                    <h2>출석 확인 결과</h2>
                    <p>
                      {staff.name} · {staff.department || "소속부서 미입력"} {staff.position ? `· ${staff.position}` : ""}
                    </p>
                  </div>
                  <div className="badge-row">
                    <span>{targetResult?.isTarget ? "교육대상" : "대상 아님"}</span>
                    <span>{duplicateResult?.duplicate ? "이미 출석" : saveResult ? "출석 완료" : "확인 중"}</span>
                  </div>
                </div>

                {duplicateResult?.duplicate ? (
                  <div className="soft-alert" role="status">
                    기존 출석 기록이 있습니다. {duplicateResult.attendedAt ? `출석일시: ${duplicateResult.attendedAt}` : ""}
                  </div>
                ) : null}
              </section>
            ) : null}

            {step === "complete" && saveResult ? (
              <section aria-label="출석 완료" className="today-card">
                <div className="today-copy">
                  <div className="section-kicker">
                    <CheckIcon />
                    <span>출석 완료</span>
                  </div>
                  <h2>출석 기록이 저장되었습니다.</h2>
                  <p>
                    {saveResult.trainingTitle || training?.title} · {saveResult.attendedAt}
                  </p>
                  {saveResult.signatureRequired && staff && training ? (
                    <>
                      <p>이 교육은 전자서명이 필요합니다. 아래 버튼을 눌러 서명을 이어서 제출해 주세요.</p>
                      <a className="primary-action" href={signatureUrl(training.trainingId, staff.staffId)}>
                        전자서명하기
                      </a>
                    </>
                  ) : (
                    <p>전자서명이 필요하지 않은 교육입니다. 출석 처리가 완료되었습니다.</p>
                  )}
                  <div className="route-actions">
                    <a className="ghost-button" href={pageHref("/my-status")}>
                      내 이수현황 보기
                    </a>
                    <a className="ghost-button" href={pageHref("/")}>
                      홈으로
                    </a>
                  </div>
                </div>
              </section>
            ) : null}

            {step === "complete" && duplicateResult?.duplicate && !saveResult ? (
              <section aria-label="중복 출석 안내" className="today-card">
                <div className="today-copy">
                  <div className="section-kicker">
                    <CheckIcon />
                    <span>출석 확인</span>
                  </div>
                  <h2>이미 출석한 교육입니다.</h2>
                  <p>중복 출석은 저장하지 않았습니다. 필요하면 담당자에게 문의해 주세요.</p>
                  <div className="route-actions">
                    <a className="ghost-button" href={pageHref("/my-status")}>
                      내 이수현황 보기
                    </a>
                    <a className="ghost-button" href={pageHref("/")}>
                      홈으로
                    </a>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
