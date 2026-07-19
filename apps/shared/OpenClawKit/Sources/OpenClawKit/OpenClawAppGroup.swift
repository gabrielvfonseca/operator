import Foundation

public enum OperatorAppGroup {
    public static let canonicalIdentifier = "group.ai.operatorfoundation.app.shared"

    public static var identifier: String {
        let raw = Bundle.main.object(forInfoDictionaryKey: "OperatorAppGroupIdentifier") as? String
        let trimmed = raw?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? self.canonicalIdentifier : trimmed
    }
}
