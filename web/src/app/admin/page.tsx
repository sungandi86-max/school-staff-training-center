import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";

const APP_BASE_PATH = "/school-staff-training-center";

const adminItems = [
  {
    title: "QR 출력",
    description: "교육별 QR을 생성하고 출력합니다.",
    href: "/admin/qr"
  },
  {
    title: "출석현황",
    description: "교육별 출석과 전자서명 상태를 확인합니다.",
    href: "/admin/attendance"
  },
  {
    title: "최종 서명부",
    description: "감사와 증빙용 최종 서명부를 생성합니다.",
    href: "/admin/final-sheet"
  },
  {
    title: "교직원 명단",
    description: "교직원 정보를 확인하고 재직상태를 관리합니다.",
    href: "/admin/staff"
  },
  {
    title: "설정 관리",
    description: "학교 기본정보, 브랜드, 저장 폴더를 관리합니다.",
    href: "/admin/settings"
  }
];

function pageHref(path: string) {
  return `${APP_BASE_PATH}${path}/`;
}

function AdminIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-2 3.4-.2-.1a1.8 1.8 0 0 0-1.9-.1 1.7 1.7 0 0 0-.9 1.5v.2H9.2v-.2a1.7 1.7 0 0 0-.9-1.5 1.8 1.8 0 0 0-1.9.1l-.2.1-2-3.4.1-.1A1.6 1.6 0 0 0 4.6 15 1.7 1.7 0 0 0 3.2 14H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1 2-3.4.2.1a1.8 1.8 0 0 0 1.9.1 1.7 1.7 0 0 0 .9-1.5v-.2h5.6v.2a1.7 1.7 0 0 0 .9 1.5 1.8 1.8 0 0 0 1.9-.1l.2-.1 2 3.4-.1.1A1.6 1.6 0 0 0 19.4 9a1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function AdminPage() {
  return (
    <AdminAuthGate>
      <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">관리자 메뉴</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
          <AdminLogoutButton />
        </div>

        <section className="today-card" aria-label="관리자 메뉴">
          <div className="today-copy">
            <div className="section-kicker">
              <AdminIcon />
              <span>관리자 메뉴</span>
            </div>
            <h1>교육 운영 도구를 관리합니다.</h1>
            <p>QR 출력, 출석현황, 최종 서명부, 학교 설정을 한 곳에서 확인합니다.</p>
          </div>
        </section>

        <section className="admin-section" aria-label="관리자 기능">
          <div className="section-head">
            <div>
              <h2>관리자 기능</h2>
              <p>필요한 관리 작업을 선택해주세요.</p>
            </div>
            <span className="permission-note">관리 권한이 있는 사용자만 이용해주세요.</span>
          </div>

          <div className="admin-grid">
            {adminItems.map((item) => (
              <a className="admin-card" href={pageHref(item.href)} key={item.href}>
                <span className="admin-icon">
                  <AdminIcon />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <ChevronIcon />
              </a>
            ))}
          </div>
        </section>
      </div>
      </main>
    </AdminAuthGate>
  );
}
