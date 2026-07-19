import Foundation
import OperatorKit
import OperatorProtocol

public struct OperatorChatGatewayRequest: Sendable, Equatable {
    public let method: String
    public let params: [String: AnyCodable]
    public let timeoutMs: Double

    public init(method: String, params: [String: AnyCodable] = [:], timeoutMs: Double) {
        self.method = method
        self.params = params
        self.timeoutMs = timeoutMs
    }
}

public enum OperatorChatSessionTargetPolicy: Sendable {
    case preserveBareKeys
    case scopeBareKeysToSelectedAgent
}

public struct OperatorChatSessionTarget: Sendable, Equatable {
    public let sessionKey: String
    public let agentID: String?

    public init(sessionKey: String, agentID: String?) {
        self.sessionKey = sessionKey
        self.agentID = agentID
    }

    public static func resolve(
        _ rawSessionKey: String,
        selectedAgentID: String?,
        overrideAgentID: String? = nil,
        policy: OperatorChatSessionTargetPolicy) -> Self
    {
        let sessionKey = rawSessionKey.trimmingCharacters(in: .whitespacesAndNewlines)
        let selected = self.normalizedAgentID(selectedAgentID)
        let override = self.normalizedAgentID(overrideAgentID)

        if OperatorChatSessionKey.agentID(from: sessionKey) != nil {
            return Self(sessionKey: sessionKey, agentID: override)
        }
        let lowercasedKey = sessionKey.lowercased()
        if lowercasedKey.hasPrefix("agent:") || lowercasedKey == "unknown" {
            return Self(sessionKey: sessionKey, agentID: nil)
        }
        if lowercasedKey == "global" {
            return Self(sessionKey: sessionKey, agentID: override ?? selected)
        }

        switch policy {
        case .preserveBareKeys:
            return Self(sessionKey: sessionKey, agentID: override)
        case .scopeBareKeysToSelectedAgent:
            guard let agentID = override ?? selected else {
                return Self(sessionKey: sessionKey, agentID: nil)
            }
            return Self(sessionKey: "agent:\(agentID):\(sessionKey)", agentID: nil)
        }
    }

    private static func normalizedAgentID(_ agentID: String?) -> String? {
        let normalized = agentID?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return normalized?.isEmpty == false ? normalized : nil
    }
}

public enum OperatorChatGatewayRequests {
    private static let defaultTimeoutMs: Double = 15000
    private static let mutationTimeoutMs: Double = 15000
    private static let shortTimeoutMs: Double = 10000
    private static let compactionTimeoutMs: Double = 0

    public static func agentsList(timeoutMs: Double = 15000) -> OperatorChatGatewayRequest {
        OperatorChatGatewayRequest(method: "agents.list", timeoutMs: timeoutMs)
    }

    public static func modelsList() -> OperatorChatGatewayRequest {
        OperatorChatGatewayRequest(method: "models.list", timeoutMs: self.defaultTimeoutMs)
    }

    public static func sessionsList(
        limit: Int?,
        search: String?,
        archived: Bool,
        includeGlobal: Bool = true,
        includeUnknown: Bool = false,
        activeMinutes: Int? = nil,
        timeoutMs: Double = 15000) -> OperatorChatGatewayRequest
    {
        var params: [String: AnyCodable] = [
            "includeGlobal": AnyCodable(includeGlobal),
            "includeUnknown": AnyCodable(includeUnknown),
        ]
        if let limit {
            params["limit"] = AnyCodable(limit)
        }
        if let activeMinutes {
            params["activeMinutes"] = AnyCodable(activeMinutes)
        }
        let normalizedSearch = self.normalized(search)
        if let normalizedSearch {
            params["search"] = AnyCodable(normalizedSearch)
        }
        if archived {
            params["archived"] = AnyCodable(true)
        }
        return OperatorChatGatewayRequest(
            method: "sessions.list",
            params: params,
            timeoutMs: timeoutMs)
    }

    public static func createSession(
        key: String,
        agentID: String?,
        label: String?,
        parentSessionKey: String?,
        worktree: Bool?) -> OperatorChatGatewayRequest
    {
        var params = ["key": AnyCodable(key)]
        self.add(agentID, to: &params, key: "agentId")
        self.add(label, to: &params, key: "label", trim: false)
        self.add(parentSessionKey, to: &params, key: "parentSessionKey", trim: false)
        if let worktree {
            params["worktree"] = AnyCodable(worktree)
        }
        return OperatorChatGatewayRequest(
            method: "sessions.create",
            params: params,
            timeoutMs: self.mutationTimeoutMs)
    }

