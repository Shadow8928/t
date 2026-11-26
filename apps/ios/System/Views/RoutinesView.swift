import SwiftUI
import SwiftData

struct RoutinesView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(filter: #Predicate<RoutineItem> { $0.deletedAt == nil }) private var routines: [RoutineItem]
    @State private var name = ""

    var body: some View {
        NavigationStack {
            List {
                Section {
                    TextField("New routine", text: $name)
                    Button("Add morning routine") {
                        guard !name.isEmpty else { return }
                        let step = RoutineStepItem(title: "Start", durationMinutes: 5, sortOrder: 0)
                        let routine = RoutineItem(name: name, kind: "morning", steps: [step])
                        modelContext.insert(routine)
                        name = ""
                    }
                }
                Section("Routines") {
                    ForEach(routines, id: \.id) { r in
                        VStack(alignment: .leading) {
                            Text(r.name)
                            Text(r.kind).font(.caption).foregroundStyle(SystemTheme.textSecondary)
                        }
                        .listRowBackground(SystemTheme.surface)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(SystemTheme.background)
            .navigationTitle("Routines")
        }
    }
}
