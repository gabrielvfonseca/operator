import SwiftUI

struct OperatorDocsScreen: View {
    private let docsURL = URL(string: "https://docs.operator.ai")!
    private let gatewayURL = URL(string: "https://docs.operator.ai/gateway")!
    private let pairingURL = URL(string: "https://docs.operator.ai/channels/pairing")!
    let headerLeadingAction: OperatorSidebarHeaderAction?
    let usesNativeNavigationChrome: Bool
    let gatewayAction: (() -> Void)?

    init(
        headerLeadingAction: OperatorSidebarHeaderAction? = nil,
        usesNativeNavigationChrome: Bool = false,
        gatewayAction: (() -> Void)? = nil)
    {
        self.headerLeadingAction = headerLeadingAction
        self.usesNativeNavigationChrome = usesNativeNavigationChrome
        self.gatewayAction = gatewayAction
    }

    var body: some View {
        ZStack {
            OperatorProBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if !self.usesNativeNavigationChrome {
                        self.headerCard
                    }
                    self.linkCard
                }
                .padding(.vertical, 18)
                .font(OperatorType.body)
            }
        }
        .navigationTitle("Docs")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(self.usesNativeNavigationChrome ? .visible : .hidden, for: .navigationBar)
        .toolbar {
            if self.usesNativeNavigationChrome, let gatewayAction {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: gatewayAction) {
                        Image(systemName: "antenna.radiowaves.left.and.right")
                            .font(OperatorType.subheadSemiBold)
                    }
                    .accessibilityLabel("Gateway settings")
                }
            }
        }
    }

    private var headerCard: some View {
        ProCard(radius: OperatorProMetric.cardRadius) {
            OperatorAdaptiveHeaderRow(
                title: "Docs",
                subtitle: "Gateway setup, pairing, channels, and mobile node reference.",
                titleFont: OperatorType.headline,
                subtitleFont: OperatorType.caption)
            {
                HStack(alignment: .top, spacing: 12) {
                    if let headerLeadingAction {
                        OperatorSidebarHeaderLeadingSlot(action: headerLeadingAction)
                    }
                    ProIconBadge(systemName: "book", color: OperatorBrand.accent)
                }
            } accessory: {
                self.gatewayPill
            }
        }
        .padding(.horizontal, OperatorProMetric.pagePadding)
    }

    @ViewBuilder
    private var gatewayPill: some View {
        if let gatewayAction {
            Button(action: gatewayAction) {
                OperatorGatewayCompactPill()
            }
            .buttonBorderShape(.capsule)
            .openClawGlassButton()
            .accessibilityHint("Opens Settings / Gateway")
        } else {
            OperatorGatewayCompactPill()
        }
    }

    private var linkCard: some View {
        ProCard(padding: 0, radius: OperatorProMetric.cardRadius) {
            VStack(spacing: 0) {
                self.docsLinkRow(
                    title: "Docs Home",
                    detail: "Browse the current Operator reference.",
                    icon: "book",
                    url: self.docsURL)
                Divider().padding(.leading, 58)
                self.docsLinkRow(
                    title: "Gateway",
                    detail: "Connection, auth, and diagnostics.",
                    icon: "network",
                    url: self.gatewayURL)
                Divider().padding(.leading, 58)
                self.docsLinkRow(
                    title: "Pairing",
                    detail: "Mobile setup codes, QR, and node approval.",
                    icon: "qrcode",
                    url: self.pairingURL)
            }
        }
        .padding(.horizontal, OperatorProMetric.pagePadding)
    }

    private func docsLinkRow(title: String, detail: String, icon: String, url: URL) -> some View {
        Link(destination: url) {
            HStack(spacing: 12) {
                ProIconBadge(systemName: icon, color: OperatorBrand.accent)
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(OperatorType.subheadSemiBold)
                    Text(detail)
                        .font(OperatorType.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                Image(systemName: "arrow.up.right")
                    .font(OperatorType.captionBold)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
