import OperatorChatUI
import OperatorProtocol
import SwiftUI

struct ChatProTab: View {
    private struct TranscriptShareItem: Identifiable {
        let id = UUID()
        let fileURL: URL
    }

    @Environment(NodeAppModel.self) private var appModel
    @State private var viewModel: OperatorChatViewModel?
    @State private var viewModelOwnerID = ""
    @State private var transcriptShareItem: TranscriptShareItem?
    @State private var showsTranscriptExportError = false
    // Transport can start unscoped while the UI uses its "main" fallback.
    // Track the real agent so gateway metadata replaces the captured transport.
    @State private var viewModelTransportAgentID = ""
    @State private var viewModelRoutingContract = ""
    @State private var viewModelPresentationAgentID = "main"
    @State private var viewModelPresentationAgentName = "Main"
    @State private var viewModelPresentationAgentBadge = "M"
    @State private var viewModelHasVerifiedOfflineRoutingIdentity = false
    @State private var speech: OperatorChatSpeechController?
    let headerLeadingAction: OperatorSidebarHeaderAction?
    let headerTitle: String?
    let showsAgentBadge: Bool
    let ownsNavigationStack: Bool
    let openSettings: (() -> Void)?

    init(
        headerLeadingAction: OperatorSidebarHeaderAction? = nil,
        headerTitle: String? = nil,
        showsAgentBadge: Bool = true,
        ownsNavigationStack: Bool = true,
        openSettings: (() -> Void)? = nil)
    {
        self.headerLeadingAction = headerLeadingAction
        self.headerTitle = headerTitle
        self.showsAgentBadge = showsAgentBadge
        self.ownsNavigationStack = ownsNavigationStack
        self.openSettings = openSettings
    }

    var body: some View {
        Group {
            if self.ownsNavigationStack {
                NavigationStack {
                    self.content
                }
            } else {
                // Phone and iPad hosts already provide a NavigationStack. Keep
                // one native bar so embedded Chat never grows duplicate chrome.
                self.content
            }
        }
        .task {
            await self.appModel.restoreChatSessionRoutingIdentityIfNeeded()
            self.syncChatViewModel()
            if self.speech == nil {
                let gateway = self.appModel.operatorSession
                self.speech = OperatorChatSpeechController { text in
                    try await ChatMessageSpeechClient.synthesize(text: text, gateway: gateway)
                }
            }
        }
        .onChange(of: self.appModel.chatSessionKey) { _, _ in
            self.syncChatViewModel()
        }
        .onChange(of: self.appModel.chatViewModelOwnerID) { _, _ in
            self.syncChatViewModel()
        }
        .onChange(of: self.appModel.chatAgentId) { _, _ in
            self.syncChatViewModel()
        }
        .onChange(of: self.appModel.gatewayDefaultAgentId) { _, _ in
            self.syncChatViewModel()
        }
        .onChange(of: self.appModel.chatSessionRoutingContract) { _, _ in
            self.syncChatViewModel()
        }
        .onChange(of: self.appModel.voiceNoteRecorder.ownsPendingChatAttachment) { _, _ in
            self.viewModel?.attachmentOwnerActivityChanged()
            self.syncChatViewModel()
        }
        .onChange(of: self.viewModel?.isAttachmentOwnerPinned) { _, pinned in
            guard pinned == false else { return }
            self.syncChatViewModel()
        }
        .onChange(of: self.appModel.isAppleReviewDemoModeEnabled) { _, _ in
            self.syncChatViewModel()
            self.viewModel?.refresh()
        }
        .onChange(of: self.appModel.isScreenshotFixtureModeEnabled) { _, _ in
            self.syncChatViewModel()
            self.viewModel?.refresh()
        }
        .onChange(of: self.appModel.isOperatorGatewayConnected) { _, connected in
            guard connected else { return }
            self.syncChatViewModel()
            self.viewModel?.refresh()
        }
    }

