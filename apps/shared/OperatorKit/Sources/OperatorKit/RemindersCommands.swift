import Foundation

public enum operatorRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum operatorReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct operatorRemindersListParams: Codable, Sendable, Equatable {
    public var status: operatorReminderStatusFilter?
    public var limit: Int?

    public init(status: operatorReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct operatorRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct operatorReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct operatorRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [operatorReminderPayload]

    public init(reminders: [operatorReminderPayload]) {
        self.reminders = reminders
    }
}

public struct operatorRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: operatorReminderPayload

    public init(reminder: operatorReminderPayload) {
        self.reminder = reminder
    }
}
