import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var auth: AuthService
    @State private var email = ""
    @State private var password = ""
    @State private var isRegister = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            BrandMarkView(size: 64, showWordmark: true)
            Text("Your day. Under control.")
                .foregroundStyle(SystemTheme.textSecondary)

            TextField("Email", text: $email)
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)
                .padding(12)
                .background(SystemTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 10))

            SecureField("Password", text: $password)
                .padding(12)
                .background(SystemTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 10))

            if let err = auth.errorMessage {
                Text(err).foregroundStyle(SystemTheme.danger).font(.footnote)
            }

            Button(isRegister ? "Create account" : "Sign in") {
                Task {
                    if isRegister {
                        await auth.signUp(email: email, password: password)
                    } else {
                        await auth.signIn(email: email, password: password)
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(12)
            .background(SystemTheme.accent)
            .foregroundStyle(SystemTheme.background)
            .clipShape(RoundedRectangle(cornerRadius: 10))

            Button(isRegister ? "Have an account? Sign in" : "Need an account? Register") {
                isRegister.toggle()
            }
            .foregroundStyle(SystemTheme.textSecondary)

            Button("Continue offline (local demo)") {
                auth.enterLocalDemo()
            }
            .foregroundStyle(SystemTheme.accent)
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(SystemTheme.background)
    }
}