    private var content: some View {
        self.chatSurface
            .background(Color(uiColor: .systemBackground))
            .navigationTitle(self.headerDisplayTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if let headerLeadingAction {
                    ToolbarItem(placement: .topBarLeading) {
                        OperatorSidebarRevealButton(action: headerLeadingAction)
                    }
                }
                if self.showsAgentBadge {
                    ToolbarItem(placement: .topBarLeading) {
                        self.headerIdentityBadge
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    self.chatActionsMenu
                }
                ToolbarItem(placement: .topBarTrailing) {
                    self.connectionStatusButton
                        .accessibilityIdentifier("chat-gateway-status")
                }
            }
            .sheet(item: self.$transcriptShareItem) { item in
                ChatTranscriptShareSheet(fileURL: item.fileURL)
            }
            .alert(
                String(localized: "Unable to Export Transcript"),
                isPresented: self.$showsTranscriptExportError)
            {
                Button(role: .cancel) {} label: {
                    Text("OK")
                        .font(OperatorType.body)
                }
            } message: {
                Text("Operator could not prepare the Markdown file.")
                    .font(OperatorType.body)
            }
    }

    @ViewBuilder
    private var chatSurface: some View {
        if let viewModel {
            OperatorChatView(
                viewModel: viewModel,
                drawsBackground: false,
                showsSessionSwitcher: false,
                userAccent: self.chatUserAccent,
                assistantName: self.agentDisplayName,
                assistantAvatarText: self.agentBadge,
                assistantAvatarTint: OperatorBrand.accent,
                showsAssistantAvatars: false,
                composerChrome: .clean,
                isComposerEnabled: self.gatewayConnected || self.canQueueOffline,
                isAttachmentInputEnabled: self.gatewayConnected || self.canQueueOffline,
                messagePlaceholder: self.messagePlaceholder,
                emptyAssistantIntro: String(localized: "What would you like to work on?"),
                emptyAssistantPrompts: Self.emptyAssistantPrompts,
                talkControl: viewModel.isAttachmentOwnerPinned ? nil : self.talkControl,
                voiceNoteControl: self.voiceNoteControl,
                speech: self.speech)
                // iMessage-style grey bubbles for agent replies in the clean chrome.
                    .environment(\.openClawAssistantBubblesInCleanChrome, true)
                    .id(ObjectIdentifier(viewModel))
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        } else {
            ContentUnavailableView(
                "Preparing Chat",
                systemImage: "bubble.left.and.bubble.right",
                description: Text("The session attaches once the gateway is ready.")
                    .font(OperatorType.body))
        }
    }

    /// Flat circular avatar for the nav bar — no gradient/shadow, per Apple bar-button sizing.
    private var headerIdentityBadge: some View {
        Text(self.agentBadge)
            .font(OperatorType.avatar(size: self.agentBadge.count > 2 ? 12 : 15))
            .foregroundStyle(.white)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
            .frame(width: 30, height: 30)
            .background(Circle().fill(OperatorBrand.accent))
            .accessibilityLabel(self.agentDisplayName)
    }

    private func syncChatViewModel() {
        let sessionKey = self.appModel.chatSessionKey
        // Includes the cache gateway identity so switching paired gateways
        // rebuilds the view model even while the transport mode stays the same.
        let ownerID = self.appModel.chatViewModelOwnerID
        let deliveryAgentID = self.appModel.chatDeliveryAgentId
        let transportAgentID = Self.transportAgentID(deliveryAgentID)
        let routingContract = self.appModel.chatSessionRoutingContract ?? ""
        guard let viewModel else {
            self.viewModelOwnerID = ownerID
            self.viewModelTransportAgentID = transportAgentID
            self.viewModelRoutingContract = routingContract
            self.captureCurrentPresentationIdentity()
            self.viewModel = self.makeChatViewModel(sessionKey: sessionKey)
            return
        }
        if Self.requiresViewModelRebuild(
            currentOwnerID: self.viewModelOwnerID,
            nextOwnerID: ownerID,
            currentTransportAgentID: self.viewModelTransportAgentID,
            nextTransportAgentID: transportAgentID)
        {
            // Keep recording, staging, and delivery on their captured route.
            // The pin-change observer replays this rebuild with latest state.
            guard !viewModel.isAttachmentOwnerPinned else { return }
            self.viewModelOwnerID = ownerID
            self.viewModelTransportAgentID = transportAgentID
            self.viewModelRoutingContract = routingContract
            self.captureCurrentPresentationIdentity()
            self.viewModel = self.makeChatViewModel(sessionKey: sessionKey)
            return
        }
        if self.viewModelRoutingContract != routingContract {
            self.viewModelRoutingContract = routingContract
            viewModel.syncSessionRoutingContract(self.appModel.chatSessionRoutingContract)
        }
        viewModel.syncSession(to: sessionKey)
        if !viewModel.isAttachmentOwnerPinned {
            self.captureCurrentPresentationIdentity()
        }
    }

    private func captureCurrentPresentationIdentity() {
        self.viewModelPresentationAgentID = self.currentAgentID
        self.viewModelPresentationAgentName = self.currentAgentDisplayName
        self.viewModelPresentationAgentBadge = self.currentAgentBadge
        self.viewModelHasVerifiedOfflineRoutingIdentity = self.appModel.hasVerifiedChatOfflineRoutingIdentity
    }

    private func makeChatViewModel(sessionKey: String) -> OperatorChatViewModel {
        // One store instance backs both seams so the transcript cache and the
        // offline outbox share a single SQLite connection.
        let offlineStore = self.appModel.makeChatOfflineStore()
        let voiceNoteRecorder = self.appModel.voiceNoteRecorder
        return OperatorChatViewModel(
            sessionKey: sessionKey,
            // Bind durable rows and their transport lease to the exact same
            // gateway owner even if app state switches between these calls.
            transport: self.appModel.makeChatTransport(outboxGatewayID: offlineStore?.gatewayID),
            activeAgentId: self.appModel.chatDeliveryAgentId,
            sessionRoutingContract: self.appModel.chatSessionRoutingContract,
            attachmentOwnerIsActive: { voiceNoteRecorder.ownsPendingChatAttachment },
            transcriptCache: offlineStore,
            outbox: offlineStore,
            onSessionChanged: { sessionKey in
                self.appModel.focusChatSession(sessionKey)
            },
            diagnosticsLog: { message in
                GatewayDiagnostics.log(message)
            })
    }

    private var talkControl: OperatorChatTalkControl {
        OperatorChatTalkControl(
            isEnabled: self.appModel.talkMode.isEnabled,
            isListening: self.appModel.talkMode.isListening,
            isSpeaking: self.appModel.talkMode.isSpeaking,
            isGatewayConnected: self.appModel.talkMode.isGatewayConnected,
            statusText: self.appModel.talkMode.statusText,
            providerLabel: self.appModel.talkMode.gatewayTalkProviderLabel,
            toggle: { sessionKey in
                self.appModel.focusChatSession(sessionKey)
                self.appModel.setTalkEnabled(!self.appModel.talkMode.isEnabled)
            })
    }

    private var voiceNoteControl: OperatorChatVoiceNoteControl {
        OperatorChatVoiceNoteControl(
            recorder: self.appModel.voiceNoteRecorder,
            isTalkActive: self.appModel.isTalkCaptureActive)
    }

    @ViewBuilder
    private var connectionStatusButton: some View {
        if let openSettings {
            Button(action: openSettings) {
                self.connectionPill
            }
            .buttonStyle(.plain)
            .accessibilityLabel(self.gatewayAccessibilityLabel)
            .accessibilityHint("Opens Settings / Gateway")
        } else {
            self.connectionPill
                .accessibilityLabel(self.gatewayAccessibilityLabel)
        }
    }

    private var connectionPill: some View {
        HStack(spacing: 5) {
            ProStatusDot(color: self.gatewayPillColor)
            Text(Self.gatewayPillTitle(state: self.gatewayDisplayState, isGatewayUsable: self.gatewayConnected))
                .font(OperatorType.subheadMedium)
                .lineLimit(1)
        }
        .foregroundStyle(self.gatewayPillColor)
        // Even breathing room inside the system glass capsule.
        .padding(.horizontal, 6)
    }

    private var chatActionsMenu: some View {
        Menu {
            Button {
                Task { await self.viewModel?.startNewSession() }
            } label: {
                Label {
                    Text("New Chat")
                        .font(OperatorType.body)
                } icon: {
                    Image(systemName: "plus.bubble")
                }
            }
            .disabled(self.viewModel == nil || !self.gatewayConnected || self.isAttachmentOwnerPinned)

            if self.activeAgent?.workspacegit == true {
                Button {
                    Task { await self.viewModel?.startNewSession(worktree: true) }
                } label: {
                    Label {
                        Text("New Chat in Worktree")
                            .font(OperatorType.body)
                    } icon: {
                        Image(systemName: "arrow.triangle.branch")
                    }
                }
                .disabled(self.viewModel == nil || !self.gatewayConnected || self.isAttachmentOwnerPinned)
            }

            Divider()

            Button {
                self.exportTranscript()
            } label: {
                Label {
                    Text("Export Transcript")
                        .font(OperatorType.body)
                } icon: {
                    Image(systemName: "square.and.arrow.up")
                }
            }
            .disabled(self.viewModel == nil)
        } label: {
            Image(systemName: "ellipsis.circle")
        }
        .accessibilityLabel("Chat actions")
    }

    private func exportTranscript() {
        guard let viewModel else { return }
        let title = viewModel.sessions.first { $0.key == viewModel.sessionKey }?.displayName
        let filename = ChatTranscriptExporter.filename(
            sessionTitle: title,
            sessionKey: viewModel.sessionKey)
        let directory = FileManager.default.temporaryDirectory
            .appendingPathComponent("OperatorTranscripts", isDirectory: true)
        let fileURL = directory.appendingPathComponent(filename, isDirectory: false)

        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            try viewModel.exportTranscriptMarkdown().write(to: fileURL, atomically: true, encoding: .utf8)
            self.transcriptShareItem = TranscriptShareItem(fileURL: fileURL)
        } catch {
            self.showsTranscriptExportError = true
        }
    }

