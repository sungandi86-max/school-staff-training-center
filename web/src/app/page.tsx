"use client";

import { DEFAULT_CONFIG, getSchoolConfig, getTrainingList, loadAppConfig } from "@/lib/apps-script";
import type { SchoolConfig, Training } from "@/lib/types";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

type IconName =
  | "appLogo"
  | "home"
  | "list"
  | "status"
  | "upload"
  | "admin"
  | "bell"
  | "calendar"
  | "qr"
  | "signature"
  | "print"
  | "chart"
  | "file"
  | "shield"
  | "pin"
  | "chevron"
  | "check";

const iconPaths: Record<IconName, ReactNode> = {
  appLogo: (
    <>
      <path d="M12 4.5c2.1-2 5.6-1.2 6.2 1.8.5 2.8-1.9 5.2-6.2 7.8-4.3-2.6-6.7-5-6.2-7.8.6-3 4.1-3.8 6.2-1.8Z" />
      <path d="M5 16.2c2.1 1.4 4.4 2.1 7 2.1s4.9-.7 7-2.1" />
    </>
  ),
  home: (
    <>
      <path d="m3 10.5 9-7 9 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  list: (
    <>
      <rect width="16" height="14" x="4" y="5" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </>
  ),
  status: (
    <>
      <path d="M9 11.5 12 14.5 21 5.5" />
      <path d="M20 12v6.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2H15" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 15v4.5h14V15" />
    </>
  ),
  admin: (
    <>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-2 3.4-.2-.1a1.8 1.8 0 0 0-1.9-.1 1.7 1.7 0 0 0-.9 1.5v.2H9.2v-.2a1.7 1.7 0 0 0-.9-1.5 1.8 1.8 0 0 0-1.9.1l-.2.1-2-3.4.1-.1A1.6 1.6 0 0 0 4.6 15 1.7 1.7 0 0 0 3.2 14H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1 2-3.4.2.1a1.8 1.8 0 0 0 1.9.1 1.7 1.7 0 0 0 .9-1.5v-.2h5.6v.2a1.7 1.7 0 0 0 .9 1.5 1.8 1.8 0 0 0 1.9-.1l.2-.1 2 3.4-.1.1A1.6 1.6 0 0 0 19.4 9a1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <rect width="18" height="17" x="3" y="5" rx="3" />
      <path d="M3 10h18" />
    </>
  ),
  qr: (
    <>
      <rect width="6" height="6" x="4" y="4" rx="1.4" />
      <rect width="6" height="6" x="14" y="4" rx="1.4" />
      <rect width="6" height="6" x="4" y="14" rx="1.4" />
      <path d="M15 15h2v2h-2z" />
      <path d="M20 15v5h-5" />
      <path d="M20 20h-2" />
    </>
  ),
  signature: (
    <>
      <path d="M4 20h16" />
      <path d="M5.5 16c2.5-5.4 4.2-7.5 5.7-7.5 2.1 0 1.2 3.8 3 3.8 1.1 0 2-1.1 3.2-3.2" />
      <path d="m17.7 5.1 1.7-1.7 1.2 1.2-1.7 1.7" />
    </>
  ),
  print: (
    <>
      <path d="M6 9V4h12v5" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
  chart: (
    <>
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
      <path d="M3 19h18" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
      <path d="M8 14h8" />
      <path d="M8 18h5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5.2-8 12-8 12s-8-6.8-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.8" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="M20 6 9 17l-5-5" />
};

const navItems = [
  { title: "홈", href: "/", icon: "home" as IconName, active: true },
  { title: "교육목록", href: "/trainings", icon: "list" as IconName },
  { title: "전자서명", href: "/signature", icon: "signature" as IconName },
  { title: "내 이수현황", href: "/my-status", icon: "status" as IconName },
  { title: "이수증 제출", href: "/certificate", icon: "upload" as IconName }
];

const featureCards = [
  {
    title: "내 이수현황",
    description: "내가 완료한 교육과 남은 교육을 확인합니다.",
    action: "확인하기",
    href: "/my-status",
    icon: "status" as IconName,
    tone: "green"
  },
  {
    title: "전자서명",
    description: "서명이 필요한 교육을 확인하고 전자서명을 제출합니다.",
    action: "서명하기",
    href: "/signature",
    icon: "signature" as IconName,
    tone: "pink"
  },
  {
    title: "이수증 제출",
    description: "외부 연수 이수증을 업로드하여 담당자 확인을 요청합니다.",
    action: "제출하기",
    href: "/certificate",
    icon: "upload" as IconName,
    tone: "lavender"
  },
  {
    title: "교육목록",
    description: "학교에서 등록한 교직원 교육 일정과 제출 필요 여부를 확인합니다.",
    action: "목록보기",
    href: "/trainings",
    icon: "list" as IconName,
    tone: "blue"
  }
];

const APP_BASE_PATH = "/school-staff-training-center";

function Icon({ name }: { name: IconName }) {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      {iconPaths[name]}
    </svg>
  );
}

function isActiveTraining(activeStatus?: string) {
  if (!activeStatus) {
    return false;
  }

  return ["활성", "진행중", "준비중", "active", "ready", "y", "yes", "사용"].includes(activeStatus.trim().toLowerCase());
}

function formatTrainingMeta(date?: string, time?: string, location?: string) {
  return [date, time, location].filter(Boolean).join(" · ") || "교육 정보 확인 필요";
}

function pageHref(path: string) {
  return path === "/" ? `${APP_BASE_PATH}/` : `${APP_BASE_PATH}${path}/`;
}

function parseTrainingDate(date?: string) {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function findNearestActiveTraining(trainings: Training[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const today = now.getTime();
  const futureTrainings = trainings
    .filter((training) => parseTrainingDate(training.date) >= today)
    .sort((a, b) => parseTrainingDate(a.date) - parseTrainingDate(b.date));

  return futureTrainings[0] ?? trainings[0];
}

export default function HomePage() {
  const [config, setConfig] = useState<SchoolConfig>(DEFAULT_CONFIG);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [notice, setNotice] = useState("학교 설정을 불러오는 중입니다.");
  const [setupMessage, setSetupMessage] = useState<string>();

  useEffect(() => {
    let ignore = false;

    async function loadHomeData() {
      const runtimeConfig = await loadAppConfig();

      if (ignore) {
        return;
      }

      setConfig(runtimeConfig.schoolConfig);

      if (!runtimeConfig.ok) {
        setSetupMessage(runtimeConfig.message);
        setNotice("");
        return;
      }

      setSetupMessage(undefined);

      const [configResult, trainingResult] = await Promise.all([
        getSchoolConfig(runtimeConfig.config),
        getTrainingList(runtimeConfig.config)
      ]);

      if (ignore) {
        return;
      }

      setConfig(configResult.data);
      setTrainings(trainingResult.data);

      if (configResult.error || trainingResult.error) {
        setNotice("학교 데이터 연결을 준비 중입니다. Apps Script URL 설정을 확인해주세요.");
      } else {
        setNotice("");
      }
    }

    void loadHomeData();

    return () => {
      ignore = true;
    };
  }, []);

  const activeTrainings = useMemo(
    () => trainings.filter((training) => isActiveTraining(training.status ?? training.activeStatus)),
    [trainings]
  );

  const activeTraining = useMemo(() => findNearestActiveTraining(activeTrainings), [activeTrainings]);

  const displaySchoolName = config.schoolName || "학교명 미설정";

  const themeStyle = {
    "--school-primary": config.primaryColor,
    "--surface-soft": config.secondaryColor
  } as CSSProperties;

  return (
    <main className="page" style={themeStyle}>
      <div className="dashboard-shell home-shell">
        <header className="top-header">
          <div className="brand-group">
            <div className="brand-logo" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {config.schoolLogoUrl ? <img src={config.schoolLogoUrl} alt="" /> : <Icon name="appLogo" />}
            </div>
            <div className="brand-copy">
              <p>School Health Hub</p>
              <h1>{config.centerName || "학교 교직원 교육센터"}</h1>
              <span>연수 증빙 관리 시스템</span>
            </div>
          </div>

          <div className="header-actions">
            <a className="admin-login-button" href={pageHref("/admin")}>
              <Icon name="shield" />
              <span>관리자 로그인</span>
            </a>
            <div className="user-card" aria-label="사용자 정보">
              <div className="user-avatar" aria-hidden="true">
                <Icon name="home" />
              </div>
              <div>
                <strong>교직원 사용자</strong>
                <span>{displaySchoolName}</span>
              </div>
            </div>
          </div>
        </header>

        <nav className="top-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <a className={item.active ? "nav-pill active" : "nav-pill"} href={pageHref(item.href)} key={item.title}>
              <Icon name={item.icon} />
              <span>{item.title}</span>
            </a>
          ))}
        </nav>

        {setupMessage ? (
          <div className="soft-alert" role="alert">
            {setupMessage} GitHub Pages 배포 파일에 app-config.json을 추가하면 학교별 설정을 빌드 없이 바꿀 수 있습니다.
          </div>
        ) : null}

        {notice ? (
          <div className="soft-alert" role="status">
            {notice}
          </div>
        ) : null}

        <section className="today-card" aria-label="오늘 운영 중인 교육">
          <div className="today-copy">
            <div className="section-kicker">
              <Icon name="calendar" />
              <span>오늘 운영 중인 교육</span>
            </div>

            {activeTraining ? (
              <>
                <h2>{activeTraining.title || "교육명 미입력"}</h2>
                <p>{formatTrainingMeta(activeTraining.date, activeTraining.time, activeTraining.place ?? activeTraining.location)}</p>
                <a className="primary-action" href={pageHref("/trainings")}>
                  교육목록 보기
                  <Icon name="chevron" />
                </a>
              </>
            ) : (
              <>
                <h2>등록된 교육이 없습니다.</h2>
                <p>교육목록이 준비되면 오늘 운영 중인 교육이 이곳에 표시됩니다.</p>
              </>
            )}
          </div>

          <div className="today-visual" aria-hidden="true">
            <div className="calendar-visual">
              <div />
              <Icon name="calendar" />
            </div>
            <div className="check-bubble">
              <Icon name="check" />
            </div>
          </div>
        </section>

        <section className="feature-grid" aria-label="주요 기능">
          {featureCards.map((card) => (
            <a className={`feature-card tone-${card.tone}`} href={pageHref(card.href)} key={card.title}>
              <span className="feature-icon">
                <Icon name={card.icon} />
              </span>
              <span className="feature-copy">
                <strong>{card.title}</strong>
                <small>{card.description}</small>
              </span>
              <span className="feature-action">
                {card.action}
                <Icon name="chevron" />
              </span>
              <span className="feature-ghost" aria-hidden="true">
                <Icon name={card.icon} />
              </span>
            </a>
          ))}
        </section>

        <section className="training-section" aria-label="교육목록">
          <div className="section-head training-head">
            <div>
              <h2>교육목록</h2>
              <p>학교에서 등록한 교직원 교육을 확인합니다.</p>
            </div>
            <a className="ghost-button" href={pageHref("/trainings")}>
              전체 교육목록 보기
              <Icon name="chevron" />
            </a>
          </div>

          <div className="training-list">
            {activeTrainings.length > 0 ? (
              activeTrainings.map((training) => (
                <article className="training-card" key={training.trainingId || training.title}>
                  <div>
                    <strong>{training.title || "교육명 미입력"}</strong>
                    <p>{formatTrainingMeta(training.date, training.time, training.place ?? training.location)}</p>
                  </div>
                  <div className="badge-row">
                    {training.category ? <span>{training.category}</span> : null}
                    <span>{training.qrEnabled ? "현장 QR 운영" : "QR 미사용"}</span>
                    <span>{training.signatureRequired ? "서명 필요" : "서명 없음"}</span>
                    {training.certificateRequired ? <span>이수증 제출</span> : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-training">
                <span className="empty-icon">
                  <Icon name="calendar" />
                </span>
                <div>
                  <strong>표시할 교육목록이 없습니다.</strong>
                  <p>학교 Google Sheet에 교육목록을 등록하면 이곳에 카드로 표시됩니다.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="qr-guide-card" aria-label="현장 QR 출석 안내">
          <div className="section-kicker">
            <Icon name="qr" />
            <span>현장 QR 출석</span>
          </div>
          <p>교육 당일 연수장에 비치된 QR을 스캔하면 출석 화면이 열립니다.</p>
        </section>

        <footer className="footer-bar">
          <div>
            <Icon name="shield" />
            <span>{config.privacyNotice || "전자서명과 출석 기록은 연수 증빙용으로 학교 Google Sheet와 Google Drive에 저장됩니다."}</span>
          </div>
          <p>© 2026 School Staff Training Center</p>
        </footer>
      </div>
    </main>
  );
}
