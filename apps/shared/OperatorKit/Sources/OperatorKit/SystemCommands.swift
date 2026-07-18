import Foundation

public enum operatorSystemCommand: String, Codable, Sendable {
    case run = "system.run"
    case which = "system.which"
    case notify = "system.notify"
    case execApprovalsGet = "system.execApprovals.get"
    case execApprovalsSet = "system.execApprovals.set"
}

public enum operatorFileSystemCommand: String, Codable, Sendable {
    case listDir = "fs.listDir"
}

public enum operatorNotificationPriority: String, Codable, Sendable {
    case passive
    case active
    case timeSensitive
}

public enum operatorNotificationDelivery: String, Codable, Sendable {
    case system
    case overlay
    case auto
}

public struct operatorSystemNotifyParams: Codable, Sendable, Equatable {
    public var title: String
    public var body: String
    public var sound: String?
    public var priority: operatorNotificationPriority?
    public var delivery: operatorNotificationDelivery?

    public init(
        title: String,
        body: String,
        sound: String? = nil,
        priority: operatorNotificationPriority? = nil,
        delivery: operatorNotificationDelivery? = nil)
    {
        self.title = title
        self.body = body
        self.sound = sound
        self.priority = priority
        self.delivery = delivery
    }
}
