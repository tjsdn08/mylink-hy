# 🚀 MyLink Project Guide

> 이 문서는 MyLink 개발·유지보수를 위한 프로젝트별 지침입니다. 실제 구현과 설정 파일이 달라지면 이 문서를 함께 갱신합니다.
>
> **문서 간 기준과 미구현 기능 확인:** [docs/PRODUCT_ALIGNMENT.md](docs/PRODUCT_ALIGNMENT.md). 최종 요구사항은 PRD를 우선하고, 현재 화면과 배포 상태는 실제 코드·운영 검증으로 판단합니다.

## 📌 Project Overview

**MyLink**는 개발자와 크리에이터가 프로젝트, 포트폴리오, 블로그, SNS 링크를 하나의 공개 주소(`/{username}`)에 모아 공유하는 링크 인 바이오(link-in-bio) 웹 서비스입니다.

- **핵심 흐름**: Google 로그인 → 최초 username·이름 온보딩 → 대시보드 → 프로필·링크·디자인 편집 → 공개 URL 공유 → 클릭 통계
- **설계 목표**: 직관적인 편집, 일관된 공개 화면, 모바일 접근성, 안전한 외부 URL 처리
- **운영 주소**: https://mylink-hy.vercel.app
- **저장소**: https://github.com/tjsdn08/mylink-hy

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui 스타일 공통 컴포넌트, Base UI
- **Icons**: Lucide React (기존 코드 기준, Tabler Icons 아님)
- **Fonts**: Geist, Geist Mono 및 프로젝트의 한국어 글꼴 설정
- **Backend**: Firebase Authentication (Google 로그인), Cloud Firestore. Firebase Storage는 사용하지 않음(Spark 무료 요금제)
- **Charts**: Recharts
- **Deployment**: Vercel
- **Tooling**: ESLint, Prettier, GitHub Actions

**주의**: 컴포넌트나 패키지 교체를 위해 shadcn 초기화 명령을 다시 실행하지 마세요. 기존 `components.json`, 스타일 토큰, 컴포넌트 및 설정을 유지하고 필요한 변경만 수행합니다.

## 📁 Key Directory Structure

```text
src/
├─ app/
│  ├─ page.tsx                   # 비로그인 랜딩 / 신규 온보딩 / 로그인 후 대시보드
│  ├─ dashboard/page.tsx         # 링크·방문 현황 대시보드
│  ├─ mypage/page.tsx            # 프로필·링크·디자인 관리
│  ├─ [username]/                # 공개 프로필 및 OG 메타데이터
│  ├─ stats/                     # 조회·클릭 통계
│  └─ globals.css                # 전역 스타일 및 테마
├─ components/
│  ├─ ui/                        # 공통 UI 컴포넌트
│  ├─ profile/                   # 공개 프로필 공통 화면
│  ├─ mypage/                    # 편집 UI 및 실시간 미리보기
│  └─ links/                     # 링크 목록·카드·파비콘
├─ lib/                          # Firebase, URL 검증, 프로필·디자인 로직
├─ types/                        # 타입 정의
└─ data/                         # 개발용 샘플 데이터
docs/                            # PRD, 사용자 시나리오, 와이어프레임, 테스트 문서
firestore.rules                  # Firestore 보안 규칙(콘솔 게시 별도)
firebase.json                    # Firestore 규칙만 배포 (Storage 미사용)
AGENTS.md                        # Next.js 개발 에이전트 안내
```

## 🎨 UI/UX Design Principles

1. **일관된 프로필 화면**
   - 랜딩 예시, 마이페이지 실시간 미리보기, 실제 공개 프로필은 `ProfileVisual`을 공통으로 사용합니다.
   - 미리보기용 휴대폰 프레임은 `ProfilePhoneFrame`을 재사용합니다. 랜딩·최초 온보딩·마이페이지는 모두 같은 높이(모바일 460px, sm 이상 520px)와 최대 너비(390px)의 프레임을 사용하며, **내용만 내부 스크롤**하고 전체 페이지를 늘리거나 임의로 scale/clip하지 않습니다.
   - 화면 간 차이는 데이터와 상호작용 여부로 제한합니다. 랜딩 예시도 scale 변형·그라데이션 가림막을 사용하지 않습니다.

