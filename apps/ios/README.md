# System — iOS

Native SwiftUI + SwiftData client. **Binary builds require macOS and Xcode** — this Linux environment provides sources and XCTest targets only.

## Open in Xcode (macOS)

```bash
open apps/ios/System.xcodeproj
```

1. Select the **System** scheme.
2. Signing & Capabilities → choose your Team.
3. Run on Simulator or device.
4. Run **SystemTests** for unit tests.

## Structure

```
System/                 App sources
SystemTests/            XCTest
System.xcodeproj/       Xcode project
```

## Auth

Supabase email/password; session tokens stored in Keychain via `KeychainStore`.
Notifications use `UserNotifications` after the user enables them in Settings.
