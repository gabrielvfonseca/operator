import Foundation
import OperatorKit
import Testing
@testable import OperatorChatUI

private final class HapticRecorder: @unchecked Sendable {
    private let lock = NSLock()
    private var recordedEvents: [OperatorChatHaptics.Event] = []

    var events: [OperatorChatHaptics.Event] {
        self.lock.lock()
        defer { self.lock.unlock() }
        return self.recordedEvents
    }

    func record(_ event: OperatorChatHaptics.Event) {
        self.lock.lock()
        defer { self.lock.unlock() }
        self.recordedEvents.append(event)
    }
}

private final class HapticsTestTransport: @unchecked Sendable, OperatorChatTransport {
    private let response: OperatorChatSendResponse
    private let historyMessages: [AnyCodable]
    private let stream: AsyncStream<OperatorChatTransportEvent>
    private let continuation: AsyncStream<OperatorChatTransportEvent>.Continuation

    init(status: String, historyMessages: [AnyCodable] = []) {
        self.response = OperatorChatSendResponse(runId: "run-1", status: status)
        self.historyMessages = historyMessages
        var continuation: AsyncStream<OperatorChatTransportEvent>.Continuation!
        self.stream = AsyncStream { continuation = $0 }
        self.continuation = continuation
    }

    func requestHistory(sessionKey: String) async throws -> OperatorChatHistoryPayload {
        OperatorChatHistoryPayload(
            sessionKey: sessionKey,
            sessionId: "session-1",
            messages: self.historyMessages,
            thinkingLevel: "off")
    }

    func sendMessage(
        sessionKey _: String,
        message _: String,
        thinking _: String,
        idempotencyKey _: String,
        attachments _: [OperatorChatAttachmentPayload]) async throws -> OperatorChatSendResponse
    {
        self.response
    }

    func requestHealth(timeoutMs _: Int) async throws -> Bool {
        true
    }

    func events() -> AsyncStream<OperatorChatTransportEvent> {
        self.stream
    }

    func emit(_ event: OperatorChatTransportEvent) {
        self.continuation.yield(event)
    }
}

private func makeHapticsViewModel(status: String, historyMessages: [AnyCodable] = []) async -> (
    HapticsTestTransport,
    OperatorChatViewModel,
    HapticRecorder)
{
    let transport = HapticsTestTransport(status: status, historyMessages: historyMessages)
    let recorder = HapticRecorder()
    let haptics = OperatorChatHaptics(performer: recorder.record)
    let viewModel = await MainActor.run {
        OperatorChatViewModel(sessionKey: "main", transport: transport, haptics: haptics)
    }
    return (transport, viewModel, recorder)
}

private func sendHapticsTestMessage(_ viewModel: OperatorChatViewModel) async {
    await MainActor.run {
        viewModel.input = "hello"
        viewModel.send()
    }
}

struct ChatHapticsTests {
    @Test func `send acceptance fires message sent exactly once`() async throws {
        let (_, viewModel, recorder) = await makeHapticsViewModel(status: "started")
        await sendHapticsTestMessage(viewModel)
        try await waitUntil("message sent haptic") { recorder.events == [.messageSent] }
        try await Task.sleep(for: .milliseconds(20))
        #expect(recorder.events == [.messageSent])
    }

    @Test func `completion fires once for duplicate terminal events`() async throws {
        let (transport, viewModel, recorder) = await makeHapticsViewModel(status: "started")
        await sendHapticsTestMessage(viewModel)
        try await waitUntil("message accepted") { recorder.events == [.messageSent] }

        let final = OperatorChatTransportEvent.chat(OperatorChatEventPayload(
            runId: "run-1",
            sessionKey: "main",
            state: "final",
            message: nil,
            errorMessage: nil))
        transport.emit(final)
        transport.emit(final)
        try await waitUntil("completion haptic") {
            recorder.events == [.messageSent, .runCompleted]
        }
        try await Task.sleep(for: .milliseconds(20))
        #expect(recorder.events == [.messageSent, .runCompleted])
    }

    @Test(arguments: ["error", "aborted"])
    func `durable assistant failure fires run failed`(stopReason: String) async throws {
        let error = AnyCodable([
            "role": "assistant",
            "content": [],
            "timestamp": Date().timeIntervalSince1970 * 1000 + 1000,
            "stopReason": stopReason,
            "errorMessage": "provider failed",
        ] as [String: Any])
        let (_, viewModel, recorder) = await makeHapticsViewModel(
            status: "started",
            historyMessages: [error])
        await sendHapticsTestMessage(viewModel)
        try await waitUntil("run failed haptic") {
            recorder.events == [.messageSent, .runFailed]
        }
        #expect(recorder.events == [.messageSent, .runFailed])
    }
}
