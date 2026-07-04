"use client";

import {
  checkSignatureExists,
  getStaffDetail,
  getTrainingDetail,
  loadAppConfig,
  saveSignature
} from "@/lib/apps-script";
import type { AppConfig, SaveSignatureResult, SignatureExistsResult, Staff, Training } from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

type SignatureStep = "setup" | "ready" | "saving" | "complete";

function getParams() {
  if (typeof window === "undefined") {
    return { trainingId: "", staffId: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    trainingId: params.get("trainingId")?.trim() ?? "",
    staffId: params.get("staffId")?.trim() ?? ""
  };
}

function formatTrainingMeta(training?: Training) {
  if (!training) {
    return "교육 정보를 확인해 주세요.";
  }

  return [training.date, training.time, training.place ?? training.location, training.department].filter(Boolean).join(" · ");
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
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

export default function SignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [training, setTraining] = useState<Training>();
  const [staff, setStaff] = useState<Staff>();
  const [signatureExists, setSignatureExists] = useState<SignatureExistsResult>();
  const [saveResult, setSaveResult] = useState<SaveSignatureResult>();
  const [hasSignature, setHasSignature] = useState(false);
  const [step, setStep] = useState<SignatureStep>("setup");
  const [message, setMessage] = useState("전자서명 정보를 불러오는 중입니다.");

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      const nextParams = getParams();

      if (!nextParams.trainingId || !nextParams.staffId) {
        setMessage("교육목록 또는 출석 완료 화면에서 전자서명할 교육을 선택해 주세요.");
        setStep("setup");
        return;
      }

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

      const [trainingResult, staffResult, signatureResult] = await Promise.all([
        getTrainingDetail(configResult.config, nextParams.trainingId),
        getStaffDetail(configResult.config, nextParams.staffId),
        checkSignatureExists(configResult.config, nextParams.trainingId, nextParams.staffId)
      ]);

      if (ignore) {
        return;
      }

      if (trainingResult.error || !trainingResult.data) {
        setMessage("교육 정보를 찾을 수 없습니다. 교육목록에서 다시 선택해 주세요.");
        setStep("setup");
        return;
      }

      if (staffResult.error || !staffResult.data) {
        setMessage("교직원 정보를 찾을 수 없습니다. QR 출석을 먼저 완료해 주세요.");
        setStep("setup");
        return;
      }

      if (signatureResult.error || !signatureResult.data) {
        setMessage("기존 전자서명 기록을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setStep("setup");
        return;
      }

      setTraining(trainingResult.data);
      setStaff(staffResult.data);
      setSignatureExists(signatureResult.data);

      if (signatureResult.data.exists) {
        setMessage("이미 전자서명 기록이 있습니다. 중복 서명은 저장하지 않습니다.");
        setStep("ready");
        return;
      }

      setMessage("아래 서명란에 서명한 뒤 저장해 주세요.");
      setStep("ready");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (step !== "ready" || signatureExists?.exists) {
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
  }, [signatureExists?.exists, step]);

  const canSave = useMemo(
    () => Boolean(runtimeConfig && training && staff && hasSignature && step === "ready" && !signatureExists?.exists),
    [hasSignature, runtimeConfig, signatureExists?.exists, staff, step, training]
  );

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
    if (step !== "ready" || signatureExists?.exists) {
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

  function handleClear() {
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

  async function handleSave() {
    const canvas = canvasRef.current;

    if (!runtimeConfig || !training || !staff || !canvas) {
      setMessage("전자서명 저장에 필요한 정보를 다시 확인해 주세요.");
      return;
    }

    if (!hasSignature) {
      setMessage("서명 후 저장할 수 있습니다.");
      return;
    }

    setStep("saving");
    setMessage("전자서명을 저장하고 있습니다.");

    const result = await saveSignature(runtimeConfig, training.trainingId, staff.staffId, canvas.toDataURL("image/png"));

    if (result.error || !result.data) {
      setStep("ready");
      setMessage(result.error || "전자서명 저장에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    if (result.data.duplicate || result.data.status === "already") {
      setSignatureExists({
        exists: true,
        signatureId: result.data.signatureId,
        signedAt: result.data.signedAt,
        fileUrl: result.data.fileUrl,
        fileId: result.data.fileId,
        saveStatus: result.data.saveStatus
      });
      setStep("ready");
      setMessage("이미 전자서명 기록이 있어 새로 저장하지 않았습니다.");
      return;
    }

    setSaveResult(result.data);
    setStep("complete");
    setMessage("전자서명이 저장되었습니다.");
  }

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">전자서명</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
          <button className="ghost-button" onClick={() => window.history.back()} type="button">
            뒤로가기
          </button>
        </div>

        <section className="today-card" aria-label="전자서명">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>전자서명</span>
            </div>
            <h1>{training?.title ?? "전자서명 준비"}</h1>
            <p>{training ? formatTrainingMeta(training) : "QR 출석 완료 후 전자서명을 진행해 주세요."}</p>
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
                <span>{training.trainingId}</span>
                <span>{training.signatureRequired ? "전자서명 필요" : "전자서명 선택"}</span>
                <span>{training.status || "상태 미입력"}</span>
              </div>
            </div>
          </section>
        ) : null}

        {staff ? (
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
        ) : null}

        {signatureExists?.exists ? (
          <section className="training-section" aria-label="서명 완료 기록">
            <div className="section-head">
              <div>
                <h2>전자서명 기록</h2>
                <p>{signatureExists.signedAt ? `서명일시: ${signatureExists.signedAt}` : "이미 저장된 전자서명이 있습니다."}</p>
              </div>
              <div className="badge-row">
                <span>{signatureExists.saveStatus || "완료"}</span>
              </div>
            </div>
          </section>
        ) : null}

        {step !== "complete" && !signatureExists?.exists ? (
          <section className="training-section" aria-label="서명란">
            <div className="section-head">
              <div>
                <h2>서명란</h2>
                <p>흰색 영역 안에 손가락이나 마우스로 서명해 주세요.</p>
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
              <button className="ghost-button" disabled={step === "saving"} onClick={handleClear} type="button">
                다시쓰기
              </button>
              <button className="primary-action" disabled={!canSave} onClick={handleSave} type="button">
                {step === "saving" ? "저장 중" : "서명 완료 및 저장"}
              </button>
            </div>
          </section>
        ) : null}

        {step === "complete" && saveResult ? (
          <section className="today-card" aria-label="전자서명 완료">
            <div className="today-copy">
              <div className="section-kicker">
                <CheckIcon />
                <span>저장 완료</span>
              </div>
              <h2>전자서명이 저장되었습니다.</h2>
              <p>
                {saveResult.trainingTitle || training?.title} · {saveResult.signedAt}
              </p>
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
