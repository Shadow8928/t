import XCTest
@testable import System

final class RecurrenceTests: XCTestCase {
    func testJsDayToIso() {
        XCTAssertEqual(RecurrenceEngine.jsDayToIso(0), 7)
        XCTAssertEqual(RecurrenceEngine.jsDayToIso(1), 1)
    }

    func testDailyHorizon() {
        let rule = RecurrenceRule(kind: .daily, startDate: "2026-11-26")
        let occ = RecurrenceEngine.generateOccurrences(rule: rule, fromDate: "2026-11-26", horizonDays: 2)
        XCTAssertEqual(occ.map(\.date), ["2026-11-26", "2026-11-27", "2026-11-28"])
    }

    func testSelectedWeekdays() {
        let rule = RecurrenceRule(
            kind: .selected_weekdays,
            weekdays: [1, 3, 5],
            startDate: "2026-11-23"
        )
        let occ = RecurrenceEngine.generateOccurrences(rule: rule, fromDate: "2026-11-23", horizonDays: 7)
        XCTAssertEqual(occ.map(\.date), ["2026-11-23", "2026-11-25", "2026-11-27", "2026-11-30"])
    }
}
