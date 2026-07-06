"use client";

import {
  checkSignatureExists,
  getSignatureRequiredTrainings,
  getStaffByNameDept,
  getStaffDetail,
  getTrainingDetail,
  loadAppConfig,
  saveBulkSignature
} from "@/lib/apps-script";
import type {
  AppConfig,
  BulkSignatureResult,
  SignatureExistsResult,
  SignatureRequiredTrainingGroup,
  Staff,
  Training
} from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

type SignatureStep = "setup" | "lookup" | "ready" | "saving" | "complete";
type SignatureFilter = "today" | "needed" | "all";

function pageHref(path: string) {
  return path === "/" ? `${APP_BASE_PATH}/` : `${APP_BASE_PATH}${path}/`;
}

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

function todayText() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
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

function flattenGroups(groups: SignatureRequiredTrainingGroup[]) {
  return groups.flatMap((group) => group.items.map((item) => ({ ...item, groupDate: group.date })));
}

export default function SignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [training, setTraining] = useState<Training>();
  const [staff, setStaff] = useState<Staff>();
  const [signatureExists, setSignatureExists] = useState<SignatureExistsResult>();
  const [groups, setGroups] = useState<SignatureRequiredTrainingGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkSignatureResult>();
  const [hasSignature, setHasSignature] = useState(false);
  const [step, setStep] = useState<SignatureStep>("setup");
  const [message, setMessage] = useState("전자서명 정보를 불러오는 중입니다.");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [filter, setFilter] = useState<SignatureFilter>("needed");
  const [excludeSigned, setExcludeSigned] = useState(true);
  const [singleMode, setSingleMode] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      const params = getParams();
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

      if (!params.trainingId) {
        setMessage("성명과 소속부서로 본인 조회 후 서명 필요한 교육을 선택해 주세요.");
        setStep("lookup");
        return;
      }

      setSingleMode(true);

      if (!params.staffId) {
        setMessage("QR 출석 완료 화면에서 전자서명을 다시 열어 주세요.");
        setStep("setup");
        return;
      }

      const [trainingResult, staffResult, signatureResult] = await Promise.all([
        getTrainingDetail(configResult.config, params.trainingId),
        getStaffDetail(configResult.config, params.staffId),
        checkSignatureExists(configResult.config, params.trainingId, params.staffId)
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
        setMessage("이미 서명 완료된 교육입니다.");
        setStep("ready");
        return;
      }

      setGroups([
        {
          date: trainingResult.data.date || "날짜 미입력",
          items: [
            {
              trainingId: trainingResult.data.trainingId,
              title: trainingResult.data.title,
              date: trainingResult.data.date,
              time: trainingResult.data.time,
              place: trainingResult.data.place ?? trainingResult.data.location,
              department: trainingResult.data.department,
              attendanceDone: true,
              signatureDone: false,
              selectable: true
            }
          ]
        }
      ]);
      setSelectedIds([trainingResult.data.trainingId]);
      setMessage("아래 서명란에 서명한 뒤 저장해 주세요.");
      setStep("ready");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if ((step !== "ready" && step !== "complete") || signatureExists?.exists) {
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

  const allItems = useMemo(() => flattenGroups(groups), [groups]);
  const today = todayText();
  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            if (filter === "today" && item.date !== today) {
              return false;
            }

            if (filter === "needed" && item.signatureDone) {
              return false;
            }

            return true;
          })
        }))
        .filter((group) => group.items.length > 0),
    [filter, groups, today]
  );
  const selectedItems = useMemo(() => allItems.filter((item) => selectedIds.includes(item.trainingId)), [allItems, selectedIds]);
  const selectedDates = Array.from(new Set(selectedItems.map((item) => item.date || "날짜 미입력")));
  const selectedDateLabel = selectedDates.length === 1 ? selectedDates[0] : selectedDates.length > 1 ? "복수날짜" : "";
  const canSave = Boolean(runtimeConfig && staff && selectedIds.length > 0 && hasSignature && step === "ready" && !signatureExists?.exists);

  async function loadSignatureTargets(nextStaff: Staff, nextExcludeSigned = excludeSigned) {
    if (!runtimeConfig) {
      setMessage("app-config.json 설정을 먼저 확인해 주세요.");
      return;
    }

    const result = await getSignatureRequiredTrainings(runtimeConfig, nextStaff.staffId, nextExcludeSigned);

    if (result.error || !result.data) {
      setGroups([]);
      setSelectedIds([]);
      setMessage(result.error || "전자서명 대상 교육을 불러오지 못했습니다.");
      return;
    }

    setGroups(result.data.groups);
    setSelectedIds([]);
    setMessage(result.data.groups.length ? "서명할 교육을 선택한 뒤 아래 서명란에 서명해 주세요." : "현재 전자서명이 필요한 교육이 없습니다.");
    setStep("ready");
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!runtimeConfig || !name.trim()) {
      setMessage("성명을 입력해 주세요.");
      return;
    }

    setStep("setup");
    setMessage("교직원 정보를 확인하고 있습니다.");

    const staffResult = await getStaffByNameDept(runtimeConfig, name.trim(), department.trim());

    if (staffResult.error || !staffResult.data) {
      setStep("lookup");
      setMessage(staffResult.error || "교직원 정보를 확인할 수 없습니다. 동명이인이 있으면 소속부서를 입력해 주세요.");
      return;
    }

    setStaff(staffResult.data);
    await loadSignatureTargets(staffResult.data, excludeSigned);
  }

  async function handleExcludeSignedChange(nextValue: boolean) {
    setExcludeSigned(nextValue);
    if (staff) {
      await loadSignatureTargets(staff, nextValue);
    }
  }

  function toggleTraining(trainingId: string) {
    setSelectedIds((current) => (current.includes(trainingId) ? current.filter((id) => id !== trainingId) : [...current, trainingId]));
  }

  function toggleDate(group: SignatureRequiredTrainingGroup) {
    const selectableIds = group.items.filter((item) => item.selectable).map((item) => item.trainingId);
    const allSelected = selectableIds.every((id) => selectedIds.includes(id));

    setSelectedIds((current) => {
      if (allSelected) {
        return current.filter((id) => !selectableIds.includes(id));
      }

      return Array.from(new Set([...current, ...selectableIds]));
    });
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

    if (!runtimeConfig || !staff || !canvas) {
      setMessage("전자서명 저장에 필요한 정보를 다시 확인해 주세요.");
      return;
    }

    if (!selectedIds.length) {
      setMessage("서명할 교육을 선택해 주세요.");
      return;
    }

    if (!hasSignature) {
      setMessage("서명 후 저장할 수 있습니다.");
      return;
    }

    setStep("saving");
    setMessage(`선택한 교육 ${selectedIds.length}건에 전자서명을 저장하고 있습니다.`);

    const result = await saveBulkSignature(runtimeConfig, staff.staffId, selectedIds, canvas.toDataURL("image/png"), selectedDateLabel);

    if (result.error || !result.data) {
      setStep("ready");
      setMessage(result.error || "전자서명 저장에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    setBulkResult(result.data);
    setStep("complete");
    setMessage(`전자서명이 완료되었습니다. 저장 ${result.data.savedCount}건${result.data.skippedCount ? `, 건너뜀 ${result.data.skippedCount}건` : ""}`);
  }

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">전자서명</span>
          <a className="ghost-button" href={pageHref("/")}>
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
            <h1>{training?.title ?? "전자서명"}</h1>
            <p>{singleMode ? "전자서명 제출로 출석과 이수 증빙을 완료합니다." : "서명이 필요한 교육을 확인하고 전자서명을 제출합니다."}</p>
          </div>
        </section>

        {message ? (
          <div className="soft-alert" role={step === "complete" ? "status" : "alert"}>
            {message}
          </div>
        ) : null}

        {!singleMode && !staff ? (
          <section className="training-section" aria-label="본인 조회">
            <div className="section-head">
              <div>
                <h2>본인 조회</h2>
                <p>성명과 소속부서로 본인에게 필요한 전자서명 대상을 확인합니다. 인증코드는 요구하지 않습니다.</p>
              </div>
            </div>
            <form className="attendance-form" onSubmit={handleLookup}>
              <label className="field-group">
                <span>성명</span>
                <input autoComplete="name" onChange={(event) => setName(event.target.value)} placeholder="예: 박숙현" type="text" value={name} />
              </label>
              <label className="field-group">
                <span>소속부서</span>
                <input autoComplete="organization" onChange={(event) => setDepartment(event.target.value)} placeholder="동명이인일 때 입력" type="text" value={department} />
              </label>
              <button className="primary-action" disabled={step === "setup" || !name.trim()} type="submit">
                조회하기
              </button>
            </form>
          </section>
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
            <div className="route-actions">
              <a className="primary-action" href={pageHref("/my-status")}>
                내 이수현황 보기
              </a>
              <a className="ghost-button" href={pageHref("/")}>
                홈으로
              </a>
            </div>
          </section>
        ) : null}

        {!singleMode && staff && step !== "complete" ? (
          <section className="training-section" aria-label="전자서명 대상 교육">
            <div className="section-head">
              <div>
                <h2>서명 필요한 교육</h2>
                <p>날짜별로 교육을 선택하고 한 번의 서명으로 저장합니다.</p>
              </div>
              <div className="badge-row">
                <button className={filter === "today" ? "primary-action compact" : "ghost-button compact"} onClick={() => setFilter("today")} type="button">
                  오늘 교육
                </button>
                <button className={filter === "needed" ? "primary-action compact" : "ghost-button compact"} onClick={() => setFilter("needed")} type="button">
                  서명 필요
                </button>
                <button className={filter === "all" ? "primary-action compact" : "ghost-button compact"} onClick={() => setFilter("all")} type="button">
                  전체 대상 교육
                </button>
              </div>
              <label className="checkbox-line">
                <input checked={excludeSigned} onChange={(event) => void handleExcludeSignedChange(event.target.checked)} type="checkbox" />
                <span>이미 서명 완료 제외</span>
              </label>
            </div>

            <div className="training-list">
              {visibleGroups.length ? (
                visibleGroups.map((group) => {
                  const selectableIds = group.items.filter((item) => item.selectable).map((item) => item.trainingId);
                  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

                  return (
                    <article className="training-card" key={group.date}>
                      <div className="status-card-head">
                        <div>
                          <span className="status-chip status-review">{group.date}</span>
                          <strong>{group.date} 교육</strong>
                          <p>선택 가능 {selectableIds.length}건</p>
                        </div>
                        <button className="ghost-button compact" disabled={!selectableIds.length} onClick={() => toggleDate(group)} type="button">
                          {allSelected ? "전체 해제" : `${group.date} 전체 선택`}
                        </button>
                      </div>
                      <div className="training-list">
                        {group.items.map((item) => (
                          <label className="training-card attendance-training-card" key={item.trainingId}>
                            <div className="status-card-head">
                              <div>
                                <strong>{item.title}</strong>
                                <p>{[item.date, item.time, item.place].filter(Boolean).join(" · ") || "교육 정보 미입력"}</p>
                              </div>
                              <input
                                checked={selectedIds.includes(item.trainingId)}
                                disabled={!item.selectable}
                                onChange={() => toggleTraining(item.trainingId)}
                                type="checkbox"
                              />
                            </div>
                            <div className="badge-row">
                              <span>{item.signatureDone ? "출석 인정" : "서명 제출 시 출석 인정"}</span>
                              <span>{item.signatureDone ? "서명 완료" : "서명 필요"}</span>
                              {!item.selectable && item.blockedReason ? <span>{item.blockedReason}</span> : null}
                            </div>
                          </label>
                        ))}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-training">
                  <div>
                    <strong>표시할 전자서명 대상 교육이 없습니다.</strong>
                    <p>필터를 변경하거나 관리자에게 교육대상/출석 상태를 확인해 주세요.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {staff && !signatureExists?.exists && step !== "complete" ? (
          <section className="training-section" aria-label="선택 요약 및 서명">
            <div className="section-head">
              <div>
                <h2>선택 요약</h2>
                <p>선택한 교육 {selectedItems.length}건{selectedDateLabel ? ` · ${selectedDateLabel}` : ""}</p>
              </div>
              <div className="badge-row">
                {selectedItems.slice(0, 4).map((item) => (
                  <span key={item.trainingId}>{item.title}</span>
                ))}
                {selectedItems.length > 4 ? <span>외 {selectedItems.length - 4}건</span> : null}
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
                {step === "saving" ? "저장 중" : `선택한 교육 ${selectedItems.length}건에 서명 저장`}
              </button>
            </div>
          </section>
        ) : null}

        {step === "complete" && bulkResult ? (
          <section className="today-card" aria-label="전자서명 완료">
            <div className="today-copy">
              <div className="section-kicker">
                <CheckIcon />
                <span>저장 완료</span>
              </div>
              <h2>전자서명이 완료되었습니다.</h2>
              <p>완료된 교육 {bulkResult.savedCount}건</p>
              <div className="badge-row">
                {bulkResult.rows.map((row) => (
                  <span key={row.signatureId}>{row.trainingTitle}</span>
                ))}
              </div>
              {bulkResult.skipped.length ? (
                <p>건너뛴 교육 {bulkResult.skippedCount}건: {bulkResult.skipped.map((item) => `${item.title || item.trainingId}(${item.reason})`).join(", ")}</p>
              ) : null}
              <div className="route-actions">
                <a className="primary-action" href={pageHref("/my-status")}>
                  내 이수현황 보기
                </a>
                <a className="ghost-button" href={pageHref("/")}>
                  홈으로
                </a>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