2. **모바일 우선·반응형**
   - 관리 화면은 데스크톱에서 편집 영역(왼쪽)과 실시간 미리보기(오른쪽) 2열을 기본으로 합니다.
   - 모바일에서는 편집 영역을 우선 보여주고 작은 화면에서의 미리보기 배치·스크롤 길이를 검토합니다.
   - 사용 가능한 터치 영역, 키보드 탐색, 명확한 레이블, 포커스 표시를 유지합니다.

3. **간결한 콘텐츠와 화면 흐름**
   - 랜딩에서는 서비스 소개·이용 방법 링크/섹션을 제거하고 핵심 메시지·로그인 CTA·예시 미리보기만 보여줍니다. 첫 화면에서 핵심 메시지와 Google 로그인 CTA가 먼저 보여야 합니다. 계정 메뉴에는 실제 공개 페이지 링크 하나만 두고, 별도의 중복된 ‘내 프로필 미리보기’는 제공하지 않습니다. 편집 화면 내부 실시간 미리보기만 저장 전 변경사항을 보여줍니다.
   - 장식용 미리보기나 과도한 섹션 높이 때문에 홈 화면이 불필요하게 길어지지 않도록 합니다.
   - 빈 상태, 저장 중, 실패, 성공, 삭제 확인과 저장하지 않은 변경사항 안내를 제공합니다.
   - 사용자 문구는 자연스러운 한국어로 작성하고 용어(프로필·링크·공개 페이지·미리보기)를 일관되게 사용합니다.

4. **프로필 커스터마이징**
   - 기존 테마(크림·라벤더·미드나잇), 커버 패턴, 버튼 스타일, 소개글, SNS 연결을 보존합니다.
   - 프로필 사진은 Google 계정 사진을 표시합니다. 직접 업로드 UI, Cloud Storage, 유료 요금제 의존성을 추가하지 않습니다.
   - 변경 내용은 저장 전 미리보기에서 확인할 수 있어야 하며, 공개 페이지 반영은 저장 이후에 이루어집니다.

5. **링크 구성과 순서**
   - 링크는 제목, URL, 설명, 그룹, 이미지 URL, 활성 여부, 대표 링크를 지원합니다.
   - **명시적 `sortOrder` 우선**: 사용자가 순서를 이동하면 저장된 순서를 유지합니다.
   - 기존 정렬 값이 없는 링크는 생성일 역순 조회 결과를 기본 순서로 사용합니다. 모든 링크를 무조건 최신순으로 재정렬하지 않습니다.
   - 비활성 링크는 공개 목록에서 숨기고 최신 Firestore 규칙에서 비로그인 읽기도 차단합니다. 공개 URL로 한 번 공유된 정보는 이미 복사됐을 수 있으므로 비밀 정보 등록은 피합니다.

6. **아이콘·외부 링크**
   - 파비콘은 Google Favicon API로 가져오며 로딩 실패 시 기본 아이콘을 표시합니다.
   - 외부 URL은 http/https만 허용하고, 허용하지 않는 프로토콜은 차단합니다.
   - 외부 링크는 새 탭에서 열고 `rel="noopener noreferrer"`를 사용합니다.

## 🗂 Data & Security Conventions

- 기본 데이터 구조: `users/{uid}`, `users/{uid}/profile/main`, `users/{uid}/links/{linkId}`, `users/{uid}/metrics/profile`, `usernames/{username}`.
- 로그인과 소유권 확인에는 Firebase Authentication을 사용합니다.
- Firestore 읽기·쓰기 권한은 `firestore.rules`와 함께 검토합니다.
- 공개 프로필에 이메일과 비밀 정보를 노출하지 않습니다.
- **중요**: 최신 Firestore 규칙은 비활성 링크의 비로그인 읽기를 차단합니다. 게시 전 규칙에서는 보호되지 않으므로 [규칙 배포 안내](docs/STORAGE_RULES_SETUP.md)를 확인합니다.
- 조회·클릭 통계는 반복 방문 및 자동화 요청을 포함할 수 있습니다. 고유 방문자 수라고 표현하지 않습니다.
- Firestore Rules는 저장소 커밋이나 Vercel 배포만으로 자동 게시되지 않습니다. Firebase Console에서 별도 확인·게시해야 합니다.
- `.env.local`의 인증 설정 및 비밀 값을 Git에 커밋하지 않습니다.

