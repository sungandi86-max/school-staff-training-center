# Apps Script

이 폴더는 학교별 Google Sheet와 Google Drive를 읽고 쓰는 Apps Script API 코드를 보관합니다.

공용 배포형에서 사용자 화면은 GitHub Pages 정적 웹앱이 제공하고, Apps Script는 학교별 데이터 처리 계층으로 동작합니다.

## 역할

- 학교설정 조회
- 교육목록 조회
- 교직원 인증
- 교육대상 확인
- QR 출석 기록
- 전자서명 이미지 Google Drive 저장
- 내 이수현황 조회
- 관리자 요약 데이터 조회
- 최종 서명부 생성 및 Drive 저장

## 구현 예정 함수

```text
doGet(e)
doPost(e)
getSchoolConfig()
getTrainingList()
verifyStaff(payload)
checkTrainingTarget(payload)
saveQrAttendance(payload)
saveSignature(payload)
getMyTrainingStatus(payload)
generateFinalAttendanceSheet(payload)
getAdminDashboardData()
```

## 공통 유틸리티

```text
jsonResponse(data)
errorResponse(message, code)
getSheetByName(name)
readRows(sheetName)
appendRow(sheetName, row)
findByColumn(sheetName, columnName, value)
getHeaderMap(sheet)
```

## API 응답 원칙

- 화면 처리에 필요한 최소 정보만 반환합니다.
- 전체 교직원 명단을 반환하지 않습니다.
- 인증코드, 서명 이미지 원본, Drive 폴더 ID 같은 민감정보를 일반 화면에 반환하지 않습니다.
- 오류 메시지에는 개인정보를 포함하지 않습니다.

## 저장 원칙

- 교직원 명단은 학교별 Google Sheet에만 저장합니다.
- 출석기록은 학교별 Google Sheet에만 저장합니다.
- 전자서명 이미지는 학교별 Google Drive에만 저장합니다.
- 이수증 파일은 학교별 Google Drive에만 저장합니다.
- GitHub Pages와 Vercel에는 민감정보를 저장하지 않습니다.

## 다음 단계

1. 실제 허브시트의 첫 행 필드명과 `Code.gs` 상수를 대조합니다.
2. `saveSignature()`에서 Drive 저장 로직을 구현합니다.
3. `generateFinalAttendanceSheet()`에서 최종 서명부 파일 생성 로직을 구현합니다.
4. GitHub Pages 정적 웹앱에서 호출할 `doPost(e)` action 라우팅을 안정화합니다.
5. 테스트용 샘플 Sheet에서 각 action을 검증합니다.
