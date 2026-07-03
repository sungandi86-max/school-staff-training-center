# 다음 작업

1차 공용 배포 기준은 **GitHub Pages 정적 웹앱 + 학교별 Apps Script API**입니다. Vercel은 기본 배포 방식에서 제외하고, 추후 고급형 또는 실험형 배포로만 남깁니다.

## 1차 MVP 필수 기능

- 학교설정 불러오기
- 교육목록 불러오기
- 교직원 인증
- QR 출석
- 전자서명 저장
- 내 이수현황
- 관리자 QR 출력
- 최종 서명부 다운로드

## GitHub Pages 정적 웹앱 작업

1. `web` 앱을 정적 export 기준으로 유지
2. 서버 API route 없이 브라우저 `fetch`로 Apps Script Web App 호출
3. `app-config.json` 또는 화면 설정으로 학교별 Apps Script URL 연결
4. 홈 화면에서 학교설정과 교육목록 로드
5. QR 출석 화면 UI 구현
6. 교직원 인증 UI 구현
7. 전자서명 캔버스 UI 구현
8. 내 이수현황 화면 UI 구현
9. 관리자 메뉴 UI 구현
10. QR 출력 A4 인쇄 화면 구현
11. 최종 서명부 다운로드 버튼 연결

## Apps Script API 작업

1. `getSchoolConfig()` 실제 시트 설정값 안정화
2. `getTrainingList()` 활성 교육 필터와 표시 필드 정리
3. `verifyStaff(payload)` 교직원 인증 구현
4. `checkTrainingTarget(payload)` 교육대상 확인 구현
5. `saveQrAttendance(payload)` 중복 출석 확인 및 기록 구현
6. `saveSignature(payload)` Drive 이미지 저장 및 Sheet URL 기록 구현
7. `getMyTrainingStatus(payload)` 본인 이수현황 조회 구현
8. `generateFinalAttendanceSheet(payload)` 최종 서명부 생성 구현
9. `getAdminDashboardData()` 관리자 요약 데이터 구현

## GitHub Pages 배포 작업

1. `web` 폴더에서 `npm run build`로 `out/` 생성 확인
2. GitHub Pages 배포 브랜치 또는 GitHub Actions 설정
3. 학교별 `app-config.json` 배포 방식 결정
4. Apps Script Web App CORS/응답 형식 확인
5. 배포 URL에서 모바일 화면과 인쇄 화면 확인

## 2차 개선 후보

- 화면에서 Apps Script URL을 등록/수정하는 설정 UI
- 이수증 제출 기능 고도화
- 관리자 권한 체계
- 묶음 QR 출석
- 통계 리포트
- 학교별 디자인 프리셋 관리
- Vercel 고급형 UI 재검토

## 검증 기준

- `web` 앱이 정적 export로 빌드됩니다.
- GitHub Pages에서 서버 없이 화면이 표시됩니다.
- 모든 데이터 통신은 Apps Script Web App URL로만 이루어집니다.
- 교직원 명단, 출석기록, 서명 이미지는 GitHub Pages에 저장되지 않습니다.
- QR 출력 화면은 `@media print` 기준으로 A4 출력에 적합해야 합니다.
