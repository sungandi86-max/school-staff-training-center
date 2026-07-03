"use client";

import {
  checkDuplicateAttendance,
  checkTrainingTarget,
  getTrainingDetail,
  loadAppConfig,
  saveQrAttendance,
  verifyStaff
} from "@/lib/apps-script";
import type { AppConfig, DuplicateAttendanceResult, SaveAttendanceResult, Staff, Training, TrainingTargetResult } from "@/lib/types";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

type AttendanceStep = "setup" | "ready" | "checking" | "verified" | "saving" | "complete";

function formatTrainingMeta(training?: Training) {
  if (!training) {
    return "교육 정보를 확인해 주세요.";
  }

  return [training.date, training.time, training.place ?? training.location, training.department].filter(Boolean).join(" · ");
}

function isActiveTraining(training?: Training) {
  return (training?.status ?? training?.activeStatus ?? "").trim() === "활성";
}

function getTrainingIdFromUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("trainingId")?.trim() ?? "";
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function AttendancePage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [trainingId, setTrainingId] = useState("");
  const [training, setTraining] = useState<Training>();
  const [staffName, setStaffName] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [staff, setStaff] = useState<Staff>();
  const [targetResult, setTargetResult] = useState<TrainingTargetResult>();
  const [duplicateResult, setDuplicateResult] = useState<DuplicateAttendanceResult>();
  const [saveResult, setSaveResult] = useState<SaveAttendanceResult>();
  const [step, setStep] = useState<AttendanceStep>("setup");
  const [message, setMessage] = useState("출석 설정을 불러오는 중입니다.");

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
        setStep("setup");
        return;
      }

      setRuntimeConfig(configResult.config);

      if (!nextTrainingId) {
        setMessage("교육목록에서 QR 출석할 교육을 선택해 주세요.");
        setStep("setup");
        return;
      }

      const trainingResult = await getTrainingDetail(configResult.config, nextTrainingId);

      if (ignore) {
        return;
      }

      if (trainingResult.error || !trainingResult.data) {
        setMessage("교육 정보를 찾을 수 없습니다. 교육목록에서 다시 선택해 주세요.");
        setStep("setup");
        return;
      }

      setTraining(trainingResult.data);

      if (!isActiveTraining(trainingResult.data)) {
        setMessage("현재 활성 상태의 교육만 QR 출석할 수 있습니다.");
        setStep("setup");
        return;
      }

      if (!trainingResult.data.qrEnabled) {
        setMessage("이 교육은 QR 출석을 사용하지 않습니다.");
        setStep("setup");
        return;
      }

      setMessage("성명과 인증코드를 입력해 출석 가능 여부를 확인해 주세요.");
      setStep("ready");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  const canSubmitVerification = useMemo(
    () => Boolean(runtimeConfig && training && staffName.trim() && authCode.trim() && step !== "checking" && step !== "saving"),
    [authCode, runtimeConfig, staffName, step, training]
  );

  const canSaveAttendance = Boolean(
    runtimeConfig &&
      training &&
      staff &&
      targetResult?.isTarget &&
      duplicateResult &&
      !duplicateResult.duplicate &&
      step === "verified"
  );

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!runtimeConfig || !training || !trainingId) {
      setMessage("교육 정보를 먼저 확인해 주세요.");
      return;
    }

    setStep("checking");
    setStaff(undefined);
    setTargetResult(undefined);
    setDuplicateResult(undefined);
    setSaveResult(undefined);
    setMessage("교직원 정보를 확인하고 있습니다.");

    const staffResult = await verifyStaff(runtimeConfig, staffName.trim(), authCode.trim());

    if (staffResult.error || !staffResult.data) {
      setStep("ready");
      setMessage("성명 또는 인증코드를 확인해 주세요.");
      return;
    }

    const target = await checkTrainingTarget(runtimeConfig, training.trainingId, staffResult.data.staffId);

    if (target.error || !target.data?.isTarget) {
      setStaff(staffResult.data);
      setTargetResult(target.data);
      setStep("ready");
      setMessage("이 교육의 대상자로 등록되어 있지 않아 출석할 수 없습니다.");
      return;
    }

    const duplicate = await checkDuplicateAttendance(runtimeConfig, training.trainingId, staffResult.data.staffId);

    if (duplicate.error || !duplicate.data) {
      setStaff(staffResult.data);
      setTargetResult(target.data);
      setStep("ready");
      setMessage("기존 출석 여부를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setStaff(staffResult.data);
    setTargetResult(target.data);
    setDuplicateResult(duplicate.data);

    if (duplicate.data.duplicate) {
      setStep("verified");
      setMessage("이미 출석 기록이 있습니다. 중복 출석은 저장하지 않습니다.");
      return;
    }

    setStep("verified");
    setMessage("출석할 수 있습니다. 아래 버튼을 눌러 출석을 저장해 주세요.");
  }

  async function handleSaveAttendance() {
    if (!runtimeConfig || !training || !staff) {
      setMessage("출석 저장에 필요한 정보를 다시 확인해 주세요.");
      return;
    }

    setStep("saving");
    setMessage("출석을 저장하고 있습니다.");

    const result = await saveQrAttendance(runtimeConfig, training.trainingId, staff.staffId);

    if (result.error || !result.data) {
      setStep("verified");
      setMessage("출석 저장에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    if (result.data.duplicate || result.data.status === "already") {
      setDuplicateResult({
        duplicate: true,
        attendanceId: result.data.attendanceId,
        attendedAt: result.data.attendedAt,
        processStatus: result.data.processStatus
      });
      setStep("verified");
      setMessage("이미 출석 기록이 있어 새로 저장하지 않았습니다.");
      return;
    }

    setSaveResult(result.data);
    setStep("complete");
    setMessage("출석이 완료되었습니다.");
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

        <section className="today-card" aria-label="QR 출석">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>QR 출석</span>
            </div>
            <h1>{training?.title ?? "교육 선택 필요"}</h1>
            <p>{training ? formatTrainingMeta(training) : "교육목록에서 QR 출석할 교육을 선택해 주세요."}</p>
            {trainingId ? <span className="permission-note">교육ID {trainingId}</span> : null}
          </div>
        </section>

        {message ? (
          <div className="soft-alert" role={step === "complete" ? "status" : "alert"}>
            {message}
          </div>
        ) : null}

        {training ? (
          <section className="training-section" aria-label="교육 정보">
            <div className="section-head">
              <div>
                <h2>교육 정보</h2>
                <p>{formatTrainingMeta(training)}</p>
              </div>
              <div className="badge-row">
                <span>{training.category || "교육구분 미입력"}</span>
                <span>{training.qrEnabled ? "QR 사용" : "QR 미사용"}</span>
                <span>{training.signatureRequired ? "전자서명 필요" : "전자서명 없음"}</span>
                <span>{training.status || "상태 미입력"}</span>
              </div>
            </div>
          </section>
        ) : null}

        {step !== "complete" ? (
          <section className="training-section" aria-label="교직원 인증">
            <div className="section-head">
              <div>
                <h2>교직원 인증</h2>
                <p>성명과 인증코드로 교육 대상 여부와 기존 출석 여부를 확인합니다.</p>
              </div>
            </div>

            <form className="attendance-form" onSubmit={handleVerify}>
              <label className="field-group">
                <span>성명</span>
                <input autoComplete="name" onChange={(event) => setStaffName(event.target.value)} placeholder="예: 홍길동" type="text" value={staffName} />
              </label>

              <label className="field-group">
                <span>인증코드</span>
                <input autoComplete="off" onChange={(event) => setAuthCode(event.target.value)} placeholder="인증코드 입력" type="password" value={authCode} />
              </label>

              <button className="primary-action" disabled={!canSubmitVerification} type="submit">
                출석 가능 여부 확인
              </button>
            </form>
          </section>
        ) : null}

        {staff ? (
          <section className="training-section" aria-label="출석 상태">
            <div className="section-head">
              <div>
                <h2>출석 상태</h2>
                <p>
                  {staff.name} · {staff.department || "부서 미입력"}
                </p>
              </div>
              <div className="badge-row">
                <span>{targetResult?.isTarget ? "교육대상" : "대상 아님"}</span>
                <span>{duplicateResult?.duplicate ? "이미 출석" : "출석 가능"}</span>
              </div>
            </div>

            {duplicateResult?.duplicate ? (
              <div className="soft-alert" role="status">
                기존 출석 기록이 있습니다. {duplicateResult.attendedAt ? `출석일시: ${duplicateResult.attendedAt}` : ""}
              </div>
            ) : null}

            {canSaveAttendance ? (
              <button className="primary-action" onClick={handleSaveAttendance} type="button">
                출석하기
              </button>
            ) : null}
          </section>
        ) : null}

        {step === "complete" && saveResult ? (
          <section className="today-card" aria-label="출석 완료">
            <div className="today-copy">
              <div className="section-kicker">
                <CheckIcon />
                <span>출석 완료</span>
              </div>
              <h2>출석 기록이 저장되었습니다.</h2>
              <p>
                {saveResult.trainingTitle || training?.title} · {saveResult.attendedAt}
              </p>
              {saveResult.signatureRequired ? <p>전자서명은 다음 단계에서 연결됩니다.</p> : null}
              <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
                홈으로 돌아가기
              </a>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