    private var gatewayConnected: Bool {
        guard self.gatewayDisplayState == .connected else {
            return false
        }
        return self.appModel.isLocalChatFixtureEnabled || self.appModel.isOperatorGatewayConnected
    }

    private var gatewayDisplayState: GatewayDisplayState {
        Self.presentationGatewayState(
            current: GatewayStatusBuilder.build(appModel: self.appModel),
            isAttachmentOwnerPinned: self.isAttachmentOwnerPinned,
            capturedOwnerID: self.viewModelOwnerID,
            currentOwnerID: self.appModel.chatViewModelOwnerID)
    }

    nonisolated static func presentationGatewayState(
        current: GatewayDisplayState,
        isAttachmentOwnerPinned: Bool,
        capturedOwnerID: String,
        currentOwnerID: String) -> GatewayDisplayState
    {
        if isAttachmentOwnerPinned, capturedOwnerID != currentOwnerID {
            return .disconnected
        }
        return current
    }

    private var gatewayAccessibilityLabel: String {
        "Gateway: \(Self.gatewayPillTitle(state: self.gatewayDisplayState, isGatewayUsable: self.gatewayConnected))"
    }

    private var gatewayPillColor: Color {
        switch self.gatewayDisplayState {
        case .connected:
            self.gatewayConnected ? OperatorBrand.ok : .secondary
        case .connecting:
            OperatorBrand.accent
        case .error:
            OperatorBrand.warn
        case .disconnected:
            .secondary
        }
    }

