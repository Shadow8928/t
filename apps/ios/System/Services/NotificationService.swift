import Foundation
import UserNotifications

enum NotificationService {
    static func requestAfterEnable() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    static func scheduleTimerDone(inSeconds: TimeInterval) {
        let content = UNMutableNotificationContent()
        content.title = "Timer complete"
        content.body = "Your focus block finished."
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(1, inSeconds), repeats: false)
        let req = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(req)
    }
}
