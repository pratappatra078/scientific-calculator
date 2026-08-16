# Pratap Calculator

A polished, production-quality calculator app for Android built with React Native, Expo, TypeScript, and Expo Router.

## Features

- Minimal premium design with circular buttons and a blue accent
- **Editable expression** with a tappable, blinking cursor (`1500×2` → tap between `15` and `00` → type `0` → `15000×2`) with horizontal scroll
- Result shown as `=3000` below the expression, updating live as you type
- Standard keypad: `C % ÷ ⌫` `7 8 9 ×` `4 5 6 −` `1 2 3 +` `00 0 . =`
- Safe expression evaluation with operator precedence (`2 + 3 × 4 = 14`) — no `eval()`
- **Day / Night / System themes** with an in-app switcher (about dialog) and a smooth animated transition
- Calculation history stored locally with AsyncStorage (view, reuse, clear)
- About dialog with app version, developer info, and a tappable email that opens the device mail app via `mailto:`
- Responsive layout that adapts to screen size, respects safe areas, and keeps touch targets ≥ 44dp
- Accessibility labels and roles for Android accessibility services

## Getting started

```bash
npm install
npx expo start
```

From the Expo CLI output you can open the app on:

- **Android**: `npx expo start --android` (needs an Android emulator or a device with Expo Go)
- **iOS simulator**: `npx expo start --ios`
- **Web**: `npx expo start --web`

## Testing on Android

1. Install [Expo Go](https://expo.dev/go) on your Android device, or start an Android emulator.
2. Run `npx expo start --android`.

The app is portrait-only and auto-adapts between the system's light and dark theme.

## Checks

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (expo config)
npx expo-doctor     # Dependency / project health
```

## Notes

- `%` is a postfix operator: `50% = 0.5`, so `50 + 10% = 50.1`.
- Division by zero, malformed expressions, and non-finite results display `Error`.
- History and keypad state are never persisted mid-calculation; only completed results are saved.

## App metadata

- Display name: **Pratap Calculator**
- Android package: `com.pratappatra.calculator`
- iOS bundle identifier: `com.pratappatra.calculator`
