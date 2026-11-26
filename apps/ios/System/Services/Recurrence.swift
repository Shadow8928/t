import Foundation

/// ISO weekday Mon=1…Sun=7 — mirrors packages/domain
enum IsoWeekday: Int {
    case mon = 1, tue, wed, thu, fri, sat, sun
}

struct RecurrenceRule: Codable, Equatable {
    enum Kind: String, Codable { case one_time, daily, weekday, weekly, selected_weekdays, interval }
    var kind: Kind
    var weekdays: [Int]?
    var intervalDays: Int?
    var localTime: String?
    var startDate: String
    var endDate: String?
}

struct Occurrence: Equatable {
    var date: String
    var fixedTime: Bool
}

enum RecurrenceEngine {
    static func jsDayToIso(_ jsDay: Int) -> Int {
        ((jsDay + 6) % 7) + 1
    }

    static func generateOccurrences(rule: RecurrenceRule, fromDate: String, horizonDays: Int = 30) -> [Occurrence] {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = TimeZone(identifier: "UTC")
        formatter.dateFormat = "yyyy-MM-dd"

        guard var cursor = formatter.date(from: max(rule.startDate, fromDate)),
              let start = formatter.date(from: rule.startDate) else { return [] }

        let endLimit = Calendar.current.date(byAdding: .day, value: horizonDays, to: cursor)!
        var hardEnd: Date? = nil
        if let e = rule.endDate { hardEnd = formatter.date(from: e) }

        var out: [Occurrence] = []
        for _ in 0..<(horizonDays + 370) {
            if cursor > endLimit { break }
            if let hardEnd, cursor >= hardEnd { break }
            let iso = jsDayToIso(Calendar.current.component(.weekday, from: cursor) - 1)
            // Calendar weekday: 1=Sun… — convert via DateComponents in UTC
            let js = Calendar(identifier: .gregorian).dateComponents(in: TimeZone(identifier: "UTC")!, from: cursor).weekday! - 1
            let isoDay = jsDayToIso(js)
            let match: Bool
            switch rule.kind {
            case .one_time:
                match = formatter.string(from: cursor) == rule.startDate
            case .daily:
                match = true
            case .weekday:
                match = (1...5).contains(isoDay)
            case .weekly, .selected_weekdays:
                match = (rule.weekdays ?? []).contains(isoDay)
            case .interval:
                let days = Calendar.current.dateComponents([.day], from: start, to: cursor).day ?? 0
                let interval = max(1, rule.intervalDays ?? 1)
                match = days >= 0 && days % interval == 0
            }
            _ = iso
            if match {
                out.append(Occurrence(date: formatter.string(from: cursor), fixedTime: rule.localTime != nil))
                if rule.kind == .one_time { break }
            }
            cursor = Calendar.current.date(byAdding: .day, value: 1, to: cursor)!
        }
        return out
    }
}
