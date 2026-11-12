# MyLink 무료 Spark 요금제 Firebase 설정 안내

> 이 파일 이름은 기존 문서 링크의 호환성을 위해 유지합니다. **현재 MyLink는 Firebase Storage를 사용하지 않습니다.** 요금제 업그레이드 및 `storage.rules` 게시가 필요하지 않습니다.

## 적용 서비스

| 서비스 | 사용 | 설정 |
| --- | --- | --- |
| Firebase Authentication | 사용 | Google 로그인 활성화 |
| Cloud Firestore | 사용 | 저장소 루트 `firestore.rules` 게시 |
| Firebase Storage | 미사용 | 활성화·규칙 게시·Blaze 업그레이드 불필요 |
| 프로필 사진 | Google 계정 사진 | MyLink에서 직접 파일 업로드 불가 |

## Firestore 규칙 적용

1. Firebase Console → 해당 프로젝트 → **Firestore Database → 규칙(Rules)**으로 이동합니다.
2. 저장소 최신 `firestore.rules` 전체 내용을 붙여넣습니다.
3. 규칙을 검토한 후 **게시(Publish)**합니다.
4. 본인 계정과 별도 테스트 계정으로 Username 중복, 프로필 저장, 활성 링크 조회, 비활성 링크 접근 거부를 확인합니다.

GitHub/Vercel에 코드를 올려도 Firebase Rules가 자동 게시되지는 않습니다.

## Firebase CLI를 사용하는 경우(선택)

`firebase.json`은 이제 Firestore 규칙만 참조합니다.

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules
```

반드시 대상 Firebase 프로젝트 ID를 확인하고 배포합니다.

## 무료 요금제 실사용 점검

- [ ] 로그인 및 최초 온보딩 완료
- [ ] Google 계정 사진이 마이페이지와 공개 페이지에 표시
- [ ] 프로필 사진 직접 업로드 UI 미표시
- [ ] 링크·SNS·디자인 저장 및 방문자 공개 페이지 열람
- [ ] 비활성 링크의 비로그인 접근 차단
- [ ] 별도 테스트 계정에서 탈퇴 후 Firestore 및 Auth 데이터 삭제 확인

계정 탈퇴는 브라우저에서 Firestore와 Auth를 순차 처리하므로 장애 시 일부 데이터가 남을 수 있습니다. 운영 서비스 수준의 원자적 삭제 및 재시도 시스템은 별도 백엔드 설계가 필요합니다.
