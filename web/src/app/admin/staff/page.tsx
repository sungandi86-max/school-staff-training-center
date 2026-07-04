"use client";

import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";
import { createStaff, deactivateStaff, getStaffList, loadAppConfig, updateStaff } from "@/lib/apps-script";
import type { AdminStaff, AppConfig, StaffListResult } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

const APP_BASE_PATH = "/school-staff-training-center";

type StaffFilter = "all" | "active" | "inactive" | "admin" | "owner" | "staff";
type StaffForm = {
  name: string;
  department: string;
  position: string;
  authCode: string;
  employmentStatus: string;
  role: string;
  note: string;
};

const FILTERS: Array<{ label: string; value: StaffFilter }> = [
  { label: "전체", value: "all" },
  { label: "재직", value: "active" },
  { label: "비활성", value: "inactive" },
  { label: "관리자", value: "admin" },
  { label: "담당자", value: "owner" },
  { label: "교직원", value: "staff" }
];

const emptyForm: StaffForm = {
  name: "",
  department: "",
  position: "",
  authCode: "",
  employmentStatus: "재직",
  role: "교직원",
  note: ""
};

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function formFromStaff(staff: AdminStaff): StaffForm {
  return {
    name: staff.name ?? "",
    department: staff.department ?? "",
    position: staff.position ?? "",
    authCode: staff.authCode ?? "",
    employmentStatus: staff.employmentStatus || "재직",
    role: staff.role || "교직원",
    note: staff.note ?? ""
  };
}

function isActiveStaff(status?: string) {
  const normalized = (status ?? "").trim();
  return !normalized || normalized === "재직" || normalized.toLowerCase() === "active";
}

function matchesFilter(staff: AdminStaff, filter: StaffFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "active") {
    return isActiveStaff(staff.employmentStatus);
  }

  if (filter === "inactive") {
    return !isActiveStaff(staff.employmentStatus);
  }

  if (filter === "admin") {
    return staff.role === "관리자";
  }

  if (filter === "owner") {
    return staff.role === "담당자";
  }

  return staff.role === "교직원";
}

function maskedCode(code?: string) {
  if (!code) {
    return "-";
  }

  return "•".repeat(Math.max(4, code.length));
}

