import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            TodayView()
                .tabItem { Label("Today", systemImage: "sun.max") }
            ScheduleView()
                .tabItem { Label("Schedule", systemImage: "calendar") }
            RoutinesView()
                .tabItem { Label("Routines", systemImage: "list.bullet") }
            HistoryView()
                .tabItem { Label("History", systemImage: "clock") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
        .tint(SystemTheme.accent)
    }
}
