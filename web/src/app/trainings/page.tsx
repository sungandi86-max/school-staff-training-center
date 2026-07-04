"use client";

import { getTrainingList, loadAppConfig } from "@/lib/apps-script";
import type { Training } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

function ListIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <rect height="14" rx="2" width="16" x="4" y="5" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function trainingMeta(training: Training) {
  return [training.date, training.time, training.place ?? training.location, training.department].filter(Boolean).join(" · ");
}

function isActive(training: Training) {
  return (training.status ?? training.activeStatus ?? "").trim() === "활성";
}

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
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

      const result = await getTrainingList(configResult.config);

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

  const activeTrainings = useMemo(() => trainings.filter(isActive), [trainings]);

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">교육목록</span>
          <button className="ghost-button" onClick={() => window.history.back()} type="button">
            뒤로가기
          </button>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
        </div>

        <section className="today-card page-hero-card" aria-label="교육목록">
          <div className="today-copy">
            <div className="section-kicker">
              <ListIcon />
              <span>교육목록</span>
            </div>
            <h1>학교에서 운영 중인 교육을 확인합니다.</h1>
            <p>활성 교육의 일정, 장소, QR 출석 여부와 이수증 제출 여부를 한눈에 볼 수 있습니다.</p>
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
            <span>활성 교육</span>
            <strong>{activeTrainings.length}</strong>
          </div>
          <div className="status-summary-card">
            <span>QR 출석</span>
            <strong>{activeTrainings.filter((training) => training.qrEnabled).length}</strong>
          </div>
          <div className="status-summary-card">
            <span>이수증 제출</span>
            <strong>{activeTrainings.filter((training) => training.certificateRequired).length}</strong>
          </div>
        </section>

        <section className="training-section" aria-label="활성 교육 목록">
          <div className="section-head">
            <div>
              <h2>활성 교육</h2>
              <p>현재 출석과 제출 흐름에 연결된 교육만 먼저 표시합니다.</p>
            </div>
          </div>

          {activeTrainings.length ? (
            <div className="training-list">
              {activeTrainings.map((training) => (
                <article className="training-card" key={training.trainingId}>
                  <div className="status-card-head">
                    <div>
                      <strong>{training.title || training.trainingId}</strong>
                      <p>{trainingMeta(training) || training.trainingId}</p>
                    </div>
                    <span className="status-chip status-completed">활성</span>
                  </div>
                  <div className="badge-row">
                    {training.category ? <span>{training.category}</span> : null}
                    <span>{training.qrEnabled ? "QR 출석" : "QR 미사용"}</span>
                    <span>{training.signatureRequired ? "전자서명 필요" : "전자서명 없음"}</span>
                    {training.certificateRequired ? <span>이수증 제출 필요</span> : null}
                  </div>
                  <div className="route-actions">
                    {training.qrEnabled ? (
                      <a className="primary-action" href={`${APP_BASE_PATH}/attendance?trainingId=${encodeURIComponent(training.trainingId)}`}>
                        QR 출석하기
                      </a>
                    ) : null}
                    {training.certificateRequired ? (
                      <a className="ghost-button" href={`${APP_BASE_PATH}/certificate/`}>
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
                <strong>등록된 활성 교육이 없습니다.</strong>
                <p>관리자 메뉴에서 교육목록을 확인하거나 허브 시트의 활성상태를 확인해 주세요.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
