import SwiftUI

/// Launch / splash branding using the official logo asset.
struct SplashView: View {
    var body: some View {
        ZStack {
            SystemTheme.background.ignoresSafeArea()
            VStack(spacing: 16) {
                BrandMarkView(size: 96, showWordmark: true)
                Text("Your day. Under control.")
                    .foregroundStyle(SystemTheme.textSecondary)
            }
        }
    }
}
