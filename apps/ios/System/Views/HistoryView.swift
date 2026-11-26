import SwiftUI
import SwiftData

struct HistoryView: View {
    @Query(filter: #Predicate<TaskItem> { $0.status == "completed" }) private var completed: [TaskItem]

    var body: some View {
        NavigationStack {
            List(completed, id: \.id) { task in
                HStack {
                    Text(task.title)
                    Spacer()
                    if let completedAt = task.completedAt {
                        Text(completedAt.formatted(date: .abbreviated, time: .shortened))
                            .font(.caption)
                            .foregroundStyle(SystemTheme.textSecondary)
                    }
                }
                .listRowBackground(SystemTheme.surface)
            }
            .scrollContentBackground(.hidden)
            .background(SystemTheme.background)
            .navigationTitle("History")
        }
    }
}