export default function AdminStaffPage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [staffResult, setStaffResult] = useState<StaffListResult>();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [showAuthCodes, setShowAuthCodes] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string>();
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("교직원 명단을 불러오는 중입니다.");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">("info");

  const refreshStaff = useCallback(async (config: AppConfig) => {
    const result = await getStaffList(config);

    if (result.error || !result.data) {
      setMessage(result.error || "교직원 명단을 불러오지 못했습니다.");
      setMessageTone("error");
      return;
    }

    setStaffResult(result.data);
    setMessage("교직원 명단을 불러왔습니다.");
    setMessageTone("success");
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      const configResult = await loadAppConfig();

      if (ignore) {
        return;
      }

      if (!configResult.ok) {
        setMessage(configResult.message);
        setMessageTone("error");
        return;
      }

      setRuntimeConfig(configResult.config);
      await refreshStaff(configResult.config);
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, [refreshStaff]);

  const filteredStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (staffResult?.staff ?? []).filter((staff) => {
      const haystack = [staff.name, staff.department, staff.position].join(" ").toLowerCase();
      return matchesFilter(staff, filter) && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [filter, query, staffResult?.staff]);

  function openCreatePanel() {
    setEditingStaffId(undefined);
    setForm(emptyForm);
    setPanelOpen(true);
  }

  function openEditPanel(staff: AdminStaff) {
    setEditingStaffId(staff.staffId);
    setForm(formFromStaff(staff));
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingStaffId(undefined);
    setForm(emptyForm);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!runtimeConfig) {
      setMessage("app-config.json의 Apps Script URL을 먼저 확인해주세요.");
      setMessageTone("error");
      return;
    }

    if (!form.name.trim()) {
      setMessage("성명을 입력해주세요.");
      setMessageTone("error");
      return;
    }

    setSaving(true);
    setMessage(editingStaffId ? "교직원 정보를 저장하는 중입니다." : "교직원을 추가하는 중입니다.");
    setMessageTone("info");

    const result = editingStaffId ? await updateStaff(runtimeConfig, editingStaffId, form) : await createStaff(runtimeConfig, form);
    setSaving(false);

    if (result.error || !result.data) {
      setMessage(result.error || "교직원 정보를 저장하지 못했습니다.");
      setMessageTone("error");
      return;
    }

    await refreshStaff(runtimeConfig);
    closePanel();
    setMessage(editingStaffId ? "교직원 정보를 저장했습니다." : "교직원을 추가했습니다.");
    setMessageTone("success");
  }

  async function handleDeactivate(staffId: string) {
    if (!runtimeConfig) {
      setMessage("app-config.json의 Apps Script URL을 먼저 확인해주세요.");
      setMessageTone("error");
      return;
    }

    setSaving(true);
    setMessage("재직상태를 비활성으로 변경하는 중입니다.");
    setMessageTone("info");

    const result = await deactivateStaff(runtimeConfig, staffId);
    setSaving(false);

    if (result.error || !result.data) {
      setMessage(result.error || "재직상태를 변경하지 못했습니다.");
      setMessageTone("error");
      return;
    }

    await refreshStaff(runtimeConfig);
    setMessage("재직상태를 비활성으로 변경했습니다.");
    setMessageTone("success");
  }

  const summary = staffResult?.summary ?? { total: 0, active: 0, inactive: 0, managers: 0 };

  return (
    <AdminAuthGate>
      <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">교직원 명단</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/admin/`}>
            관리자 메뉴로
          </a>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
          <AdminLogoutButton />
        </div>

        <section className="today-card" aria-label="교직원 명단">
          <div className="today-copy">
            <div className="section-kicker">
              <CheckIcon />
              <span>교직원 명단</span>
            </div>
            <h1>교직원 정보를 관리합니다.</h1>
            <p>명단 확인, 신규 추가, 정보 수정, 재직상태 변경을 Google Sheet에 안전하게 기록합니다.</p>
          </div>
        </section>

        {message ? (
          <div className={messageTone === "error" ? "soft-alert danger" : messageTone === "success" ? "soft-alert success" : "soft-alert"} role="status">
            {message}
          </div>
        ) : null}

        <section className="status-summary-grid" aria-label="교직원 요약">
          <div className="status-summary-card">
            <span>전체 교직원</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="status-summary-card">
            <span>재직</span>
            <strong>{summary.active}</strong>
          </div>
          <div className="status-summary-card">
            <span>비활성</span>
            <strong>{summary.inactive}</strong>
          </div>
          <div className="status-summary-card">
            <span>관리자/담당자</span>
            <strong>{summary.managers}</strong>
          </div>
        </section>

        <div className={panelOpen ? "staff-management-layout panel-open" : "staff-management-layout"}>
          <section className="training-section" aria-label="교직원 목록">
            <div className="section-head">
              <div>
                <h2>교직원 목록</h2>
                <p>성명, 부서, 직위로 검색하고 재직상태와 권한으로 필터링합니다.</p>
              </div>
              <div className="route-actions">
                <button className="ghost-button" onClick={() => setShowAuthCodes((current) => !current)} type="button">
                  {showAuthCodes ? "인증코드 숨김" : "인증코드 보기"}
                </button>
                <button className="primary-action" onClick={openCreatePanel} type="button">
                  교직원 추가
                </button>
              </div>
            </div>

            <div className="admin-attendance-controls">
              <label className="field-group">
                <span>검색</span>
                <input onChange={(event) => setQuery(event.target.value)} placeholder="성명, 부서, 직위 검색" type="search" value={query} />
              </label>
              <div className="filter-pills" aria-label="교직원 필터">
                {FILTERS.map((item) => (
                  <button className={item.value === filter ? "filter-pill active" : "filter-pill"} key={item.value} onClick={() => setFilter(item.value)} type="button">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredStaff.length ? (
              <>
                <div className="admin-attendance-table-wrap">
                  <table className="admin-attendance-table staff-table">
                    <thead>
                      <tr>
                        <th>교직원ID</th>
                        <th>성명</th>
                        <th>부서</th>
                        <th>직위</th>
                        <th>인증코드</th>
                        <th>재직상태</th>
                        <th>권한</th>
                        <th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((staff) => (
                        <tr key={staff.staffId}>
                          <td>{staff.staffId}</td>
                          <td>{staff.name || "-"}</td>
                          <td>{staff.department || "-"}</td>
                          <td>{staff.position || "-"}</td>
                          <td>{showAuthCodes ? staff.authCode || "-" : maskedCode(staff.authCode)}</td>
                          <td>
                            <span className={isActiveStaff(staff.employmentStatus) ? "status-chip status-completed" : "status-chip status-incomplete"}>
                              {staff.employmentStatus || "재직"}
                            </span>
                          </td>
                          <td>{staff.role || "교직원"}</td>
                          <td>
                            <div className="table-actions">
                              <button className="ghost-button compact" onClick={() => openEditPanel(staff)} type="button">
                                수정
                              </button>
                              {isActiveStaff(staff.employmentStatus) ? (
                                <button className="ghost-button compact danger" disabled={saving} onClick={() => void handleDeactivate(staff.staffId)} type="button">
                                  비활성
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-attendance-cards">
                  {filteredStaff.map((staff) => (
                    <article className="training-card status-card" key={staff.staffId}>
                      <div className="status-card-head">
                        <div>
                          <strong>{staff.name || "-"}</strong>
                          <p>
                            {staff.department || "부서 미입력"} · {staff.position || "직위 미입력"}
                          </p>
                        </div>
                        <span className={isActiveStaff(staff.employmentStatus) ? "status-chip status-completed" : "status-chip status-incomplete"}>
                          {staff.employmentStatus || "재직"}
                        </span>
                      </div>
                      <div className="badge-row">
                        <span>{staff.staffId}</span>
                        <span>{staff.role || "교직원"}</span>
                        <span>인증코드 {showAuthCodes ? staff.authCode || "-" : maskedCode(staff.authCode)}</span>
                      </div>
                      <div className="route-actions">
                        <button className="ghost-button compact" onClick={() => openEditPanel(staff)} type="button">
                          수정
                        </button>
                        {isActiveStaff(staff.employmentStatus) ? (
                          <button className="ghost-button compact danger" disabled={saving} onClick={() => void handleDeactivate(staff.staffId)} type="button">
                            비활성
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="soft-alert" role="status">
                검색 또는 필터 조건에 맞는 교직원이 없습니다.
              </div>
            )}
          </section>

          {panelOpen ? (
            <aside className="staff-editor-panel" aria-label={editingStaffId ? "교직원 수정" : "교직원 추가"}>
              <div className="section-head">
                <div>
                  <h2>{editingStaffId ? "교직원 수정" : "교직원 추가"}</h2>
                  <p>입력한 값은 Apps Script를 통해 02_교직원명단 탭에 저장됩니다.</p>
                </div>
              </div>

              <form className="attendance-form" onSubmit={handleSubmit}>
                <label className="field-group">
                  <span>성명</span>
                  <input name="name" onChange={handleChange} type="text" value={form.name} />
                </label>
                <label className="field-group">
                  <span>부서</span>
                  <input name="department" onChange={handleChange} type="text" value={form.department} />
                </label>
                <label className="field-group">
                  <span>직위</span>
                  <input name="position" onChange={handleChange} type="text" value={form.position} />
                </label>
                <label className="field-group">
                  <span>인증코드</span>
                  <input name="authCode" onChange={handleChange} placeholder="비워두면 자동 생성" type={showAuthCodes ? "text" : "password"} value={form.authCode} />
                  <small className="field-help">본인 인증에 사용하는 값입니다. 필요한 경우에만 표시해서 확인해주세요.</small>
                </label>
                <label className="field-group">
                  <span>재직상태</span>
                  <select name="employmentStatus" onChange={handleChange} value={form.employmentStatus}>
                    <option value="재직">재직</option>
                    <option value="비활성">비활성</option>
                  </select>
                </label>
                <label className="field-group">
                  <span>권한</span>
                  <select name="role" onChange={handleChange} value={form.role}>
                    <option value="교직원">교직원</option>
                    <option value="담당자">담당자</option>
                    <option value="관리자">관리자</option>
                  </select>
                </label>
                <label className="field-group">
                  <span>비고</span>
                  <textarea name="note" onChange={handleChange} rows={4} value={form.note} />
                </label>

                <div className="route-actions">
                  <button className="primary-action" disabled={saving} type="submit">
                    {saving ? "저장 중" : "저장"}
                  </button>
                  <button className="ghost-button" onClick={closePanel} type="button">
                    닫기
                  </button>
                </div>
              </form>
            </aside>
          ) : null}
        </div>
      </div>
      </main>
    </AdminAuthGate>
  );
}
