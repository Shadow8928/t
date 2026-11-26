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

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .environmentObject(timerService)
                .preferredColorScheme(.dark)
        }
        .modelContainer(sharedModelContainer)
    }
}
