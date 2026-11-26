import XCTest
@testable import System

@MainActor
final class TimerMathTests: XCTestCase {
    func testFormatAndConflict() {
        let service = TimerService()
        XCTAssertEqual(service.format(65_000), "1:05")

        var inserted: TimerSessionItem?
        let bridge = ModelContextBridge { inserted = $0 }
        service.start(durationMs: 60_000, into: bridge)
        XCTAssertNotNil(inserted)
        service.start(durationMs: 60_000, into: bridge)
        XCTAssertEqual(service.conflictMessage, "A timer is already active.")
    }
}
