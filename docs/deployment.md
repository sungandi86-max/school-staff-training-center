# GitHub Pages 배포 절차

학교 교직원 교육센터의 공용 배포형은 GitHub Pages 정적 웹앱과 학교별 Apps Script Web App을 연결하는 방식입니다.

## 배포 전 준비

1. 학교별 Google Sheet 허브시트를 복사합니다.
2. `00_학교설정`에 학교명, 로고, 색상, 담당부서, Drive 폴더 ID를 입력합니다.
3. Apps Script 프로젝트를 학교별 Sheet에 연결합니다.
4. Apps Script를 Web App으로 배포합니다.
5. 배포된 Apps Script Web App URL을 확인합니다.

## GitHub Pages 정적 빌드

`web` 폴더에서 정적 파일을 생성합니다.

```bash
cd web
npm run build
```

Next.js 설정은 `output: "export"`를 사용하므로 빌드 결과는 `web/out`에 생성됩니다.

## Apps Script URL 설정

Apps Script URL은 저장소 코드에 하드코딩하지 않습니다.

권장 방식은 학교별 배포 시 `app-config.json`을 생성해 GitHub Pages 산출물에 포함하는 것입니다.

```json
{
  "appsScriptUrl": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
}
```

저장소에는 실제 URL을 커밋하지 않고, `web/public/app-config.example.json`만 예시로 둡니다.

추후에는 화면 설정에서 담당자가 Apps Script URL을 입력하고 브라우저 로컬 설정에 저장하는 방식을 추가할 수 있습니다.

## GitHub Pages 설정

### GitHub Actions 방식

1. GitHub Actions에서 `web` 폴더 기준으로 의존성을 설치합니다.
2. `npm run build`를 실행합니다.
3. `web/out`을 GitHub Pages artifact로 업로드합니다.
4. Pages 배포 환경에 게시합니다.

### 브랜치 배포 방식

1. 로컬 또는 CI에서 `web/out`을 생성합니다.
2. `gh-pages` 브랜치 또는 GitHub Pages 지정 브랜치에 정적 파일을 게시합니다.
3. 저장소 Settings > Pages에서 해당 브랜치/폴더를 선택합니다.

## GitHub Pages 경로

프로젝트 페이지 경로가 `/repository-name/` 형태라면 빌드 시 `NEXT_PUBLIC_BASE_PATH`를 사용할 수 있습니다.

```bash
NEXT_PUBLIC_BASE_PATH=/school-staff-training-center npm run build
```

커스텀 도메인 또는 사용자 페이지 루트에 배포하는 경우 base path 없이 빌드할 수 있습니다.

## 보안 원칙

- GitHub Pages에는 민감정보를 저장하지 않습니다.
- Apps Script URL 외에 교직원 명단, 인증코드, 출석기록, 서명 이미지를 정적 파일에 포함하지 않습니다.
- 전자서명 이미지는 학교별 Google Drive 지정 폴더에 저장합니다.
- 출석기록은 학교별 Google Sheet에 저장합니다.
- Apps Script 응답에는 화면 표시와 다음 처리에 필요한 최소 정보만 포함합니다.

## 배포 후 확인

- GitHub Pages URL에서 홈 화면이 열리는지 확인합니다.
- 학교설정이 표시되는지 확인합니다.
- 교육목록이 표시되는지 확인합니다.
- Apps Script URL이 없을 때 사용자 안내가 보이는지 확인합니다.
- 모바일 화면에서 카드와 버튼이 가로로 넘치지 않는지 확인합니다.
- QR 출력 화면 구현 후 A4 인쇄 미리보기를 확인합니다.
