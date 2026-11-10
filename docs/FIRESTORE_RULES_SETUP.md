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