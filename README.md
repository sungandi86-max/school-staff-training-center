# 학교 교직원 교육센터

**School Staff Training Center**는 학교에서 반복 운영되는 교직원 연수, 법정의무교육, 안전교육, 전달연수의 출석, 전자서명, 이수현황, 최종 서명부를 한 곳에서 관리하기 위한 공용 템플릿입니다.

공용 배포형의 기본 구조는 **GitHub Pages + Apps Script + Google Sheet + Google Drive**입니다.

- GitHub Pages: 사용자 화면 제공
- Apps Script: 학교별 Sheet/Drive 읽기·쓰기 API
- Google Sheet: 학교설정, 교육목록, 교직원명단, 출석기록 저장
- Google Drive: 전자서명 이미지, 이수증 파일, 최종 서명부 저장

## 주요 기능

- 학교설정 불러오기
- 교육목록 불러오기
- 교직원 인증
- QR 출석
- 전자서명 저장
- 내 이수현황 확인
- 관리자 QR 출력
- 최종 서명부 다운로드
- 기존 이수증 제출 기능 유지 및 2차 개선

## 프로젝트 구조

```text
.
├─ docs/               # 설치, 구조, 배포, 개인정보, 시트 구조 문서
├─ apps-script/        # 학교별 Apps Script API 코드
├─ web/                # GitHub Pages 정적 웹앱
├─ template/           # 학교별 복사용 허브시트 템플릿
├─ .github/            # GitHub Pages/Actions 설정 위치
├─ README.md           # 프로젝트 소개
├─ CODEX.md            # 개발 작업 원칙
├─ DESIGN.md           # School Health Hub 디자인 원칙
└─ NEXT.md             # 다음 작업 목록
```

## 배포 구조

```text
교직원/담당자 브라우저
        │
        ▼
GitHub Pages 정적 웹앱
        │ fetch
        ▼
학교별 Apps Script Web App
        │
        ├─ Google Sheet
        └─ Google Drive
```

GitHub Pages는 정적 파일만 제공합니다. 서버 API route를 사용하지 않으며, 모든 데이터 통신은 학교별 Apps Script Web App URL로 직접 요청합니다.

## 개인정보 저장 원칙

- 교직원 명단은 학교별 Google Sheet에만 저장합니다.
- 인증코드는 학교별 Google Sheet에만 저장합니다.
- 출석기록은 학교별 Google Sheet에만 저장합니다.
- 전자서명 이미지는 학교별 Google Drive 폴더에만 저장합니다.
- 이수증 파일은 학교별 Google Drive 폴더에만 저장합니다.
- 최종 서명부는 학교별 Google Drive 폴더에만 저장합니다.
- GitHub Pages에는 민감정보를 저장하지 않습니다.
- Vercel 서버에는 민감정보를 저장하지 않습니다.

## 학교별 사용 흐름

1. `template/`의 허브시트 템플릿을 학교 Google Drive로 복사합니다.
2. 복사한 Google Sheet의 `00_학교설정`에 학교명, 로고, 색상, 담당자 정보, Drive 폴더 ID를 입력합니다.
3. 학교별 Apps Script Web App을 배포합니다.
4. GitHub Pages 정적 웹앱에 학교별 Apps Script URL을 연결합니다.
5. 교직원은 GitHub Pages URL에서 QR 출석, 전자서명, 이수현황 확인을 진행합니다.
6. 담당자는 관리자 메뉴에서 QR 출력, 출석현황, 최종 서명부를 관리합니다.

## Apps Script URL 연결 방식

Apps Script URL은 코드에 하드코딩하지 않습니다. 다음 방식 중 하나로 연결합니다.

- GitHub Pages 배포 산출물에 `app-config.json`을 추가
- 화면 설정에서 Apps Script URL 입력 후 브라우저 로컬 설정에 저장
- 화면 설정에서 입력한 URL을 브라우저 로컬 설정에 저장

`web/public/app-config.example.json`은 예시 파일입니다. 실제 학교 URL은 저장소에 커밋하지 않습니다.

## Vercel web의 역할

Vercel은 기본 배포 방식에서 제외합니다. `web/`은 GitHub Pages 정적 웹앱을 기준으로 유지하며, Vercel은 추후 고급형 UI나 별도 실험 배포가 필요할 때만 검토합니다.

자세한 배포 절차는 [docs/deployment.md](docs/deployment.md)를 참고합니다.
