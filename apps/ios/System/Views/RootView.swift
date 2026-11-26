import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthService

    var body: some View {
        Group {
            if auth.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .background(SystemTheme.background.ignoresSafeArea())
    }
}
