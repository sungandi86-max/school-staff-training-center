# Apps Script API 설계

이 문서는 GitHub Pages 정적 웹앱에서 호출할 학교별 Apps Script Web App API 설계를 정리합니다.

## 설계 목표

- Google Sheet와 Google Drive를 학교별 데이터 저장소로 사용합니다.
- GitHub Pages에는 민감정보를 저장하지 않습니다.
- Vercel은 기본 배포 방식에서 제외합니다.
- 교육ID와 교직원ID를 기준으로 데이터를 연결합니다.
- 교육목록과 교직원명단은 직접 연결하지 않고 `03_교육대상`을 통해 연결합니다.
- API 응답에는 화면 처리에 필요한 최소 정보만 반환합니다.
- 전자서명 이미지는 지정된 Google Drive 폴더에 저장하고 Sheet에는 파일 URL만 기록합니다.

## 공통 응답 형태

성공 응답:

```json
{
  "ok": true,
  "data": {},
  "message": "처리되었습니다."
}
```

오류 응답:

```json
{
  "ok": false,
  "error": "INVALID_REQUEST",
  "message": "요청 정보를 확인해주세요."
}
```

오류 메시지에는 인증코드, 서명 이미지 원본, 전체 교직원 정보 같은 민감정보를 포함하지 않습니다.

## 요청 라우팅

GitHub Pages 정적 웹앱은 Apps Script Web App URL로 `POST` 요청을 보냅니다.

```json
{
  "action": "getTrainingList",
  "payload": {}
}
```

`doPost(e)`는 `action` 값을 기준으로 내부 함수를 호출합니다.

## 주요 함수

### getSchoolConfig()

`00_학교설정`에서 학교별 설정값을 읽어 GitHub Pages 화면에 전달합니다.

반환 예:

```json
{
  "schoolName": "샘플고등학교",
  "centerName": "학교 교직원 교육센터",
  "schoolLogoUrl": "",
  "primaryColor": "#1F2A44",
  "secondaryColor": "#EEF4FF",
  "departmentName": "교무기획부",
  "privacyNotice": "전자서명과 출석 기록은 연수 증빙용으로 저장됩니다."
}
```

주의:

- Drive 폴더 ID는 관리자 기능에 필요한 경우에만 반환합니다.
- 일반 교직원 화면에는 민감 운영 설정을 노출하지 않습니다.

### getTrainingList()

`01_교육목록`에서 교육 목록을 읽습니다.

반환 필드:

```text
교육ID
교육명
교육일자
교육시간
장소
담당부서
교육구분
QR사용여부
전자서명필요여부
활성상태
```

### verifyStaff(payload)

교직원 본인 인증을 처리합니다.

입력:

```json
{
  "name": "홍길동",
  "authCode": "1234"
}
```

반환:

```json
{
  "staffId": "S0001",
  "name": "홍길동",
  "department": "교무부",
  "position": "교사"
}
```

주의:

- 인증 실패 시 어떤 항목이 틀렸는지 구체적으로 노출하지 않습니다.
- 전체 교직원 명단을 반환하지 않습니다.

### checkTrainingTarget(payload)

`03_교육대상`에서 특정 교육의 대상 여부를 확인합니다.

입력:

```json
{
  "trainingId": "T0001",
  "staffId": "S0001"
}
```

반환:

```json
{
  "isTarget": true,
  "isRequired": true,
  "signatureExcluded": false
}
```

### saveQrAttendance(payload)

QR 출석을 기록합니다.

처리:

1. 교육ID와 교직원ID를 확인합니다.
2. 대상 여부를 확인합니다.
3. 중복 출석을 확인합니다.
4. `04_QR출석기록`에 기록합니다.
5. 전자서명 필요 여부를 반환합니다.

### saveSignature(payload)

전자서명 이미지를 지정 Drive 폴더에 저장하고 `05_전자서명기록`에 파일 정보를 기록합니다.

주의:

- 서명 이미지 원본은 GitHub Pages에 저장하지 않습니다.
- Sheet에는 Drive 파일 ID와 URL만 기록합니다.

### getMyTrainingStatus(payload)

교직원 인증 후 본인의 이수현황을 반환합니다.

표시 항목:

- 필수 교육
- 이수 완료 여부
- 미이수 여부
- 서명 완료 여부
- 출석 일시

### generateFinalAttendanceSheet(payload)

관리자가 교육별 최종 서명부를 생성합니다.

처리:

1. 교육목록, 교육대상, 출석기록, 전자서명기록을 조합합니다.
2. 최종 서명부 파일을 생성합니다.
3. 지정 Drive 폴더에 저장합니다.
4. `08_최종서명부`에 파일 ID와 URL을 기록합니다.

### getAdminDashboardData()

관리자 화면에 필요한 최소 요약 데이터를 반환합니다.

예:

- 교육 수
- 출석 완료 수
- 미출석 수
- 서명 완료 수
- 최종 서명부 생성 여부

## 구현 주의사항

- Apps Script URL은 GitHub Pages 코드에 하드코딩하지 않습니다.
- GitHub Pages는 서버 API route를 사용하지 않습니다.
- Apps Script는 `ContentService` JSON 응답을 기본으로 사용합니다.
- 브라우저 CORS와 Apps Script Web App 배포 권한을 테스트합니다.
- 개인정보가 로그에 남지 않도록 합니다.