    public static func abortRun(
        sessionKey: String,
        agentID: String?,
        runID: String,
        requestTimeoutMs: Int = 10000) -> OperatorChatGatewayRequest
    {
        var params: [String: AnyCodable] = [
            "sessionKey": AnyCodable(sessionKey),
            "runId": AnyCodable(runID),
        ]
        self.add(agentID, to: &params, key: "agentId")
        return OperatorChatGatewayRequest(
            method: "chat.abort",
            params: params,
            timeoutMs: Double(requestTimeoutMs))
    }

    public static func patchSessionPreferences(
        sessionKey: String,
        agentID: String?,
        thinkingLevel: String?? = nil,
        verboseLevel: String?? = nil) -> OperatorChatGatewayRequest
    {
        self.patchSessionSettings(
            sessionKey: sessionKey,
            agentID: agentID,
            thinkingLevel: thinkingLevel,
            verboseLevel: verboseLevel)
    }

    public static func patchSessionSettings(
        sessionKey: String,
        agentID: String?,
        model: String?? = nil,
        thinkingLevel: String?? = nil,
        verboseLevel: String?? = nil) -> OperatorChatGatewayRequest
    {
        var params = self.sessionParams(sessionKey: sessionKey, agentID: agentID)
        if let model {
            params["model"] = model.map(AnyCodable.init) ?? AnyCodable(NSNull())
        }
        if let thinkingLevel {
            params["thinkingLevel"] = thinkingLevel.map(AnyCodable.init) ?? AnyCodable(NSNull())
        }
        if let verboseLevel {
            params["verboseLevel"] = verboseLevel.map(AnyCodable.init) ?? AnyCodable(NSNull())
        }
        return OperatorChatGatewayRequest(
            method: "sessions.patch",
            params: params,
            timeoutMs: self.mutationTimeoutMs)
    }

    public static func patchSession(
        sessionKey: String,
        agentID: String?,
        label: String??,
        category: String??,
        pinned: Bool?,
        archived: Bool?,
        unread: Bool?) -> OperatorChatGatewayRequest
    {
        var params = self.sessionParams(sessionKey: sessionKey, agentID: agentID)
        if let label {
            params["label"] = label.map(AnyCodable.init) ?? AnyCodable(NSNull())
        }
        if let category {
            params["category"] = category.map(AnyCodable.init) ?? AnyCodable(NSNull())
        }
        if let pinned {
            params["pinned"] = AnyCodable(pinned)
        }
        if let archived {
            params["archived"] = AnyCodable(archived)
        }
        if let unread {
            params["unread"] = AnyCodable(unread)
        }
        return OperatorChatGatewayRequest(
            method: "sessions.patch",
            params: params,
            timeoutMs: self.mutationTimeoutMs)
    }

    public static func deleteSession(
        sessionKey: String,
        agentID: String?) -> OperatorChatGatewayRequest
    {
        var params = self.sessionParams(sessionKey: sessionKey, agentID: agentID)
        params["deleteTranscript"] = AnyCodable(true)
        return OperatorChatGatewayRequest(
            method: "sessions.delete",
            params: params,
            timeoutMs: self.mutationTimeoutMs)
    }

    public static func forkSession(
        parentSessionKey: String,
        agentID: String?) -> OperatorChatGatewayRequest
    {
        var params: [String: AnyCodable] = [
            "parentSessionKey": AnyCodable(parentSessionKey),
            "fork": AnyCodable(true),
        ]
        self.add(agentID, to: &params, key: "agentId")
        return OperatorChatGatewayRequest(
            method: "sessions.create",
            params: params,
            timeoutMs: self.mutationTimeoutMs)
    }

    public static func subscribeSessionMessages(
        sessionKey: String,
        agentID: String?) -> OperatorChatGatewayRequest
    {
        OperatorChatGatewayRequest(
            method: "sessions.messages.subscribe",
            params: self.sessionParams(sessionKey: sessionKey, agentID: agentID),
            timeoutMs: self.shortTimeoutMs)
    }

    public static func resetSession(
        sessionKey: String,
        agentID: String?) -> OperatorChatGatewayRequest
    {
        OperatorChatGatewayRequest(
            method: "sessions.reset",
            params: self.sessionParams(sessionKey: sessionKey, agentID: agentID),
            timeoutMs: self.shortTimeoutMs)
    }

    public static func compactSession(
        sessionKey: String,
        agentID: String?,
        maxLines: Int? = nil) -> OperatorChatGatewayRequest
    {
        var params = self.sessionParams(sessionKey: sessionKey, agentID: agentID)
        if let maxLines {
            params["maxLines"] = AnyCodable(maxLines)
        }
        return OperatorChatGatewayRequest(
            method: "sessions.compact",
            params: params,
            timeoutMs: self.compactionTimeoutMs)
    }

