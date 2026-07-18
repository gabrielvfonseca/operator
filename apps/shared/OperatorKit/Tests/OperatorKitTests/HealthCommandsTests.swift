import Foundation
import Testing
@testable import operatorKit

struct HealthCommandsTests {
    @Test func `health summary periods use the node command wire values`() throws {
        #expect(operatorHealthCommand.summary.rawValue == "health.summary")
        #expect(operatorHealthSummaryPeriod.allCases.map(\.rawValue) == ["today"])

        let params = operatorHealthSummaryParams(period: .today)
        let data = try JSONEncoder().encode(params)
        #expect(String(decoding: data, as: UTF8.self) == #"{"period":"today"}"#)
    }
}