## ⚙️ Commands

```bash
npm ci                 # 의존성 설치
npm run dev            # 로컬 개발 서버
npx tsc --noEmit       # TypeScript 검사 (현재 typecheck 스크립트 없음)
npm run lint           # ESLint 검사
npm run format:check   # Prettier 확인
npm run format         # Prettier 자동 정리
npm run build          # Next.js 프로덕션 빌드
```

- `npm run typecheck`는 현재 `package.json`에 정의돼 있지 않습니다. 필요하면 스크립트를 명시적으로 추가한 후 사용합니다.
- 빌드 성공과 실제 로그인·Firestore 권한·모바일 표시 검증은 별개입니다.

## 📝 Development Conventions

1. **기준 브랜치**: 별도 요청이 없다면 `main`에서 작업합니다. 임의로 새 브랜치나 PR을 생성하지 않습니다.
2. **변경 범위**: 기존 기능을 보존하면서 요청한 내용만 수정합니다. 관련 없는 UI나 패키지를 일괄 재구성하지 않습니다.
3. **컴포넌트 재사용**: 공통 프로필 UI, 디자인 토큰, 공통 UI 컴포넌트를 우선 활용합니다.
4. **URL 입력**: 프로토콜이 없는 일반 도메인에는 `https://`를 보완하되 위험한 스킴을 자동 변환하거나 허용하지 않습니다.
5. **저장 동작**: 프로필·디자인·SNS URL 변경은 명시적으로 저장합니다. 일반 링크 순서와 저장된 SNS 아이콘 순서 변경은 자동 저장합니다.
6. **검증**: 변경 후 TypeScript, lint, 빌드를 확인하고 로그인/관리/공개 프로필 주요 흐름을 점검합니다.
7. **문서 동기화**: 기능이나 화면 흐름이 바뀌면 `README.md`, `docs/PRD.md`, `docs/USER_SCENARIOS.md`, `docs/WIREFRAMES.md` 중 관련 문서를 갱신합니다.
8. **Next.js 버전 주의**: `AGENTS.md`를 존중하고 필요한 경우 설치된 Next.js 버전의 문서를 확인합니다.

## 🚧 Current Progress

### 구현 확인(소스 코드 기준)

- [x] Firebase SDK 설정 및 Google 로그인 연동
- [x] 프로필·링크 관리 화면과 데스크톱 2열 레이아웃
- [x] 링크 CRUD, 공개 여부, 대표 링크 및 순서 변경
- [x] 개인별 공개 프로필(`/{username}`) 및 공통 프로필 UI
- [x] Google Favicon API 및 기본 아이콘 대체
- [x] 디자인 테마, SNS, 실시간 미리보기
- [x] 프로필 조회 수·링크 클릭 통계 UI
- [x] 사용자별 OG 이미지/메타데이터
- [x] GitHub Actions의 타입 검사·린트·빌드 워크플로

### 추가 검증 또는 별도 구현이 필요한 사항

- [ ] Firebase Console에 최신 Firestore Rules 게시 상태 확인
- [ ] 실제 계정으로 가입·편집·저장·공유·통계 전체 흐름 점검
- [ ] 모바일/태블릿/데스크톱 실화면 및 접근성 확인
- [ ] 직접 이미지 업로드는 최종 PRD의 원래 목표였으나 Spark 무료 요금제 제약에 따라 **이번 과제 범위에서는 제외**. 현재 Google 계정 사진만 표시
- [x] 계정 탈퇴 UI·Google 재인증 및 Firestore/Auth 삭제 코드(Storage 미사용, 서버측 삭제 재시도/원자성은 미구현)
- [ ] 최신 Firestore 규칙 게시 및 탈퇴 테스트 계정 검증 (Storage 사용 안 함)

> 체크 항목은 소스 코드상 구현 여부를 기준으로 하며, 실제 운영 환경에서 테스트를 모두 통과했다는 뜻은 아닙니다.