    nonisolated static func gatewayPillTitle(state: GatewayDisplayState, isGatewayUsable: Bool) -> String {
        switch state {
        case .connected:
            isGatewayUsable ? "Connected" : "Unavailable"
        case .connecting:
            "Connecting"
        case .error:
            "Attention"
        case .disconnected:
            "Offline"
        }
    }

    private var messagePlaceholder: String {
        if self.gatewayConnected {
            return String(
                format: String(localized: "Message %@..."),
                self.agentDisplayName)
        }
        if self.canQueueOffline {
            return String(
                format: String(localized: "Message %@; sends when connected"),
                self.agentDisplayName)
        }
        return String(localized: "Connect to a gateway")
    }

    private var canQueueOffline: Bool {
        self.viewModel?.supportsOfflineTextOutbox == true &&
            (self.isAttachmentOwnerPinned
                ? self.viewModelHasVerifiedOfflineRoutingIdentity
                : self.appModel.hasVerifiedChatOfflineRoutingIdentity)
    }

    private var headerDisplayTitle: String {
        self.normalized(self.headerTitle)
            ?? Self.defaultHeaderTitle(showsAgentBadge: self.showsAgentBadge, agentDisplayName: self.agentDisplayName)
    }

    nonisolated static func defaultHeaderTitle(showsAgentBadge: Bool, agentDisplayName: String) -> String {
        showsAgentBadge ? agentDisplayName : "Chat"
    }

