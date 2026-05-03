# Smart Wall Calendar

Raspberry Pi / DietPi ARM64에서 터치스크린 기반으로 사용할 벽걸이 스마트 캘린더 프로그램입니다.

현재 스택은 **TypeScript + React + Electron + SQLite**입니다. 화면은 React가 담당하고, 앱 실행과 파일 접근은 Electron이 담당하며, 일정과 설정은 SQLite에 저장합니다.

## 기술 스택

- TypeScript
- React
- Electron
- SQLite (`better-sqlite3`)
- Vite
- date-fns

## 원명령어 설치

아래 명령어 한 줄로 필요한 패키지 설치, 저장소 다운로드, 의존성 설치, 빌드까지 진행합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/NokMyo/calendar/main/scripts/install.sh | bash
```

설치가 끝난 뒤에는 아래 명령어로 실행합니다.

```bash
cd ~/calendar
npm start
```

## 수동 설치

직접 설치하려면 저장소를 받은 뒤 의존성을 설치합니다.

```bash
git clone https://github.com/NokMyo/calendar.git
cd calendar
npm install
```

DietPi / Raspberry Pi OS Lite 계열에서는 Node.js, npm, 그리고 최소 그래픽 환경이 필요합니다. 터치스크린에서 실제로 쓰려면 X11/LXDE/LXQt 같은 가벼운 데스크톱 환경 위에서 실행하는 구성을 권장합니다.

## 개발 실행

개발 중에는 아래 명령어로 실행합니다.

```bash
npm run dev
```

이 모드는 Vite 개발 서버와 Electron 앱을 함께 실행합니다.

## 빌드 후 실행

실사용에 가까운 방식으로 실행하려면 먼저 빌드합니다.

```bash
npm run build
npm start
```

개발 모드가 아닐 때는 Electron 창이 전체화면으로 실행되도록 설계되어 있습니다.

## 사용법

- 상단의 `캘린더` 버튼에서 월간 달력을 봅니다.
- `이전`, `오늘`, `다음` 버튼으로 달을 이동합니다.
- 날짜를 누르면 오른쪽 패널에 해당 날짜 일정이 표시됩니다.
- 일정 제목과 시간을 입력한 뒤 `+ 일정 추가`를 누르면 저장됩니다.
- 일정 옆의 `삭제` 버튼을 누르면 해당 일정이 삭제됩니다.
- 상단의 `설정` 버튼에서 시작 요일, 테마, 날씨 위치를 수정할 수 있습니다.
- 설정 화면의 `새로고침`, `프로그램 종료` 버튼으로 앱을 제어할 수 있습니다.

## 데이터 저장 방식

SQLite DB는 Electron의 `userData` 경로 아래에 생성됩니다.

```txt
userData/data/calendar.db
```

Linux / DietPi 환경에서는 보통 아래 계열 경로에 저장됩니다.

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
├─ scripts/
│  └─ install.sh       # 원명령어 설치 스크립트
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

- ARM64 자동 실행 설정
- 터치스크린 전용 UI 개선
- 일정 추가 팝업 개선
- 날씨 API 실제 연결
- 반복 일정
- 일정 수정 기능
