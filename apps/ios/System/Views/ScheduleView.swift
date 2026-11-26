import SwiftUI
import SwiftData

struct ScheduleView: View {
    @Query(filter: #Predicate<TaskItem> { $0.deletedAt == nil }) private var tasks: [TaskItem]

    var body: some View {
        NavigationStack {
            List {
                ForEach(tasks.filter { $0.scheduledAt != nil || $0.recurrenceJSON != nil }, id: \.id) { task in
                    VStack(alignment: .leading) {
                        Text(task.title)
                        Text(task.fixedTime ? "Fixed time" : "Flexible")
                            .font(.caption)
                            .foregroundStyle(SystemTheme.textSecondary)
                    }
                    .listRowBackground(SystemTheme.surface)
                }
            }
            .scrollContentBackground(.hidden)
            .background(SystemTheme.background)
            .navigationTitle("Schedule")
        }
    }
}
