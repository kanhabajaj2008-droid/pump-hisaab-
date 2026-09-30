# Pump Manager — Firebase Edition

This version uses Firebase Authentication + Cloud Firestore.

## Firebase data expected

Root collections:
- `pumps`
- `users`
- `shifts`
- `expenses`
- `audit_logs`
- `settings` (optional for future features)

Pump documents:
- `AKSHAT`: code=AKSHAT, name=Akshat Filling Station, company=BPCL, active=true
- `PRAGATI`: code=PRAGATI, name=Pragati Filling Station, company=HPCL, active=true

User documents use the Firebase Authentication UID as the document ID:
- Owner: role=`owner`, pumpAccess=`["AKSHAT","PRAGATI"]`, active=true
- Staff: role=`staff`, pumpAccess=`["AKSHAT"]` or `["PRAGATI"]`, active=true

## Connect the app
Open `js/config.js` and paste the Firebase Web App config from:
Firebase Console → Project settings → Your apps → Web app → SDK setup and configuration.

Do NOT put service-account private keys or Admin SDK credentials in this frontend.

## Important
The Firestore security rules must be configured in Firebase Console. The app expects fields named in camelCase such as `pumpId`, `staffId`, and `createdAt`.

For production, test the rules with Firebase's Rules Playground/Emulator before relying on them for sensitive business operations.
