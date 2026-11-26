import Foundation
import Combine

@MainActor
final class TimerService: ObservableObject {
    @Published var active: TimerSessionItem?
    @Published var conflictMessage: String?

    func remainingMs(at date: Date = Date()) -> Int {
        guard let t = active else { return 0 }
        if t.state == "paused" {
            return max(0, t.remainingMsWhenPaused ?? 0)
        }
        if t.state != "running" { return 0 }
        return max(0, Int(t.endsAt.timeIntervalSince(date) * 1000))
    }

    func format(_ ms: Int) -> String {
        let total = Int(ceil(Double(ms) / 1000.0))
        let m = total / 60
        let s = total % 60
        return String(format: "%d:%02d", m, s)
    }

    func start(durationMs: Int, into context: ModelContextBridge) {
        if active != nil && (active?.state == "running" || active?.state == "paused") {
            conflictMessage = "A timer is already active."
            return
        }
        conflictMessage = nil
        let session = TimerSessionItem(durationMs: durationMs, provisional: true)
        context.insertTimer(session)
        active = session
    }

    func pause() {
        guard let t = active, t.state == "running" else { return }
        t.remainingMsWhenPaused = remainingMs()
        t.pausedAt = Date()
        t.state = "paused"
        t.updatedAt = Date()
    }

    func resume() {
        guard let t = active, t.state == "paused" else { return }
        let rem = t.remainingMsWhenPaused ?? 0
        t.state = "running"
        t.pausedAt = nil
        t.remainingMsWhenPaused = nil
        t.endsAt = Date().addingTimeInterval(TimeInterval(rem) / 1000.0)
        t.updatedAt = Date()
    }

    func cancel() {
        guard let t = active else { return }
        t.state = "cancelled"
        t.updatedAt = Date()
        active = nil
    }
}

/// Thin bridge so TimerService stays testable without importing SwiftData in every call site shape.
struct ModelContextBridge {
    let insertTimer: (TimerSessionItem) -> Void
}
