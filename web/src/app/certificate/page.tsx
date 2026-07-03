"use client";

import {
  getCertificateRequiredTrainings,
  loadAppConfig,
  saveCertificateSubmission,
  type CertificateSubmissionPayload
} from "@/lib/apps-script";
import type { AppConfig, CertificateRequiredTraining, CertificateRequiredTrainingsResult, CertificateSubmissionResult } from "@/lib/types";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

const APP_BASE_PATH = "/school-staff-training-center";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

type PageStep = "lookup" | "loading" | "select" | "form" | "saving" | "done";

function UploadIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 16.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function trainingMeta(training: CertificateRequiredTraining) {
  return [training.date, training.time, training.place, training.department].filter(Boolean).join(" · ");
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

function inferMimeType(file: File) {
  if (file.type) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    return "application/pdf";
  }

  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }

  if (extension === "png") {
    return "image/png";
  }

  return "";
}

export default function CertificatePage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [step, setStep] = useState<PageStep>("lookup");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [lookupResult, setLookupResult] = useState<CertificateRequiredTrainingsResult>();
  const [selectedTraining, setSelectedTraining] = useState<CertificateRequiredTraining>();
  const [completedDate, setCompletedDate] = useState("");
  const [issuer, setIssuer] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [file, setFile] = useState<File>();
  const [message, setMessage] = useState("");
  const [submission, setSubmission] = useState<CertificateSubmissionResult>();

  const canLookup = useMemo(() => Boolean(name.trim() && step !== "loading"), [name, step]);
  const canSubmit = useMemo(
    () => Boolean(selectedTraining && completedDate && issuer.trim() && file && step !== "saving"),
    [completedDate, file, issuer, selectedTraining, step]
  );

  async function ensureConfig() {
    const configResult = runtimeConfig ? { ok: true as const, config: runtimeConfig } : await loadAppConfig();

    if (!configResult.ok) {
      setMessage(configResult.message);
      return null;
    }

    setRuntimeConfig(configResult.config);
    return configResult.config;
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("성명을 입력해 주세요.");
      return;
    }

    setStep("loading");
    setMessage("이수증 제출 대상 교육을 확인하고 있습니다.");
    setLookupResult(undefined);
    setSelectedTraining(undefined);

    const config = await ensureConfig();
    if (!config) {
      setStep("lookup");
      return;
    }

    const result = await getCertificateRequiredTrainings(config, name.trim(), department.trim());

    if (result.error || !result.data) {
      setStep("lookup");
      setMessage(result.error || "이수증 제출 대상 교육을 불러오지 못했습니다.");
      return;
    }

    setLookupResult(result.data);
    setStep("select");
    setMessage("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setFile(undefined);
      return;
    }

    const mimeType = inferMimeType(selectedFile);

    if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
      setFile(undefined);
      setMessage("PDF, JPG, PNG 파일만 제출할 수 있습니다.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(undefined);
      setMessage("파일은 10MB 이하로 선택해 주세요.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setMessage("");
  }

  function selectTraining(training: CertificateRequiredTraining) {
    setSelectedTraining(training);
    setCompletedDate("");
    setIssuer("");
    setCertificateNumber("");
    setFile(undefined);
    setSubmission(undefined);
    setMessage("");
    setStep("form");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!lookupResult || !selectedTraining || !file) {
      setMessage("교육과 이수증 파일을 확인해 주세요.");
      return;
    }

    const config = await ensureConfig();
    if (!config) {
      return;
    }

    setStep("saving");
    setMessage("이수증 파일을 저장하고 있습니다.");

    try {
      const fileBase64 = await fileToBase64(file);
      const payload: CertificateSubmissionPayload = {
        trainingId: selectedTraining.trainingId,
        staffId: lookupResult.staff.staffId,
        completedDate,
        issuer: issuer.trim(),
        certificateNumber: certificateNumber.trim(),
        fileName: file.name,
        fileMimeType: inferMimeType(file),
        fileBase64
      };
      const result = await saveCertificateSubmission(config, payload);

      if (result.error || !result.data) {
        setStep("form");
        setMessage(result.error || "이수증을 제출하지 못했습니다.");
        return;
      }

      setSubmission(result.data);
      setStep("done");
      setMessage("");
    } catch {
      setStep("form");
      setMessage("파일을 읽지 못했습니다. 파일을 다시 선택해 주세요.");
    }
  }

  function resetAll() {
    setStep("lookup");
    setName("");
    setDepartment("");
    setLookupResult(undefined);
    setSelectedTraining(undefined);
    setSubmission(undefined);
    setMessage("");
  }

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <button className="ghost-button" onClick={() => window.history.back()} type="button">
            뒤로가기
          </button>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
        </div>

        <section className="today-card" aria-label="이수증 제출 안내">
          <div className="today-copy">
            <div className="section-kicker">
              <UploadIcon />
              <span>이수증 제출</span>
            </div>
            <h1>이수증 제출</h1>
            <p>외부 연수 이수증을 업로드하여 담당자 확인을 요청합니다.</p>
          </div>
        </section>

        {message ? (
          <div className="soft-alert" role={step === "saving" || step === "loading" ? "status" : "alert"}>
            {message}
          </div>
        ) : null}

        {(step === "lookup" || step === "loading") && (
          <section className="training-section" aria-label="본인 조회">
            <div className="section-head">
              <div>
                <h2>본인 조회</h2>
                <p>성명으로 교직원을 조회합니다. 동명이인이 있을 때만 소속부서를 입력해 주세요.</p>
              </div>
            </div>

            <form className="attendance-form" onSubmit={handleLookup}>
              <label className="field-group">
                <span>성명 *</span>
                <input autoComplete="name" onChange={(event) => setName(event.target.value)} placeholder="예: 박숙현" type="text" value={name} />
              </label>

              <label className="field-group">
                <span>소속부서</span>
                <input autoComplete="organization" onChange={(event) => setDepartment(event.target.value)} placeholder="동명이인일 때 입력" type="text" value={department} />
              </label>

              <button className="primary-action" disabled={!canLookup} type="submit">
                {step === "loading" ? "조회 중" : "조회하기"}
              </button>
            </form>
          </section>
        )}

        {step === "select" && lookupResult ? (
          <>
            <section className="training-section" aria-label="교직원 정보">
              <div className="section-head">
                <div>
                  <h2>{lookupResult.staff.name}</h2>
                  <p>{[lookupResult.staff.department, lookupResult.staff.position].filter(Boolean).join(" · ") || "교직원 정보"}</p>
                </div>
                <button className="ghost-button" onClick={resetAll} type="button">
                  다시 조회
                </button>
              </div>
            </section>

            <section className="status-summary-grid" aria-label="이수증 제출 요약">
              <div className="status-summary-card">
                <span>제출 대상</span>
                <strong>{lookupResult.summary.total}</strong>
              </div>
              <div className="status-summary-card">
                <span>제출 완료</span>
                <strong>{lookupResult.summary.submitted}</strong>
              </div>
              <div className="status-summary-card">
                <span>미제출</span>
                <strong>{lookupResult.summary.missing}</strong>
              </div>
            </section>

            <section className="training-section" aria-label="제출 대상 교육 선택">
              <div className="section-head">
                <div>
                  <h2>제출 대상 교육 선택</h2>
                  <p>이수증 제출이 필요한 교육만 표시합니다.</p>
                </div>
              </div>

              {lookupResult.items.length ? (
                <div className="status-list">
                  {lookupResult.items.map((training) => (
                    <article className="training-card status-card" key={training.trainingId}>
                      <div className="status-card-head">
                        <div>
                          <strong>{training.title || training.trainingId}</strong>
                          <p>{trainingMeta(training) || training.trainingId}</p>
                        </div>
                        <span className={`status-chip ${training.certificateSubmitted ? "status-review" : "status-incomplete"}`}>
                          {training.status || (training.certificateSubmitted ? "승인대기" : "미제출")}
                        </span>
                      </div>

                      <div className="badge-row">
                        <span>{training.department || "담당부서 미입력"}</span>
                        <span>{training.certificateSubmitted ? `제출일시 ${training.submittedAt || "-"}` : "제출 필요"}</span>
                      </div>

                      <div className="route-actions">
                        {training.fileUrl ? (
                          <a className="ghost-button" href={training.fileUrl} rel="noreferrer" target="_blank">
                            제출 파일 보기
                          </a>
                        ) : null}
                        <button className="primary-action" onClick={() => selectTraining(training)} type="button">
                          {training.certificateSubmitted ? "다시 제출하기" : "제출하기"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="soft-alert" role="status">
                  현재 이수증 제출이 필요한 교육이 없습니다.
                </div>
              )}
            </section>
          </>
        ) : null}

        {(step === "form" || step === "saving") && lookupResult && selectedTraining ? (
          <section className="training-section" aria-label="이수증 제출 폼">
            <div className="section-head">
              <div>
                <h2>이수증 제출</h2>
                <p>파일은 Google Drive에 저장되고 담당자 확인 전까지 승인대기 상태로 기록됩니다.</p>
              </div>
              <button className="ghost-button" onClick={() => setStep("select")} type="button">
                교육 다시 선택
              </button>
            </div>

            <article className="training-card status-card">
              <div className="status-card-head">
                <div>
                  <strong>{selectedTraining.title}</strong>
                  <p>{trainingMeta(selectedTraining)}</p>
                </div>
                <span className="status-chip status-incomplete">제출 필요</span>
              </div>
            </article>

            <form className="attendance-form" onSubmit={handleSubmit}>
              <label className="field-group">
                <span>이수일자 *</span>
                <input onChange={(event) => setCompletedDate(event.target.value)} type="date" value={completedDate} />
              </label>

              <label className="field-group">
                <span>이수기관 *</span>
                <input onChange={(event) => setIssuer(event.target.value)} placeholder="예: 대한심폐소생협회" type="text" value={issuer} />
              </label>

              <label className="field-group">
                <span>이수증번호</span>
                <input onChange={(event) => setCertificateNumber(event.target.value)} placeholder="이수증에 번호가 있을 때 입력" type="text" value={certificateNumber} />
              </label>

              <label className="field-group">
                <span>파일 업로드 *</span>
                <input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleFileChange} type="file" />
                <small className="field-help">PDF, JPG, PNG 파일만 제출할 수 있습니다. 파일은 10MB 이하로 선택해 주세요.</small>
              </label>

              <button className="primary-action" disabled={!canSubmit} type="submit">
                {step === "saving" ? "제출 중" : "제출하기"}
              </button>
            </form>
          </section>
        ) : null}

        {step === "done" && submission ? (
          <section className="training-section" aria-label="제출 완료">
            <div className="section-head">
              <div>
                <div className="section-kicker">
                  <CheckIcon />
                  <span>제출 완료</span>
                </div>
                <h2>이수증 제출이 완료되었습니다.</h2>
                <p>담당자 확인 후 이수 상태에 반영됩니다.</p>
              </div>
            </div>

            <article className="training-card status-card">
              <div className="status-card-head">
                <div>
                  <strong>{submission.trainingTitle}</strong>
                  <p>제출일시: {submission.submittedAt}</p>
                </div>
                <span className="status-chip status-review">{submission.status || "승인대기"}</span>
              </div>
            </article>

            <div className="route-actions">
              <a className="primary-action" href={`${APP_BASE_PATH}/my-status`}>
                내 이수현황 보기
              </a>
              <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
                홈으로
              </a>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
