"use client";

import {
  checkSignatureExists,
  checkTrainingTarget,
  getStaffByNameDept,
  getTrainingDetail,
  loadAppConfig,
  saveBulkSignature
} from "@/lib/apps-script";
import { getBasePath } from "@/lib/paths";
import type { AppConfig, BulkSignatureResult, SignatureExistsResult, Staff, Training, TrainingTargetResult } from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from "react";

type AttendanceStep = "loading" | "scan-guide" | "ready" | "submitting" | "signature" | "saving-signature" | "complete" | "blocked";

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

function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#0f172a";
  context.lineWidth = 3.25;

  return context;
}

export default function AttendancePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [trainingId, setTrainingId] = useState("");
  const [training, setTraining] = useState<Training>();
  const [staffName, setStaffName] = useState("");
  const [department, setDepartment] = useState("");
  const [staff, setStaff] = useState<Staff>();
  const [targetResult, setTargetResult] = useState<TrainingTargetResult>();
  const [signatureExists, setSignatureExists] = useState<SignatureExistsResult>();
  const [bulkResult, setBulkResult] = useState<BulkSignatureResult>();
  const [hasSignature, setHasSignature] = useState(false);
  const [step, setStep] = useState<AttendanceStep>("loading");
  const [message, setMessage] = useState("현장 서명 정보를 불러오는 중입니다.");

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
        setMessage("현재 활성 상태인 교육만 현장 서명을 진행할 수 있습니다.");
        setStep("blocked");
        return;
      }

      if (!trainingResult.data.qrEnabled) {
        setMessage("이 교육은 현장 QR 서명을 사용하지 않습니다. 담당자에게 확인해 주세요.");
        setStep("blocked");
        return;
      }

      setMessage("성명과 소속부서를 입력하면 교육대상 확인 후 전자서명을 진행합니다.");
      setStep("ready");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (step !== "signature") {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    function resizeCanvas() {
      const nextCanvas = canvasRef.current;

      if (!nextCanvas) {
        return;
      }

      const rect = nextCanvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      nextCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
      nextCanvas.height = Math.max(1, Math.floor(rect.height * ratio));

      const context = getCanvasContext(nextCanvas);
      if (context) {
        context.scale(ratio, ratio);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, rect.width, rect.height);
      }
    }

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [step]);

  const isTrainingMode = Boolean(trainingId);
  const canSubmitAttendance = useMemo(
    () => Boolean(runtimeConfig && training && staffName.trim() && department.trim() && step !== "submitting" && step !== "complete"),
    [department, runtimeConfig, staffName, step, training]
  );
  const canSaveSignature = Boolean(runtimeConfig && training && staff && hasSignature && step === "signature");

  async function handleAttendanceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!runtimeConfig || !training || !trainingId) {
      setMessage("교육장에서 제공된 QR을 먼저 스캔해 주세요.");
      return;
    }

    setStep("submitting");
    setStaff(undefined);
    setTargetResult(undefined);
    setSignatureExists(undefined);
    setBulkResult(undefined);
    setHasSignature(false);
    setMessage("본인 정보와 교육대상 여부를 확인하고 있습니다.");

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

    if (target.data.signatureExcluded) {
      setStep("ready");
      setMessage("이 교육은 서명 제외 대상입니다. 담당자에게 확인해 주세요.");
      return;
    }

    const signature = await checkSignatureExists(runtimeConfig, training.trainingId, staffResult.data.staffId);
    setSignatureExists(signature.data);

    if (signature.error || !signature.data) {
      setStep("ready");
      setMessage(getFriendlyError("기존 전자서명 기록을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.", signature.error));
      return;
    }

    if (signature.data.exists) {
      setStep("complete");
      setMessage("이미 전자서명 기록이 저장된 교육입니다.");
      return;
    }

    setStep("signature");
    setMessage("아래 서명란에 서명한 뒤 전자서명을 제출해 주세요.");
  }

  function pointerPosition(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (step !== "signature") {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;

    const context = getCanvasContext(event.currentTarget);
    const point = pointerPosition(event);

    if (context) {
      context.beginPath();
      context.moveTo(point.x, point.y);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    event.preventDefault();
    const context = getCanvasContext(event.currentTarget);
    const point = pointerPosition(event);

    if (context) {
      context.lineTo(point.x, point.y);
      context.stroke();
      setHasSignature(true);
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    event.preventDefault();
    drawingRef.current = false;
  }

  function handleClearSignature() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const context = getCanvasContext(canvas);

    if (context) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, rect.width, rect.height);
    }

    setHasSignature(false);
    setMessage("서명란을 다시 작성해 주세요.");
  }

  async function handleSaveSignature() {
    const canvas = canvasRef.current;

    if (!runtimeConfig || !training || !staff || !canvas) {
      setMessage("전자서명 저장에 필요한 정보를 다시 확인해 주세요.");
      return;
    }

    if (!hasSignature) {
      setMessage("서명 후 제출할 수 있습니다.");
      return;
    }

    setStep("saving-signature");
    setMessage("전자서명을 저장하고 있습니다.");

    const result = await saveBulkSignature(runtimeConfig, staff.staffId, [training.trainingId], canvas.toDataURL("image/png"), training.date);

    if (result.error || !result.data || result.data.status === "skipped") {
      setStep("signature");
      setMessage(result.error || result.data?.skipped[0]?.reason || "전자서명 저장에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    setBulkResult(result.data);
    setStep("complete");
    setMessage("출석 및 전자서명이 완료되었습니다.");
  }

  return (
    <main className="page">
      <div className="attendance-shell">
        <header className="attendance-appbar">
          <button className="ghost-button compact" onClick={() => window.history.back()} type="button">
            뒤로가기
          </button>
          <strong>현장 서명</strong>
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
                  <span>FIELD SIGNATURE</span>
                </div>
                <h1>QR 링크로 접속해주세요</h1>
                <p>교육장에서 QR을 스캔하고 전자서명까지 완료하면 출석으로 인정됩니다.</p>
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

            {training && step !== "blocked" && !staff ? (
              <section aria-label="본인 확인" className="training-section">
                <div className="section-head">
                  <div>
                    <h2>본인 확인</h2>
                    <p>성명과 소속부서로 본인과 교육대상 여부를 확인합니다.</p>
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
                    {step === "submitting" ? "확인 중" : "확인하기"}
                  </button>
                </form>
              </section>
            ) : null}

            {staff ? (
              <section aria-label="본인 확인 결과" className="training-section">
                <div className="section-head">
                  <div>
                    <h2>본인 확인 결과</h2>
                    <p>
                      {staff.name} · {staff.department || "소속부서 미입력"} {staff.position ? `· ${staff.position}` : ""}
                    </p>
                  </div>
                  <div className="badge-row">
                    <span>{targetResult?.isTarget ? "교육대상" : "대상 아님"}</span>
                    <span>{signatureExists?.exists ? "서명 완료" : step === "signature" || step === "saving-signature" ? "서명 대기" : "확인 완료"}</span>
                  </div>
                </div>
              </section>
            ) : null}

            {step === "signature" || step === "saving-signature" ? (
              <section aria-label="전자서명 입력" className="training-section">
                <div className="section-head">
                  <div>
                    <h2>전자서명</h2>
                    <p>전자서명 기록은 출석 및 교육 이수 증빙으로 저장됩니다.</p>
                  </div>
                </div>

                <canvas
                  ref={canvasRef}
                  aria-label="전자서명 입력"
                  className="signature-canvas"
                  onPointerCancel={handlePointerUp}
                  onPointerDown={handlePointerDown}
                  onPointerLeave={handlePointerUp}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                />

                <div className="signature-actions">
                  <button className="ghost-button" disabled={step === "saving-signature"} onClick={handleClearSignature} type="button">
                    다시쓰기
                  </button>
                  <button className="primary-action" disabled={!canSaveSignature} onClick={handleSaveSignature} type="button">
                    {step === "saving-signature" ? "저장 중" : "서명하고 출석 완료"}
                  </button>
                </div>
              </section>
            ) : null}

            {step === "complete" && (bulkResult || signatureExists?.exists) ? (
              <section aria-label="출석 및 전자서명 완료" className="today-card">
                <div className="today-copy">
                  <div className="section-kicker">
                    <CheckIcon />
                    <span>완료</span>
                  </div>
                  <h2>출석 및 전자서명이 완료되었습니다.</h2>
                  <p>
                    {training?.title || "교육"} · {bulkResult?.signedAt || signatureExists?.signedAt || "저장 완료"}
                  </p>
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
