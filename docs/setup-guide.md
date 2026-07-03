# 설치 가이드

이 문서는 학교별로 학교 교직원 교육센터를 복사해 사용하는 기본 흐름을 설명합니다.

## 1. 허브시트 복사

`template/` 폴더의 허브시트 템플릿 파일을 학교 Google Drive로 복사합니다.

복사한 Google Sheet는 해당 학교의 운영 데이터 저장소입니다. 교직원 명단, 교육목록, 교육대상, 출석기록, 전자서명 기록은 이 Sheet와 학교별 Google Drive에만 저장합니다.

## 2. 학교설정 입력

복사한 Sheet의 `00_학교설정` 탭에 학교별 값을 입력합니다.

- 학교명
- 교육센터명
- 학교로고URL
- 메인컬러
- 보조컬러
- 담당부서명
- 담당자명
- 담당자 연락처
- 전자서명 저장 폴더 ID
- 최종 서명부 저장 폴더 ID
- 개인정보 안내문

## 3. Apps Script 배포

`apps-script/`의 코드를 학교별 Google Sheet에 연결된 Apps Script 프로젝트에 추가합니다.

Apps Script는 다음 역할을 담당합니다.

- 학교설정 읽기
- 교육목록 읽기
- 교직원 인증
- 교육대상 확인
- QR 출석 기록
- 전자서명 이미지 Google Drive 저장
- 내 이수현황 조회
- 최종 서명부 생성

Apps Script를 Web App으로 배포한 뒤 배포 URL을 확인합니다.

## 4. GitHub Pages 정적 웹앱 배포

`web` 폴더에서 정적 파일을 빌드합니다.

```bash
cd web
npm run build
```

빌드 결과는 `web/out`에 생성됩니다. 이 폴더를 GitHub Pages로 배포합니다.

자세한 절차는 [deployment.md](deployment.md)를 참고합니다.

## 5. Apps Script URL 연결

GitHub Pages 정적 웹앱은 학교별 Apps Script Web App URL을 통해 데이터를 불러옵니다.

권장 방식:

1. `web/public/app-config.example.json`을 참고해 배포 산출물에 `app-config.json`을 추가합니다.
2. `appsScriptUrl` 값에 학교별 Apps Script Web App URL을 입력합니다.
3. 실제 URL이 들어간 설정 파일은 공용 저장소에 커밋하지 않습니다.

추후에는 화면 설정에서 담당자가 Apps Script URL을 입력하는 방식도 추가할 수 있습니다.

## 6. 운영 전 점검

- 학교설정이 화면에 반영되는지 확인합니다.
- 교육목록을 불러오는지 확인합니다.
- 교직원 인증이 동작하는지 확인합니다.
- `03_교육대상` 기준으로 대상 여부가 판단되는지 확인합니다.
- QR 출석 중복 처리가 되는지 확인합니다.
- 전자서명 이미지가 지정 Drive 폴더에 저장되는지 확인합니다.
- 최종 서명부가 지정 Drive 폴더에 생성되는지 확인합니다.
