"use client";

import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";
import { generateFinalAttendanceSheet, getFinalAttendancePreview, getTrainingList, loadAppConfig } from "@/lib/apps-script";
import type { AppConfig, FinalAttendancePreviewResult, FinalAttendanceRow, Training } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function trainingMeta(training?: Training) {
  if (!training) {
    return "";
  }

  return [training.date, training.time, training.place ?? training.location, training.department].filter(Boolean).join(" · ");
}

function quoteCsv(value: string | number | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function buildCsv(rows: FinalAttendanceRow[]) {
  const header = ["순번", "교육ID", "교육명", "교육일자", "성명", "부서", "직위", "출석일시", "서명여부", "서명파일URL", "이수상태", "비고"];
  const body = rows.map((row) => [
    row.sequence,
    row.trainingId,
    row.trainingTitle,
    row.trainingDate,
    row.name,
    row.department,
    row.position,
    row.attendedAt,
    row.signatureStatus,
    row.signatureFileUrl,
    row.completionStatus,
    row.note ?? ""
  ]);

  return [header, ...body].map((line) => line.map(quoteCsv).join(",")).join("\n");
}

function sanitizeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|\s]+/g, "").slice(0, 28) || "교육";
}

function downloadCsv(filename: string, rows: FinalAttendanceRow[]) {
  const csv = `\uFEFF${buildCsv(rows)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function statusClassName(status: FinalAttendanceRow["completionStatus"]) {
  if (status === "이수완료") {
    return "status-chip status-completed";
  }

  if (status === "서명필요") {
    return "status-chip status-review";
  }

  return "status-chip status-incomplete";
}

export default function AdminFinalSheetPage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");
  const [preview, setPreview] = useState<FinalAttendancePreviewResult>();
  const [message, setMessage] = useState("교육목록을 불러오는 중입니다.");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      const configResult = await loadAppConfig();

      if (ignore) {
        return;
      }

      if (!configResult.ok) {
        setMessage(configResult.message);
        return;
      }

      setRuntimeConfig(configResult.config);
      const trainingResult = await getTrainingList(configResult.config);

      if (ignore) {
        return;
      }

      if (trainingResult.error) {
        setMessage(trainingResult.error);
        return;
      }

      const activeTrainings = trainingResult.data.filter((training) => (training.status ?? training.activeStatus ?? "").trim() === "활성");
      setTrainings(activeTrainings);
      setSelectedTrainingId(activeTrainings[0]?.trainingId ?? "");
      setMessage(activeTrainings.length ? "최종 서명부를 생성할 교육을 선택해 주세요." : "활성 교육이 없습니다.");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadPreview() {
      if (!runtimeConfig || !selectedTrainingId) {
        setPreview(undefined);
        return;
      }

      setMessage("최종 서명부 미리보기를 생성하는 중입니다.");
      const result = await getFinalAttendancePreview(runtimeConfig, selectedTrainingId);

      if (ignore) {
        return;
      }

      if (result.error || !result.data) {
        setPreview(undefined);
        setMessage(result.error || "최종 서명부 미리보기를 불러오지 못했습니다.");
        return;
      }

      setPreview(result.data);
      setMessage("최종 서명부 미리보기를 불러왔습니다.");
    }

    void loadPreview();

    return () => {
      ignore = true;
    };
  }, [runtimeConfig, selectedTrainingId]);

  const selectedTraining = trainings.find((training) => training.trainingId === selectedTrainingId);
  const filename = useMemo(() => {
    const title = sanitizeFilename(selectedTraining?.title ?? preview?.training.title ?? "");
    return `최종서명부_${selectedTrainingId}_${title}.csv`;
  }, [preview?.training.title, selectedTraining?.title, selectedTrainingId]);

  async function handleDownload() {
    if (!runtimeConfig || !selectedTrainingId || !preview?.rows.length) {
      setMessage("다운로드할 최종 서명부 데이터가 없습니다.");
      return;
    }

    setIsGenerating(true);
    setMessage("최종 서명부를 기록하고 CSV를 준비하는 중입니다.");

    const result = await generateFinalAttendanceSheet(runtimeConfig, selectedTrainingId);

    if (result.error || !result.data) {
      setMessage(result.error || "최종 서명부 생성에 실패했습니다.");
      setIsGenerating(false);
      return;
    }

    downloadCsv(filename, result.data.rows);
    setPreview({
      training: result.data.training,
      summary: result.data.summary,
      rows: result.data.rows
    });
    setMessage(`08_최종서명부에 ${result.data.writtenCount}건을 기록하고 CSV를 다운로드했습니다.`);
    setIsGenerating(false);
  }

  return (
    <AdminAuthGate>
      <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">최종 서명부</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
          <a className="ghost-button" href={`${APP_BASE_PATH}/admin`}>
            관리자 메뉴
          </a>
          <AdminLogoutButton />
        </div>

        <section className="today-card" aria-label="최종 서명부">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>최종 서명부</span>
            </div>
            <h1>감사·증빙용 최종 서명부를 생성합니다.</h1>
            <p>교육별 대상자의 출석과 전자서명 기록을 기준으로 CSV 서명부를 다운로드합니다.</p>
          </div>
        </section>

        {message ? (
          <div className="soft-alert" role="status">
            {message}
          </div>
        ) : null}

        <div className="admin-attendance-layout">
          <section className="training-section" aria-label="교육 선택">
            <div className="section-head">
              <div>
                <h2>교육 선택</h2>
                <p>최종 서명부를 생성할 활성 교육을 선택하세요.</p>
              </div>
            </div>

            {trainings.length ? (
              <div className="status-list">
                {trainings.map((training) => (
                  <button
                    className={`training-card qr-training-option${training.trainingId === selectedTrainingId ? " selected" : ""}`}
                    key={training.trainingId}
                    onClick={() => setSelectedTrainingId(training.trainingId)}
                    type="button"
                  >
                    <strong>{training.title}</strong>
                    <p>{trainingMeta(training)}</p>
                    <div className="badge-row">
                      <span>{training.trainingId}</span>
                      <span>{training.signatureRequired ? "서명 필요" : "서명 없음"}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-training">
                <div>
                  <strong>활성 교육이 없습니다.</strong>
                  <p>교육목록에서 활성 교육을 먼저 등록해 주세요.</p>
                </div>
              </div>
            )}
          </section>

          <section className="training-section" aria-label="최종 서명부 미리보기">
            <div className="section-head">
              <div>
                <h2>{selectedTraining?.title ?? "최종 서명부 미리보기"}</h2>
                <p>{selectedTraining ? trainingMeta(selectedTraining) : "교육을 선택하면 최종 서명부 미리보기가 표시됩니다."}</p>
              </div>
              <button className="primary-action" disabled={!preview?.rows.length || isGenerating} onClick={handleDownload} type="button">
                {isGenerating ? "생성 중" : "CSV 다운로드"}
              </button>
            </div>

            <div className="soft-alert" role="note">
              이 자료는 연수 증빙용으로 사용됩니다.
            </div>

            {preview ? (
              <>
                <section className="status-summary-grid" aria-label="최종 서명부 요약">
                  <div className="status-summary-card">
                    <span>대상자 수</span>
                    <strong>{preview.summary.targetCount}</strong>
                  </div>
                  <div className="status-summary-card">
                    <span>이수완료</span>
                    <strong>{preview.summary.completed}</strong>
                  </div>
                  <div className="status-summary-card">
                    <span>서명필요</span>
                    <strong>{preview.summary.signatureRequired}</strong>
                  </div>
                  <div className="status-summary-card">
                    <span>미이수</span>
                    <strong>{preview.summary.incomplete}</strong>
                  </div>
                </section>

                {preview.rows.length ? (
                  <>
                    <div className="admin-attendance-table-wrap">
                      <table className="admin-attendance-table final-sheet-table">
                        <thead>
                          <tr>
                            <th>순번</th>
                            <th>성명</th>
                            <th>부서</th>
                            <th>직위</th>
                            <th>출석일시</th>
                            <th>서명여부</th>
                            <th>이수상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row) => (
                            <tr key={`${row.trainingId}-${row.sequence}-${row.name}`}>
                              <td>{row.sequence}</td>
                              <td>{row.name || "-"}</td>
                              <td>{row.department || "-"}</td>
                              <td>{row.position || "-"}</td>
                              <td>{row.attendedAt || "-"}</td>
                              <td>{row.signatureStatus}</td>
                              <td>
                                <span className={statusClassName(row.completionStatus)}>{row.completionStatus}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="admin-attendance-cards">
                      {preview.rows.map((row) => (
                        <article className="training-card status-card" key={`${row.trainingId}-${row.sequence}-${row.name}`}>
                          <div className="status-card-head">
                            <div>
                              <strong>
                                {row.sequence}. {row.name || "-"}
                              </strong>
                              <p>
                                {row.department || "부서 미입력"} · {row.position || "직위 미입력"}
                              </p>
                            </div>
                            <span className={statusClassName(row.completionStatus)}>{row.completionStatus}</span>
                          </div>
                          <div className="badge-row">
                            <span>{row.attendedAt ? "출석 완료" : "미출석"}</span>
                            <span>서명 {row.signatureStatus}</span>
                          </div>
                          {row.attendedAt ? <p>출석일시: {row.attendedAt}</p> : null}
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="soft-alert" role="status">
                    최종 서명부에 포함할 대상자가 없습니다.
                  </div>
                )}
              </>
            ) : (
              <div className="empty-training">
                <div>
                  <strong>미리보기 대기 중</strong>
                  <p>교육을 선택하면 최종 서명부 미리보기가 표시됩니다.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      </main>
    </AdminAuthGate>
  );
}
