# Firestore Security Rules Setup

Apply the repository's `firestore.rules` file in the Firebase Console:

1. Open Firebase Console and select the `mylink-hy` project.
2. Go to **Firestore Database** > **Rules**.
3. Replace the editor contents with the full contents of `firestore.rules` at the repository root.
4. Review the rules and select **Publish**.
5. Test reads and writes with two signed-in accounts before production use.

The rules intentionally keep `users/{uid}` private, allow public reads of
`users/{uid}/profile/main`, `users/{uid}/links`, and individual
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

공개 프로필에 다음 선택적 필드를 저장할 수 있도록 규칙을 확장했습니다: `theme`, `backgroundColor`, `buttonStyle`, `socialLinks`. 기존 프로필 문서는 그대로 유지되고 새 값을 설정한 사용자에게만 필드가 추가됩니다.

`users/{uid}/metrics/profile` 문서는 공개 읽기와 `views` +1 증가만 허용합니다. 최초 생성 시에는 `views == 1` 조건을 요구합니다. 누적 방문 수는 부정 사용과 반복 새로고침을 완전히 차단하지 않는 공개 카운터입니다.

**주의:** GitHub 커밋 또는 Vercel 배포로 보안 규칙이 자동 게시되지는 않습니다. Firebase Console → Firestore Database → 규칙에서 최신 파일을 **게시(Publish)** 하세요. 그런 다음 신규 테마 저장, 비로그인 방문, 통계 방문 수 증가를 확인하세요.

현재 링크 컬렉션은 공개 조회가 가능하므로 `isActive=false`인 링크도 Firestore API에서 원본 URL을 조회할 수 있습니다. 숨김은 UI 표시 제어에 한정되며 접근 비밀을 보장하지 않습니다.
