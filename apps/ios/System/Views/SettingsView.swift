import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var auth: AuthService
    @State private var notificationsOn = false
    @State private var status = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Account") {
                    Text(auth.localDemo ? "Local demo" : (auth.email ?? "Signed in"))
                    Button("Sign out", role: .destructive) { auth.signOut() }
                }
                Section("Notifications") {
                    Toggle("Enable notifications", isOn: $notificationsOn)
                        .onChange(of: notificationsOn) { _, on in
                            if on {
                                Task {
                                    let ok = await NotificationService.requestAfterEnable()
                                    status = ok ? "Permission granted" : "Permission denied"
                                    if !ok { notificationsOn = false }
                                }
                            }
                        }
                    Text("Permission is requested only after you enable this toggle.")
                        .font(.footnote)
                        .foregroundStyle(SystemTheme.textSecondary)
                }
                Section("Branding") {
                    Text("Official logo missing — wordmark only. Supply assets/branding/original-logo/.")
                        .font(.footnote)
                }
                if !status.isEmpty {
                    Section { Text(status).foregroundStyle(SystemTheme.accent) }
                }
            }
            .scrollContentBackground(.hidden)
            .background(SystemTheme.background)
            .navigationTitle("Settings")
        }
    }
}
