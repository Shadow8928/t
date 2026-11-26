import Foundation
import Combine

@MainActor
final class AuthService: ObservableObject {
    @Published var isAuthenticated = false
    @Published var email: String?
    @Published var localDemo = false
    @Published var errorMessage: String?

    private let accessTokenKey = "supabase_access_token"
    private let refreshTokenKey = "supabase_refresh_token"
    private let emailKey = "supabase_email"

    init() {
        if KeychainStore.get(accessTokenKey) != nil {
            isAuthenticated = true
            email = KeychainStore.get(emailKey)
        }
        if UserDefaults.standard.bool(forKey: "localDemo") {
            localDemo = true
            isAuthenticated = true
        }
    }

    var supabaseURL: String? { Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String }
    var supabaseAnonKey: String? { Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String }

    func enterLocalDemo() {
        localDemo = true
        isAuthenticated = true
        UserDefaults.standard.set(true, forKey: "localDemo")
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        guard let base = supabaseURL, let key = supabaseAnonKey, !key.contains("your-anon") else {
            errorMessage = "Supabase not configured. Use local demo."
            return
        }
        guard let url = URL(string: "\(base)/auth/v1/token?grant_type=password") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(key, forHTTPHeaderField: "apikey")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["email": email, "password": password])
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let access = json["access_token"] as? String,
               let refresh = json["refresh_token"] as? String {
                KeychainStore.set(access, account: accessTokenKey)
                KeychainStore.set(refresh, account: refreshTokenKey)
                KeychainStore.set(email, account: emailKey)
                self.email = email
                self.isAuthenticated = true
            } else if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let msg = json["error_description"] as? String ?? json["msg"] as? String {
                errorMessage = msg
            } else {
                errorMessage = "Sign-in failed"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signUp(email: String, password: String) async {
        errorMessage = nil
        guard let base = supabaseURL, let key = supabaseAnonKey else {
            errorMessage = "Supabase not configured."
            return
        }
        guard let url = URL(string: "\(base)/auth/v1/signup") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(key, forHTTPHeaderField: "apikey")
        req.httpBody = try? JSONSerialization.data(withJSONObject: [
            "email": email,
            "password": password,
            "data": ["timezone": "America/Chicago"],
        ])
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               json["access_token"] != nil || json["id"] != nil {
                await signIn(email: email, password: password)
            } else if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let msg = json["msg"] as? String ?? json["error_description"] as? String {
                errorMessage = msg
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() {
        KeychainStore.delete(accessTokenKey)
        KeychainStore.delete(refreshTokenKey)
        KeychainStore.delete(emailKey)
        UserDefaults.standard.set(false, forKey: "localDemo")
        localDemo = false
        email = nil
        isAuthenticated = false
    }

    func accessToken() -> String? { KeychainStore.get(accessTokenKey) }
}
