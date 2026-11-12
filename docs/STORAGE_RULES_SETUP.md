# Firebase Storage 및 Firestore Rules 배포 안내

> **중요:** GitHub/Vercel 배포는 Firebase Rules를 자동 변경하지 않습니다. 코드를 배포하기 전에 Firebase 콘솔의 Rules를 직접 게시하거나 Firebase CLI로 배포해야 합니다.

## 1. Firestore Rules (필수)

1. [Firebase Console](https://console.firebase.google.com/)에서 MyLink 프로젝트를 엽니다.
2. **Firestore Database → Rules**로 이동합니다.
3. 저장소 최신 `firestore.rules` 파일을 전체 붙여넣고 **Publish** 합니다.
4. 게시된 규칙에 `buttonColor`, `textColor`, 비활성 링크 읽기 제한, username 탈퇴 해제 조건이 포함됐는지 확인합니다.

**게시 전에는 새로 추가한 컬러 저장, 숨김 링크 필터링 및 계정 탈퇴가 권한 오류를 낼 수 있습니다.**

## 2. Cloud Storage (프로필 이미지 업로드 필수)

1. Firebase Console에서 **Storage**를 활성화합니다. 프로젝트 또는 버킷 요금제·리전 조건을 먼저 확인합니다.
2. **Storage → Rules**에서 저장소의 `storage.rules` 파일 전체를 붙여넣고 게시합니다.
3. 인증된 사용자만 `profile-images/{uid}/avatar` 경로에 JPEG/PNG/WebP 5MB 이하 파일을 업로드/교체/삭제할 수 있어야 합니다.
4. 공개 프로필에서 해당 사진을 로그인 없이 읽을 수 있는지 확인합니다.
5. 다른 계정 UID 경로에 업로드하거나 삭제하는 작업은 거부되어야 합니다.

## 3. Firebase CLI로 배포하는 경우

`firebase.json`에는 Rules 파일 경로만 연결돼 있습니다. 아래 명령은 **내 Firebase 프로젝트를 올바르게 선택한 상태**에서만 사용하세요.

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,storage
```

실수로 다른 프로젝트의 규칙을 덮어쓰지 않도록 `firebase use`로 프로젝트를 확인합니다. 브라우저에서 실제 기능 검증을 완료하기 전에는 본 운영 계정으로 탈퇴 테스트를 하지 마세요.

## 4. 검증 시나리오

- 계정 A가 자신의 프로필 사진을 업로드, 새로고침 후 공개 페이지에서 표시
- 계정 B가 A의 `profile-images/A-uid/avatar` 경로에 업로드 시 거부
- 비로그인 방문자가 활성 링크 조회 성공, 비활성 링크 직접 읽기 거부
- 비활성 링크 카운터 +1 비로그인 시도 거부
- 저장된 프로필 버튼색/글자색 공개 페이지 반영
- 별도 **테스트 계정**으로 가입 → 링크 추가 → 업로드 → 탈퇴 → 공개 URL 비활성화 확인

## 5. 탈퇴 기능의 운영상 제약

현재 탈퇴 구현은 브라우저에서 Google 재인증 후 Storage → Firestore 링크 → 계정 문서/username → Firebase Authentication 순서로 삭제합니다. **서비스 간 원자적 삭제가 아니므로 네트워크 장애가 발생하면 일부 데이터가 남을 수 있습니다.** 오류가 뜨면 동일 계정으로 재시도하세요.

실제 대규모 서비스 전에는 Firebase Admin SDK 또는 Cloud Functions의 신뢰할 수 있는 백엔드 삭제 작업, 실패 재시도 큐 및 운영 로그를 도입하는 것이 필요합니다. 현재 구현만으로 ‘실패 시에도 완전한 원자적 삭제’를 보장한다고 표시하지 않습니다.
