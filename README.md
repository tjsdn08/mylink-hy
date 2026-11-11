# MyLink

**내 모든 링크, 딱 한 페이지에.**

MyLink는 개인 프로필과 프로젝트·블로그·SNS 링크를 하나의 공개 주소로 공유하는 웹 애플리케이션입니다.

- 서비스 주소: https://mylink-hy.vercel.app
- GitHub: https://github.com/tjsdn08/mylink-hy

## 주요 기능

- **Google 로그인**: Firebase Authentication 기반 로그인 및 로그아웃
- **프로필 관리**: 이름, 소개글, 고유 Username 수정 및 중복 확인
- **공개 프로필**: `/{username}` 주소로 프로필·링크 공유
- **링크 관리**: 링크 추가·수정·삭제 및 삭제 확인
- **클릭 통계**: 공개 페이지 링크 클릭 수 기록, 링크별 통계 차트
- **화면 사용성**: 모바일 대응, 알림 토스트, 라이트·다크 모드, 로딩 UI
- **공유/검색**: 사용자별 OG 이미지, 메타데이터, robots.txt, sitemap.xml

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 App Router, React 19, TypeScript |
| 스타일 | Tailwind CSS v4, shadcn/ui·Base UI, Lucide |
| 데이터베이스·인증 | Firebase Firestore, Firebase Authentication |
| 통계 시각화 | Recharts |
| 배포 | Vercel |

## 로컬 실행

Node.js 및 npm이 필요합니다.

```bash
git clone https://github.com/tjsdn08/mylink-hy.git
cd mylink-hy
npm ci
```

프로젝트 루트에 `.env.local`을 생성하고 **본인 Firebase 프로젝트**의 웹 앱 설정 값을 입력합니다. 실제 키·개인정보를 GitHub에 커밋하지 마세요.

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`는 선택 사항입니다. 로컬 개발은 아래 명령어로 시작합니다.

```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속하세요. Google 로그인 기능을 사용하려면 Firebase Authentication의 Google 로그인 제공업체와 인증된 도메인 설정이 필요합니다.

## 검사 및 빌드

```bash
npx tsc --noEmit
npm run lint
npm run format:check
npm run build
```

`npm run format`으로 코드와 문서의 포맷을 일괄 정리할 수 있습니다. 현재 저장소에 이미 존재하던 파일 중 일부는 설정과 다르게 포맷되어 있을 수 있습니다. 자동 정리 후 변경 사항을 확인하세요.

## 주요 디렉터리

```text
src/
├─ app/
│  ├─ [username]/        # 공개 프로필 및 사용자별 OG 이미지
│  ├─ mypage/            # 프로필·링크 관리
│  ├─ stats/             # 클릭 통계
│  └─ loading.tsx        # 공통 라우트 로딩 UI
├─ components/           # 링크 카드, 프로필, UI, 테마
├─ lib/                  # Firebase, 프로필 트랜잭션, URL 검증
└─ types/                # 도메인 타입
firestore.rules          # Firestore 보안 규칙
docs/                    # 제품/화면 기획 및 운영 안내
```

## Firestore 보안과 운영

Firestore는 **GitHub에 있는 `firestore.rules`를 자동으로 적용하지 않습니다.** Firebase Console의 Firestore Rules 화면에서 해당 규칙을 직접 검토하고 **게시**해야 합니다.

- 사용자 계정 정보는 본인에게만 읽기·쓰기를 허용합니다.
- 공개 프로필에는 이메일을 저장하지 않으며, 공개 링크는 읽을 수 있습니다.
- Username 매핑은 기존 소유자만 갱신할 수 있도록 보호합니다.
- 공개 방문자의 클릭 수 증가는 허용하지만, 남용 방지까지 보장하는 구조는 아닙니다.

설정 방법: [Firestore 보안 규칙 적용](docs/FIRESTORE_RULES_SETUP.md)

## 테스트

[최종 테스트 체크리스트](docs/FINAL_TEST_CHECKLIST.md)에 따라 로그인, 프로필 편집, 링크 CRUD, 클릭 집계, 공개 프로필, 다크 모드 및 OG를 확인하세요.

## 라이선스

저장소의 [LICENSE](LICENSE) 파일을 참고하세요.
