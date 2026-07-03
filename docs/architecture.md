# 아키텍처

학교 교직원 교육센터의 공용 배포 구조는 **GitHub Pages + Apps Script + Google Sheet + Google Drive**입니다.

GitHub Pages는 정적 사용자 화면만 제공합니다. 학교별 데이터 읽기와 저장은 각 학교의 Google Sheet에 연결된 Apps Script Web App이 담당합니다. 교직원 명단, 출석기록, 전자서명 이미지 등 민감정보는 GitHub Pages나 Vercel에 저장하지 않습니다.

## 최종 구조

```text
GitHub Pages 정적 웹앱
  - Home, QR 출석, 전자서명, 내 이수현황, 관리자 화면 제공
  - 서버 API route 없음
  - Apps Script Web App URL로 fetch

학교별 Apps Script Web App
  - Google Sheet/Drive 읽기·쓰기 API
  - 교직원 인증
  - 교육대상 확인
  - QR 출석 기록
  - 전자서명 이미지 Drive 저장
  - 최종 서명부 생성

학교별 Google Sheet
  - 학교설정
  - 교육목록
  - 교직원명단
  - 교육대상
  - 출석기록
  - 전자서명기록
  - 이수현황
  - 최종서명부

학교별 Google Drive
  - 전자서명 이미지
  - 이수증 파일
  - 최종 서명부 파일
```

## 데이터 흐름

1. 사용자가 GitHub Pages URL에 접속합니다.
2. 정적 웹앱이 브라우저에서 실행됩니다.
3. 웹앱은 설정 파일 또는 화면 설정으로 학교별 Apps Script Web App URL을 확인합니다.
4. 웹앱은 Apps Script Web App URL로 `fetch` 요청을 보냅니다.
5. Apps Script는 학교별 Google Sheet와 Drive만 읽고 씁니다.
6. 화면에는 처리에 필요한 최소 정보만 반환합니다.

## Apps Script URL 연결 방식

1차 설계에서는 다음 방식을 지원할 수 있도록 둡니다.

- GitHub Pages에 배포되는 `app-config.json`에서 학교별 Apps Script URL 지정
- 관리자 또는 담당자가 화면에서 Apps Script URL 입력 후 브라우저 로컬 설정에 저장
- 화면 설정에서 입력한 URL을 브라우저 로컬 설정에 저장

실제 학교별 Apps Script URL은 코드 저장소에 하드코딩하지 않습니다.

## 역할 분리

### GitHub Pages

- 정적 HTML/CSS/JS 화면을 제공합니다.
- 서버 런타임과 데이터베이스를 사용하지 않습니다.
- 민감정보를 저장하지 않습니다.
- 모든 데이터 통신은 학교별 Apps Script Web App URL로 직접 요청합니다.

### Apps Script

- 학교별 Sheet와 Drive에 붙어서 동작하는 API 계층입니다.
- 교직원 인증, 교육대상 확인, 출석 기록, 전자서명 저장, 최종 서명부 생성을 처리합니다.
- 응답에는 화면 표시와 다음 처리에 필요한 최소 정보만 포함합니다.

### Google Sheet

- 학교별 운영 데이터의 원본 저장소입니다.
- 학교설정, 교육목록, 교직원명단, 교육대상, 출석기록, 전자서명기록을 저장합니다.

### Google Drive

- 전자서명 이미지, 이수증 파일, 최종 서명부 파일을 저장합니다.
- 저장 폴더 ID는 `00_학교설정`에서 학교별로 관리합니다.

### Vercel web

- 기본 배포 방식에서 제외합니다.
- 추후 고급형 UI, 별도 대시보드, 실험적 기능 검증에만 사용합니다.
- 사용하더라도 민감정보를 Vercel에 저장하지 않는 원칙은 동일합니다.

## 개인정보 원칙

- 교직원 명단은 학교별 Google Sheet에만 저장합니다.
- 인증코드는 학교별 Google Sheet에만 저장합니다.
- 출석기록은 학교별 Google Sheet에만 저장합니다.
- 전자서명 이미지는 학교별 Google Drive에만 저장합니다.
- 이수증 파일은 학교별 Google Drive에만 저장합니다.
- GitHub Pages에는 민감정보를 저장하지 않습니다.
- Vercel에는 민감정보를 저장하지 않습니다.
