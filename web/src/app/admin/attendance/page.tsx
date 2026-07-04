"use client";

import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";
import { getTrainingAttendanceStatus, getTrainingList, loadAppConfig } from "@/lib/apps-script";
import type { AdminAttendanceStatusGroup, AdminAttendanceStatusItem, AdminAttendanceStatusResult, AppConfig, Training } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

type StatusFilter = "all" | AdminAttendanceStatusGroup;

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: "전체", value: "all" },
  { label: "완료", value: "completed" },
  { label: "서명 필요", value: "signature" },
  { label: "미출석", value: "absent" }
];

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

function statusClassName(statusGroup: AdminAttendanceStatusGroup) {
  if (statusGroup === "signature") {
    return "status-chip status-review";
  }

  if (statusGroup === "absent") {
    return "status-chip status-incomplete";
  }

  return "status-chip status-completed";
}

function quoteCsv(value: string | number | boolean | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function buildCsv(rows: AdminAttendanceStatusItem[]) {
  const header = ["성명", "부서", "직위", "대상여부", "출석여부", "출석일시", "서명여부", "최종상태"];
  const body = rows.map((row) => [
    row.name,
    row.department,
    row.position,
    row.isTarget ? "대상" : "제외",
    row.attendanceCompleted ? "출석" : "미출석",
    row.attendedAt ?? "",
    row.signatureRequired ? (row.signatureCompleted ? "서명 완료" : "서명 필요") : "서명 불필요",
    row.finalStatus
  ]);

  return [header, ...body].map((line) => line.map(quoteCsv).join(",")).join("\n");
}

export default function AdminAttendancePage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<AdminAttendanceStatusResult>();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [message, setMessage] = useState("교육목록을 불러오는 중입니다.");

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
      setMessage(activeTrainings.length ? "출석현황을 확인할 교육을 선택해 주세요." : "활성 교육이 없습니다.");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadAttendanceStatus() {
      if (!runtimeConfig || !selectedTrainingId) {
        setAttendanceStatus(undefined);
        return;
      }

      setMessage("선택한 교육의 출석현황을 불러오는 중입니다.");
      const result = await getTrainingAttendanceStatus(runtimeConfig, selectedTrainingId);

      if (ignore) {
        return;
      }

      if (result.error || !result.data) {
        setAttendanceStatus(undefined);
        setMessage(result.error || "출석현황을 불러오지 못했습니다.");
        return;
      }

      setAttendanceStatus(result.data);
      setMessage("출석현황을 불러왔습니다.");
    }

    void loadAttendanceStatus();

    return () => {
      ignore = true;
    };
  }, [runtimeConfig, selectedTrainingId]);

  const selectedTraining = trainings.find((training) => training.trainingId === selectedTrainingId);
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (attendanceStatus?.items ?? []).filter((item) => {
      const matchesStatus = statusFilter === "all" || item.statusGroup === statusFilter;
      const haystack = [item.name, item.department, item.position, item.finalStatus].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [attendanceStatus?.items, query, statusFilter]);

  function handleDownloadCsv() {
    const csv = `\uFEFF${buildCsv(filteredItems)}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedTrainingId || "attendance"}-status.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminAuthGate>
      <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">출석현황</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
          <a className="ghost-button" href={`${APP_BASE_PATH}/admin`}>
            관리자 메뉴
          </a>
          <AdminLogoutButton />
        </div>

        <section className="today-card" aria-label="출석현황">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>출석현황</span>
            </div>
            <h1>교육별 출석과 전자서명 상태를 확인합니다.</h1>
            <p>대상자 기준으로 출석 완료, 서명 완료, 미완료 인원을 한눈에 확인할 수 있습니다.</p>
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
                <p>출석현황을 확인할 활성 교육을 선택하세요.</p>
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

          <section className="training-section" aria-label="출석현황 상세">
            <div className="section-head">
              <div>
                <h2>{selectedTraining?.title ?? "출석현황"}</h2>
                <p>{selectedTraining ? trainingMeta(selectedTraining) : "교육을 선택하면 대상자 현황이 표시됩니다."}</p>
              </div>
              <button className="ghost-button" disabled={!filteredItems.length} onClick={handleDownloadCsv} type="button">
                CSV 다운로드
              </button>
            </div>

            {attendanceStatus ? (
              <>
                <section className="status-summary-grid" aria-label="출석현황 요약">
                  <div className="status-summary-card">
                    <span>대상자 수</span>
                    <strong>{attendanceStatus.summary.targetCount}</strong>
                  </div>
                  <div className="status-summary-card">
                    <span>출석 완료</span>
                    <strong>{attendanceStatus.summary.attendanceCompleted}</strong>
                  </div>
                  <div className="status-summary-card">
                    <span>서명 완료</span>
                    <strong>{attendanceStatus.summary.signatureCompleted}</strong>
                  </div>
                  <div className="status-summary-card">
                    <span>미완료</span>
                    <strong>{attendanceStatus.summary.incomplete}</strong>
                  </div>
                </section>

                <div className="admin-attendance-controls">
                  <label className="field-group">
                    <span>검색</span>
                    <input onChange={(event) => setQuery(event.target.value)} placeholder="성명, 부서, 직위 검색" type="search" value={query} />
                  </label>
                  <div className="filter-pills" aria-label="상태 필터">
                    {STATUS_FILTERS.map((filter) => (
                      <button
                        className={filter.value === statusFilter ? "filter-pill active" : "filter-pill"}
                        key={filter.value}
                        onClick={() => setStatusFilter(filter.value)}
                        type="button"
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredItems.length ? (
                  <>
                    <div className="admin-attendance-table-wrap">
                      <table className="admin-attendance-table">
                        <thead>
                          <tr>
                            <th>성명</th>
                            <th>부서</th>
                            <th>직위</th>
                            <th>대상</th>
                            <th>출석</th>
                            <th>출석일시</th>
                            <th>서명</th>
                            <th>최종상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map((item) => (
                            <tr key={`${item.trainingId}-${item.staffId}`}>
                              <td>{item.name || "-"}</td>
                              <td>{item.department || "-"}</td>
                              <td>{item.position || "-"}</td>
                              <td>{item.isTarget ? "대상" : "제외"}</td>
                              <td>{item.attendanceCompleted ? "완료" : "미출석"}</td>
                              <td>{item.attendedAt || "-"}</td>
                              <td>{item.signatureRequired ? (item.signatureCompleted ? "완료" : "필요") : "불필요"}</td>
                              <td>
                                <span className={statusClassName(item.statusGroup)}>{item.finalStatus}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="admin-attendance-cards">
                      {filteredItems.map((item) => (
                        <article className="training-card status-card" key={`${item.trainingId}-${item.staffId}`}>
                          <div className="status-card-head">
                            <div>
                              <strong>{item.name || "-"}</strong>
                              <p>
                                {item.department || "부서 미입력"} · {item.position || "직위 미입력"}
                              </p>
                            </div>
                            <span className={statusClassName(item.statusGroup)}>{item.finalStatus}</span>
                          </div>
                          <div className="badge-row">
                            <span>{item.isTarget ? "대상" : "제외"}</span>
                            <span>{item.attendanceCompleted ? "출석 완료" : "미출석"}</span>
                            <span>{item.signatureRequired ? (item.signatureCompleted ? "서명 완료" : "서명 필요") : "서명 불필요"}</span>
                          </div>
                          {item.attendedAt ? <p>출석일시: {item.attendedAt}</p> : null}
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="soft-alert" role="status">
                    검색 또는 필터 조건에 맞는 대상자가 없습니다.
                  </div>
                )}
              </>
            ) : (
              <div className="empty-training">
                <div>
                  <strong>출석현황 대기 중</strong>
                  <p>교육을 선택하면 대상자별 출석과 서명 상태가 표시됩니다.</p>
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
