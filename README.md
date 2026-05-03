# Smart Wall Calendar

Raspberry Pi 기반 벽걸이 스마트 캘린더 프로그램입니다.

초기 방향은 **TypeScript + React + Electron + SQLite**입니다. 화면은 React가 담당하고, 프로그램 창과 파일 접근은 Electron이 담당하며, 일정과 설정은 SQLite에 저장합니다.

## 기술 스택

- TypeScript
- React
- Electron
- SQLite (`better-sqlite3`)
- Vite
- date-fns

## 개발 실행

```bash
npm install
npm run dev
```

## 빌드 후 실행

```bash
npm run build
npm start
```

## 현재 구현된 기능

- 전체화면 벽걸이 캘린더 UI
- 월간 달력 표시
- 이전 달 / 다음 달 / 오늘 이동
- 날짜 선택
- 선택한 날짜의 일정 표시
- 일정 추가
- 일정 삭제
- SQLite 기반 일정 저장
- SQLite 기반 설정 저장
- 날씨 카드 UI 초안
- 설정 화면 UI 초안
- 프로그램 새로고침 / 종료 버튼

## 데이터 저장 방식

SQLite DB는 Electron의 `userData` 경로 아래에 생성됩니다.

```txt
userData/data/calendar.db
```

개발 중 DB 위치는 운영체제마다 다릅니다. 예를 들어 Raspberry Pi/Linux에서는 보통 아래 계열 경로에 저장됩니다.

```txt
~/.config/smart-wall-calendar/data/calendar.db
```

## 주요 파일 구조

```txt
calendar/
├─ electron/
│  ├─ main.ts          # Electron 창 생성과 IPC 처리
│  ├─ preload.ts       # React에서 사용할 안전한 API 노출
│  └─ database.ts      # SQLite 연결, 테이블 생성, 일정/설정 저장
├─ src/
│  ├─ App.tsx          # 캘린더 메인 화면
│  ├─ main.tsx         # React 진입점
│  ├─ styles/app.css   # 전체 UI 스타일
│  └─ types/           # Calendar 타입 정의
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
└─ tsconfig.electron.json
```

## 다음 작업 후보

- 날씨 API 실제 연결
- 설정값을 UI에 더 정확히 반영
- 반복 일정
- 일정 수정 모달
- Raspberry Pi 부팅 시 자동 실행 설정
- 터치 조작 최적화
