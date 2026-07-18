import Foundation

public struct operatorSessionsCompactResponse: Decodable, Sendable {
    public let ok: Bool
    public let reason: String?

    public static func requireSuccess(from data: Data) throws {
        let response = try JSONDecoder().decode(Self.self, from: data)
        guard response.ok else {
            throw operatorSessionsCompactError(reason: response.reason)
        }
    }
}

struct operatorSessionsCompactError: Error, LocalizedError, Sendable {
    let reason: String?

    var errorDescription: String? {
        let detail = self.reason?.trimmingCharacters(in: .whitespacesAndNewlines)
        return detail?.isEmpty == false ? detail : "Session compaction failed"
    }
}
