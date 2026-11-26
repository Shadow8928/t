import SwiftUI
import SwiftData

struct TodayView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var timerService: TimerService
    @Query(filter: #Predicate<TaskItem> { $0.deletedAt == nil }) private var tasks: [TaskItem]
    @State private var tick = Date()

    var body: some View {
        NavigationStack {
            List {
                Section("Open") {
                    ForEach(tasks.filter { $0.status != "completed" }, id: \.id) { task in
                        HStack {
                            Text(task.title)
                            Spacer()
                            Text(task.priority)
                                .font(.caption)
                                .foregroundStyle(SystemTheme.textSecondary)
                        }
                        .listRowBackground(SystemTheme.surface)
                    }
                }
                Section("Timer") {
                    Text(timerService.format(timerService.remainingMs(at: tick)))
                        .font(.largeTitle.monospacedDigit())
                        .foregroundStyle(SystemTheme.accent)
                    HStack {
                        Button("Start 25m") {
                            timerService.start(
                                durationMs: 25 * 60_000,
                                into: ModelContextBridge { modelContext.insert($0) }
                            )
                        }
                        Button("Pause") { timerService.pause() }
                        Button("Resume") { timerService.resume() }
                        Button("Cancel") { timerService.cancel() }
                    }
                    if let msg = timerService.conflictMessage {
                        Text(msg).foregroundStyle(SystemTheme.warning).font(.footnote)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(SystemTheme.background)
            .navigationTitle(SystemTheme.wordmark)
            .onAppear {
                Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
                    tick = Date()
                }
            }
        }
    }
}