    private var chatUserAccent: Color {
        OperatorBrand.accent
    }

    private var isAttachmentOwnerPinned: Bool {
        self.viewModel?.isAttachmentOwnerPinned == true
    }

    private var currentAgentID: String {
        self.normalized(self.appModel.chatAgentId) ?? "main"
    }

    private var currentActiveAgent: AgentSummary? {
        self.appModel.gatewayAgents.first { $0.id == self.currentAgentID }
    }

    private var activeAgentID: String {
        self.isAttachmentOwnerPinned ? self.viewModelPresentationAgentID : self.currentAgentID
    }

    private var activeAgent: AgentSummary? {
        self.appModel.gatewayAgents.first { $0.id == self.activeAgentID }
    }

    private var currentAgentDisplayName: String {
        self.normalized(self.currentActiveAgent?.name) ?? self.appModel.chatAgentName
    }

    private var agentDisplayName: String {
        self.isAttachmentOwnerPinned ? self.viewModelPresentationAgentName : self.currentAgentDisplayName
    }

    private var currentAgentBadge: String {
        if let identity = self.currentActiveAgent?.identity,
           let emoji = identity["emoji"]?.value as? String,
           let normalizedEmoji = Self.normalizedBadgeEmoji(emoji)
        {
            return normalizedEmoji
        }
        return Self.initialsBadge(for: self.currentAgentDisplayName)
    }

    private var agentBadge: String {
        self.isAttachmentOwnerPinned ? self.viewModelPresentationAgentBadge : self.currentAgentBadge
    }

    nonisolated static func initialsBadge(for displayName: String) -> String {
        let words = displayName
            .split(whereSeparator: { $0.isWhitespace || $0 == "-" || $0 == "_" })
            .prefix(2)
        let initials = words.compactMap(\.first).map(String.init).joined()
        if !initials.isEmpty {
            return initials.uppercased()
        }
        return "OC"
    }

    nonisolated static func normalizedBadgeEmoji(_ value: String?) -> String? {
        guard let value else { return nil }
        let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return normalized.isEmpty || normalized == "?" ? nil : normalized
    }

    nonisolated static func transportAgentID(_ value: String?) -> String {
        value?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() ?? ""
    }

    nonisolated static func requiresViewModelRebuild(
        currentOwnerID: String,
        nextOwnerID: String,
        currentTransportAgentID: String,
        nextTransportAgentID: String) -> Bool
    {
        currentOwnerID != nextOwnerID || currentTransportAgentID != nextTransportAgentID
    }

    nonisolated static let emptyAssistantPrompts: [OperatorChatView.StarterPrompt] = [
        OperatorChatView.StarterPrompt(
            id: "summarize-status",
            title: String(localized: "Check Operator status"),
            prompt: String(localized: "Summarize the current Operator status and tell me what needs attention.")),
        OperatorChatView.StarterPrompt(
            id: "show-controls",
            title: String(localized: "What can I control here?"),
            prompt: String(localized: "Show me which phone controls and device capabilities are available right now.")),
        OperatorChatView.StarterPrompt(
            id: "start-voice",
            title: String(localized: "Help me start voice chat"),
            prompt: String(localized: "Help me start a realtime voice session from this phone.")),
    ]

    private func normalized(_ value: String?) -> String? {
        guard let value else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
