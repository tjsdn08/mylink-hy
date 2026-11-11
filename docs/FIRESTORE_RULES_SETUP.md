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
