"use client";

import { getTrainingList, loadAppConfig } from "@/lib/apps-script";
import { getBasePath } from "@/lib/paths";
import type { Training } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type TrainingFilter = "all" | "active" | "signature" | "certificate" | "inactive";

const APP_BASE_PATH = getBasePath();

const FILTERS: Array<{ key: TrainingFilter; label: string }> = [
  { key: "all", label: "전체" },
  { key: "active", label: "진행중/활성" },
  { key: "signature", label: "전자서명 필요" },
  { key: "certificate", label: "이수증 제출 필요" },
  { key: "inactive", label: "종료/비활성" }
];

function ListIcon() {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.85"
      viewBox="0 0 24 24"
    >
      <rect height="14" rx="2" width="16" x="4" y="5" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function pageHref(path: string) {
  return path === "/" ? `${APP_BASE_PATH}/` : `${APP_BASE_PATH}${path}`;
}

function normalizedStatus(training: Training) {
  return (training.status ?? training.activeStatus ?? "").trim().toLowerCase();
}

function isActive(training: Training) {
  const status = normalizedStatus(training);
  return ["활성", "진행중", "준비중", "active", "ready", "y", "yes", "사용"].includes(status);
}

function isFutureDate(date: string) {
  if (!date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const trainingDate = new Date(date);
  if (Number.isNaN(trainingDate.getTime())) {
    return false;
  }

  trainingDate.setHours(0, 0, 0, 0);
  return trainingDate.getTime() > today.getTime();
}

function statusLabel(training: Training) {
  if (!isActive(training)) {
    return "종료/비활성";
  }

  return isFutureDate(training.date) ? "준비중" : "진행중/활성";
}

function statusClass(training: Training) {
  if (!isActive(training)) {
    return "status-chip status-incomplete";
  }

  return isFutureDate(training.date) ? "status-chip status-review" : "status-chip status-completed";
}

function trainingMeta(training: Training) {
  return [training.date, training.time, training.place ?? training.location, training.department].filter(Boolean).join(" · ");
}

function compareTrainings(a: Training, b: Training) {
  const aTime = Date.parse(a.date || "");
  const bTime = Date.parse(b.date || "");

  if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
    return aTime - bTime;
  }

  return (a.title || a.trainingId).localeCompare(b.title || b.trainingId, "ko");
}

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [message, setMessage] = useState("교육목록을 불러오는 중입니다.");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TrainingFilter>("all");

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

      const result = await getTrainingList(configResult.config, { includeInactive: true });

      if (ignore) {
        return;
      }

      setTrainings(result.data);
      setMessage(result.error || "");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredTrainings = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return trainings
      .filter((training) => {
        if (!keyword) {
          return true;
        }

        return [training.title, training.department, training.category]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));
      })
      .filter((training) => {
        if (filter === "active") {
          return isActive(training);
        }

        if (filter === "signature") {
          return training.signatureRequired;
        }

        if (filter === "certificate") {
          return Boolean(training.certificateRequired);
        }

        if (filter === "inactive") {
          return !isActive(training);
        }

        return true;
      })
      .sort(compareTrainings);
  }, [filter, query, trainings]);

  const activeCount = useMemo(() => trainings.filter(isActive).length, [trainings]);
  const signatureCount = useMemo(() => trainings.filter((training) => training.signatureRequired).length, [trainings]);
  const certificateCount = useMemo(() => trainings.filter((training) => training.certificateRequired).length, [trainings]);

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">교육목록</span>
          <button className="ghost-button" onClick={() => window.history.back()} type="button">
            뒤로가기
          </button>
          <a className="ghost-button" href={pageHref("/")}>
            홈으로
          </a>
        </div>

        <section className="today-card page-hero-card" aria-label="교육목록 안내">
          <div className="today-copy">
            <div className="section-kicker">
              <ListIcon />
              <span>TRAINING LIST</span>
            </div>
            <h1>학교에서 등록한 교육을 확인합니다.</h1>
            <p>교육별 일정과 장소, 전자서명, 이수증 제출 필요 여부를 한눈에 확인합니다. QR 출석은 교육장에 비치된 QR을 통해 진행합니다.</p>
          </div>
        </section>

        {message ? (
          <div className="soft-alert" role="status">
            {message}
          </div>
        ) : null}

        <section className="status-summary-grid" aria-label="교육목록 요약">
          <div className="status-summary-card">
            <span>전체 교육</span>
            <strong>{trainings.length}</strong>
          </div>
          <div className="status-summary-card">
            <span>진행중/활성</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="status-summary-card">
            <span>현장 QR 운영</span>
            <strong>{trainings.filter((training) => training.qrEnabled).length}</strong>
          </div>
          <div className="status-summary-card">
            <span>전자서명/이수증</span>
            <strong>{signatureCount + certificateCount}</strong>
          </div>
        </section>

        <section className="training-section" aria-label="교육 검색과 필터">
          <div className="section-head">
            <div>
              <h2>교육 찾기</h2>
              <p>교육명, 담당부서, 교육구분으로 검색하고 필요한 업무 유형만 모아볼 수 있습니다.</p>
            </div>
            <span className="status-chip status-review">{filteredTrainings.length}개 표시</span>
          </div>

          <div className="training-card">
            <label className="field-group">
              검색
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="교육명, 담당부서, 교육구분 검색"
                type="search"
                value={query}
              />
            </label>
            <div className="badge-row" aria-label="교육 필터">
              {FILTERS.map((option) => (
                <button
                  className={filter === option.key ? "primary-action compact" : "ghost-button compact"}
                  key={option.key}
                  onClick={() => setFilter(option.key)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="training-section" aria-label="교육목록">
          <div className="section-head">
            <div>
              <h2>전체 교육</h2>
              <p>일반 교직원에게 필요한 전자서명과 이수증 제출 이동 버튼만 표시합니다.</p>
            </div>
          </div>

          {filteredTrainings.length ? (
            <div className="training-list">
              {filteredTrainings.map((training) => (
                <article className="training-card" key={training.trainingId}>
                  <div className="status-card-head">
                    <div>
                      <span className={statusClass(training)}>{statusLabel(training)}</span>
                      <p>{training.department || "담당부서 미입력"}</p>
                      <strong>{training.title || training.trainingId || "교육명 미입력"}</strong>
                      <p>{trainingMeta(training) || training.trainingId}</p>
                    </div>
                  </div>

                  <dl className="qr-training-info">
                    <div>
                      <dt>교육일자</dt>
                      <dd>{training.date || "-"}</dd>
                    </div>
                    <div>
                      <dt>교육시간</dt>
                      <dd>{training.time || "-"}</dd>
                    </div>
                    <div>
                      <dt>장소</dt>
                      <dd>{training.place || training.location || "-"}</dd>
                    </div>
                    <div>
                      <dt>교육구분</dt>
                      <dd>{training.category || "-"}</dd>
                    </div>
                  </dl>

                  <div className="badge-row">
                    <span>{training.qrEnabled ? "현장 QR 운영" : "QR 미사용"}</span>
                    <span>{training.signatureRequired ? "전자서명 필요" : "전자서명 없음"}</span>
                    <span>{training.certificateRequired ? "이수증 제출 필요" : "이수증 제출 없음"}</span>
                    <span>{training.status || training.activeStatus || "상태 미입력"}</span>
                  </div>

                  <div className="route-actions">
                    {training.signatureRequired ? (
                      <a className="ghost-button" href={pageHref("/signature")}>
                        전자서명
                      </a>
                    ) : null}
                    {training.certificateRequired ? (
                      <a className="ghost-button" href={pageHref("/certificate")}>
                        이수증 제출
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-training">
              <div>
                <strong>조건에 맞는 교육이 없습니다.</strong>
                <p>검색어를 줄이거나 필터를 전체로 변경해 주세요. 등록된 교육이 없다면 학교 담당자에게 교육목록 등록을 요청해 주세요.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
