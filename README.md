# Pump Hisaab V2

This is the upgraded frontend for the existing Pump Manager Firebase project.

## Existing Firebase data
- `users/{firebaseUid}`: owner/staff profiles
- `pumps/AKSHAT`
- `pumps/PRAGATI`

## New V2 collections
- `shifts`
- `expenses`
- `stock`
- `price_history`

## Fuel price control
The Owner can save Petrol and Diesel prices from **Prices**.
Staff can only read them. The provided `FIRESTORE_RULES.txt` is designed to enforce this at Firebase level.

When a shift is saved, the current owner-set prices are copied into the shift (`petrolRate`, `dieselRate`) so historical entries keep the price that was actually used.

## Important
Before using the app with real business data, publish and test `FIRESTORE_RULES.txt` in Firebase Console.

The app uses the Firebase Web SDK configuration already present in `js/config.js`.
