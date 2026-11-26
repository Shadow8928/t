import SwiftUI

/// Official System logo (black mark on transparent).
/// Shown on a light chip so the mark stays visible on the dark UI.
struct BrandMarkView: View {
    var size: CGFloat = 48
    var showWordmark: Bool = true

    var body: some View {
        HStack(spacing: 12) {
            Image("LaunchLogo")
                .resizable()
                .scaledToFit()
                .padding(size * 0.12)
                .frame(width: size, height: size)
                .background(Color(red: 240 / 255, green: 243 / 255, blue: 240 / 255))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            if showWordmark {
                Text(SystemTheme.wordmark)
                    .font(.title.bold())
                    .foregroundStyle(SystemTheme.accent)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("System")
    }
}