    public static func history(
        sessionKey: String,
        agentID: String?,
        limit: Int? = nil,
        maxChars: Int? = nil,
        timeoutMs: Int? = nil) -> OperatorChatGatewayRequest
    {
        var params: [String: AnyCodable] = ["sessionKey": AnyCodable(sessionKey)]
        self.add(agentID, to: &params, key: "agentId")
        if let limit {
            params["limit"] = AnyCodable(limit)
        }
        if let maxChars {
            params["maxChars"] = AnyCodable(maxChars)
        }
        return OperatorChatGatewayRequest(
            method: "chat.history",
            params: params,
            timeoutMs: timeoutMs.map(Double.init) ?? self.defaultTimeoutMs)
    }

    public static func commandsList(
        sessionKey: String?,
        fallbackAgentID: String?) -> OperatorChatGatewayRequest
    {
        var params: [String: AnyCodable] = [
            "scope": AnyCodable("text"),
            "includeArgs": AnyCodable(true),
        ]
        self.add(
            sessionKey.flatMap(OperatorChatSessionKey.agentID) ?? fallbackAgentID,
            to: &params,
            key: "agentId")
        return OperatorChatGatewayRequest(
            method: "commands.list",
            params: params,
            timeoutMs: self.defaultTimeoutMs)
    }

    public static func sendMessage(
        sessionKey: String,
        agentID: String?,
        expectedSessionRoutingContract: String?,
        message: String,
        thinking: String?,
        idempotencyKey: String,
        attachments: [OperatorChatAttachmentPayload],
        runTimeoutMs: Int? = nil,
        requestTimeoutMs: Int = 30000) -> OperatorChatGatewayRequest
    {
        var params: [String: AnyCodable] = [
            "sessionKey": AnyCodable(sessionKey),
            "message": AnyCodable(message),
            "idempotencyKey": AnyCodable(idempotencyKey),
        ]
        self.add(agentID, to: &params, key: "agentId")
        self.add(
            expectedSessionRoutingContract,
            to: &params,
            key: "expectedSessionRoutingContract")
        self.add(thinking, to: &params, key: "thinking")
        if let runTimeoutMs {
            params["timeoutMs"] = AnyCodable(runTimeoutMs)
        }
        if !attachments.isEmpty {
            let encoded = attachments.map { attachment in
                [
                    "type": attachment.type,
                    "mimeType": attachment.mimeType,
                    "fileName": attachment.fileName,
                    "content": attachment.content,
                ]
            }
            params["attachments"] = AnyCodable(encoded)
        }
        return OperatorChatGatewayRequest(
            method: "chat.send",
            params: params,
            timeoutMs: Double(requestTimeoutMs))
    }

    public static func agentWait(
        runID: String,
        timeoutMs: Int,
        requestGraceMs: Int = 5000) -> OperatorChatGatewayRequest
    {
        OperatorChatGatewayRequest(
            method: "agent.wait",
            params: [
                "runId": AnyCodable(runID),
                "timeoutMs": AnyCodable(timeoutMs),
            ],
            timeoutMs: Double(timeoutMs + requestGraceMs))
    }

    public static func health(timeoutMs: Int) -> OperatorChatGatewayRequest {
        OperatorChatGatewayRequest(
            method: "health",
            timeoutMs: Double(max(1, timeoutMs)))
    }

    private static func sessionParams(
        sessionKey: String,
        agentID: String?) -> [String: AnyCodable]
    {
        var params = ["key": AnyCodable(sessionKey)]
        self.add(agentID, to: &params, key: "agentId")
        return params
    }

    private static func add(
        _ value: String?,
        to params: inout [String: AnyCodable],
        key: String,
        trim: Bool = true)
    {
        let value = trim ? self.normalized(value) : value
        if let value {
            params[key] = AnyCodable(value)
        }
    }

    private static func normalized(_ value: String?) -> String? {
        let normalized = value?.trimmingCharacters(in: .whitespacesAndNewlines)
        return normalized?.isEmpty == false ? normalized : nil
    }
}

extension GatewayNodeSession {
    public func request(
        _ request: OperatorChatGatewayRequest,
        ifCurrentRoute expectedRoute: GatewayNodeSessionRoute? = nil,
        distinguishPreDispatchRouteChange: Bool = false) async throws -> Data
    {
        try await self.request(
            method: request.method,
            params: request.params,
            timeoutMs: request.timeoutMs,
            ifCurrentRoute: expectedRoute,
            distinguishPreDispatchRouteChange: distinguishPreDispatchRouteChange)
    }
}
