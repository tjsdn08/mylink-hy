# Firestore Security Rules Setup

Apply the repository's `firestore.rules` file in the Firebase Console:

1. Open Firebase Console and select the `mylink-hy` project.
2. Go to **Firestore Database** > **Rules**.
3. Replace the editor contents with the full contents of `firestore.rules` at the repository root.
4. Review the rules and select **Publish**.
5. Test reads and writes with two signed-in accounts before production use.

The rules intentionally keep `users/{uid}` private, allow public reads of
`users/{uid}/profile/main`, active links in `users/{uid}/links`, and individual
`usernames/{username}` documents, and require the authenticated UID to own all
profile, link, and username writes. The public profile document must not contain
email; the app keeps email on the private `users/{uid}` document and removes it
from legacy `profile/main` documents during authenticated profile initialization.
Until an owner signs in and this migration completes, a legacy profile document
that still contains `email` is intentionally not readable publicly.

Firebase Console does not automatically read a local rules file. Publish the
rules explicitly using the steps above. No rule deployment is performed by this
application change.
## Username 보안 규칙 변경 확인 (2026-11-11)

- `usernames/{username}` 문서 **create**: 인증된 사용자가 자신의 UID로 생성하고, 동일 트랜잭션의 공개 프로필 Username과 일치할 때 허용합니다.
- 기존 문서 **update**: `resource.data.uid`가 현재 인증 사용자 UID와 같은 **기존 소유자**일 때만 허용합니다. 변경 후 UID도 기존 값과 같아야 합니다.
- 다른 계정이 점유한 Username으로 수정 시도하면 거부되어야 합니다.
- **중요**: GitHub 커밋과 Vercel 배포만으로는 Firebase 보안 규칙이 바뀌지 않습니다. 위 Firebase Console 절차로 새 규칙을 게시하세요.

게시 후 두 Google 계정으로 동일 Username을 등록하려는 시도, 자신의 Username 변경, 기존 Username 접속 여부를 확인하세요.

## 프로필 디자인과 방문 지표

공개 프로필에 다음 선택적 필드를 저장할 수 있도록 규칙을 확장했습니다: `theme`, `backgroundColor`, `buttonColor`, `textColor`, `buttonStyle`, `socialLinks`. 기존 프로필 문서는 그대로 유지되고 새 값을 설정한 사용자에게만 필드가 추가됩니다.

`users/{uid}/metrics/profile` 문서는 공개 읽기와 `views` +1 증가만 허용합니다. 최초 생성 시에는 `views == 1` 조건을 요구합니다. 누적 방문 수는 부정 사용과 반복 새로고침을 완전히 차단하지 않는 공개 카운터입니다.

**주의:** GitHub 커밋 또는 Vercel 배포로 보안 규칙이 자동 게시되지는 않습니다. Firebase Console → Firestore Database → 규칙에서 최신 파일을 **게시(Publish)** 하세요. 그런 다음 신규 테마 저장, 비로그인 방문, 통계 방문 수 증가를 확인하세요.

**최신 규칙을 게시하면** 비로그인 사용자는 `isActive=true`인 링크만 읽을 수 있고 비활성 링크의 직접 읽기·클릭 집계 증가도 거부됩니다. 공개 페이지 쿼리도 `isActive==true`로 제한했습니다. 기존에 `isActive` 값이 없는 링크는 소유자가 로그인할 때 보완됩니다. 기존 규칙을 게시한 채라면 이전 동작이 유지됩니다.

**현재 MyLink는 무료 Spark 요금제를 사용하며 Firebase Storage를 사용하지 않습니다.** 프로필 사진은 Google 계정 사진으로 표시합니다. Firestore 규칙만 게시하면 됩니다. [Spark 설정 안내](STORAGE_RULES_SETUP.md)

## 2026-11-11 개인화 필드 허용

`users/{uid}/profile/main`의 허용 필드에 `coverStyle`, `headline`, `about`, `now`를 추가했습니다. 기존 권한 구조(본인만 프로필 수정, 공개 조회 가능한 프로필)는 변경하지 않았습니다.

Firebase Console → Firestore Database → 규칙(Rules)으로 이동해서 GitHub 최신 `firestore.rules` **전체 내용**을 검토하고 게시하세요. 게시 후 한 줄 소개·커버 패턴·About me·Now를 저장하고 새로고침 및 비로그인 공개 프로필에서 반영 여부를 테스트하세요.
