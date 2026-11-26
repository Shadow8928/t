import SwiftUI
import SwiftData

@main
struct SystemApp: App {
    @StateObject private var auth = AuthService()
    @StateObject private var timerService = TimerService()

    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            TaskItem.self,
            RoutineItem.self,
            RoutineStepItem.self,
            TimerSessionItem.self,
            PendingSyncOp.self,
        ])
        let config = ModelConfiguration(isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    @State private var showSplash = true

    var body: some Scene {
        WindowGroup {
            ZStack {
                RootView()
                    .environmentObject(auth)
                    .environmentObject(timerService)
                if showSplash {
                    SplashView()
                        .transition(.opacity)
                        .zIndex(1)
                }
            }
            .preferredColorScheme(.dark)
            .task {
                try? await Task.sleep(nanoseconds: 900_000_000)
                withAnimation(.easeOut(duration: 0.35)) {
                    showSplash = false
                }
            }
        }
        .modelContainer(sharedModelContainer)
    }
}
