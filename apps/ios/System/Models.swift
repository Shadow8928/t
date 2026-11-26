import Foundation
import SwiftData

@Model
final class TaskItem {
    @Attribute(.unique) var id: String
    var title: String
    var notes: String?
    var priority: String
    var status: String
    var fixedTime: Bool
    var scheduledAt: Date?
    var durationMinutes: Int?
    var recurrenceJSON: String?
    var completedAt: Date?
    var deletedAt: Date?
    var updatedAt: Date
    var version: Int

    init(
        id: String = UUID().uuidString,
        title: String,
        notes: String? = nil,
        priority: String = "normal",
        status: String = "pending",
        fixedTime: Bool = false,
        scheduledAt: Date? = nil,
        durationMinutes: Int? = nil,
        recurrenceJSON: String? = nil
    ) {
        self.id = id
        self.title = title
        self.notes = notes
        self.priority = priority
        self.status = status
        self.fixedTime = fixedTime
        self.scheduledAt = scheduledAt
        self.durationMinutes = durationMinutes
        self.recurrenceJSON = recurrenceJSON
        self.updatedAt = Date()
        self.version = 1
    }
}

@Model
final class RoutineItem {
    @Attribute(.unique) var id: String
    var name: String
    var kind: String
    var deletedAt: Date?
    var updatedAt: Date
    var version: Int
    @Relationship(deleteRule: .cascade) var steps: [RoutineStepItem]

    init(id: String = UUID().uuidString, name: String, kind: String, steps: [RoutineStepItem] = []) {
        self.id = id
        self.name = name
        self.kind = kind
        self.steps = steps
        self.updatedAt = Date()
        self.version = 1
    }
}

@Model
final class RoutineStepItem {
    @Attribute(.unique) var id: String
    var title: String
    var durationMinutes: Int
    var sortOrder: Int

    init(id: String = UUID().uuidString, title: String, durationMinutes: Int, sortOrder: Int) {
        self.id = id
        self.title = title
        self.durationMinutes = durationMinutes
        self.sortOrder = sortOrder
    }
}

@Model
final class TimerSessionItem {
    @Attribute(.unique) var id: String
    var taskId: String?
    var routineStepId: String?
    var state: String
    var startedAt: Date
    var endsAt: Date
    var pausedAt: Date?
    var remainingMsWhenPaused: Int?
    var provisional: Bool
    var updatedAt: Date
    var version: Int

    init(
        id: String = UUID().uuidString,
        durationMs: Int,
        taskId: String? = nil,
        routineStepId: String? = nil,
        provisional: Bool = true
    ) {
        let now = Date()
        self.id = id
        self.taskId = taskId
        self.routineStepId = routineStepId
        self.state = "running"
        self.startedAt = now
        self.endsAt = now.addingTimeInterval(TimeInterval(durationMs) / 1000.0)
        self.provisional = provisional
        self.updatedAt = now
        self.version = 1
    }
}

@Model
final class PendingSyncOp {
    @Attribute(.unique) var clientOpId: String
    var entityType: String
    var entityId: String
    var op: String
    var payloadJSON: String
    var baseVersion: Int?
    var createdAt: Date
    var attempts: Int

    init(entityType: String, entityId: String, op: String, payloadJSON: String, baseVersion: Int?) {
        self.clientOpId = UUID().uuidString
        self.entityType = entityType
        self.entityId = entityId
        self.op = op
        self.payloadJSON = payloadJSON
        self.baseVersion = baseVersion
        self.createdAt = Date()
        self.attempts = 0
    }
}
