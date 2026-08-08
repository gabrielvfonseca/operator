import Foundation
import Testing
@testable import OperatorKit

struct HealthCommandsTests {
    @Test func `health summary periods use the node command wire values`() throws {
        #expect(OperatorHealthCommand.summary.rawValue == "health.summary")
        #expect(OperatorHealthSummaryPeriod.allCases.map(\.rawValue) == ["today"])

        let params = OperatorHealthSummaryParams(period: .today)
        let data = try JSONEncoder().encode(params)
        #expect(String(decoding: data, as: UTF8.self) == #"{"period":"today"}"#)
    }
}
