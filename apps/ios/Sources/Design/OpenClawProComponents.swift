import OperatorChatUI
import SwiftUI

enum OperatorProMetric {
    static let pagePadding: CGFloat = 16
    static let cardRadius: CGFloat = 16
    static let controlRadius: CGFloat = 12
    static let compactControlSize: CGFloat = 36
    static let bottomScrollInset: CGFloat = 96
}

enum OperatorSpacing {
    static let space1: CGFloat = 4
    static let space2: CGFloat = 8
    static let space3: CGFloat = 12
    static let space4: CGFloat = 16
    static let space6: CGFloat = 24
}

enum OperatorRadius {
    static let xs: CGFloat = 8
    static let sm: CGFloat = 10
    static let md: CGFloat = 12
}

enum OperatorTextValue: ExpressibleByStringLiteral {
    case localized(LocalizedStringKey)
    case verbatim(String)

    init(stringLiteral value: String) {
        self = .localized(LocalizedStringKey(value))
    }

    static func localized(_ value: String) -> Self {
        .localized(LocalizedStringKey(value))
    }

    var text: Text {
        switch self {
        case let .localized(key):
            Text(key)
        case let .verbatim(value):
            Text(verbatim: value)
        }
    }
}

struct OperatorProBackground: View {
    var body: some View {
        Color(uiColor: .systemGroupedBackground)
            .ignoresSafeArea()
    }
}

struct ProSectionHeader: View {
    let title: OperatorTextValue
    var actionTitle: OperatorTextValue?
    var action: (() -> Void)?
    var uppercase = true

    var body: some View {
        HStack {
            self.title.text
                .font(OperatorType.footnoteMedium)
                .foregroundStyle(.secondary)
                .textCase(self.uppercase ? .uppercase : nil)
            Spacer()
            if let actionTitle {
                if let action {
                    Button(action: action) {
                        actionTitle.text
                            .font(OperatorType.footnoteMedium)
                    }
                    .foregroundStyle(OperatorBrand.accent)
                } else {
                    actionTitle.text
                        .font(OperatorType.footnoteMedium)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.horizontal, OperatorProMetric.pagePadding)
    }
}

struct ProCard<Content: View>: View {
    var tint: Color?
    var isProminent: Bool = false
    var padding: CGFloat = 12
    var radius: CGFloat = OperatorProMetric.cardRadius
    @ViewBuilder var content: Content

    var body: some View {
        self.content
            .padding(self.padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .proPanelSurface(
                tint: self.tint,
                radius: self.radius,
                isProminent: self.isProminent)
    }
}

private struct ProPanelBackground: View {
    @Environment(\.colorScheme) private var colorScheme
    let radius: CGFloat
    let tint: Color?
    let isProminent: Bool

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        shape
            .fill(self.fill)
            .overlay {
                shape.strokeBorder(self.borderStyle, lineWidth: 1)
            }
    }

    private var fill: AnyShapeStyle {
        let color = self.isProminent ? UIColor.systemBackground : UIColor.secondarySystemGroupedBackground
        return AnyShapeStyle(Color(uiColor: color))
    }

    private var borderStyle: AnyShapeStyle {
        if let tint {
            return AnyShapeStyle(tint.opacity(self.isProminent ? 0.18 : 0.10))
        }
        return AnyShapeStyle(Color(uiColor: .separator).opacity(self.colorScheme == .dark ? 0.22 : 0.12))
    }
}

private struct ProInsetSurfaceModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    let tint: Color
    let radius: CGFloat

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        content.background {
            shape
                .fill(Color(uiColor: .tertiarySystemGroupedBackground))
                .overlay {
                    shape.strokeBorder(
                        self.tint.opacity(self.colorScheme == .dark ? 0.18 : 0.10),
                        lineWidth: 1)
                }
        }
    }
}

private struct OperatorGlassButtonModifier: ViewModifier {
    let prominent: Bool
    let tint: Color?

    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            if self.prominent {
                content
                    .font(OperatorType.subheadSemiBold)
                    .buttonStyle(.glassProminent)
                    .tint(self.tint ?? OperatorBrand.accent)
            } else {
                content
                    .font(OperatorType.subheadSemiBold)
                    .buttonStyle(.glass)
                    .tint(self.tint)
            }
        } else if self.prominent {
            content
                .font(OperatorType.subheadSemiBold)
                .buttonStyle(.borderedProminent)
                .tint(self.tint ?? OperatorBrand.accent)
        } else {
            content
                .font(OperatorType.subheadSemiBold)
                .buttonStyle(.bordered)
                .tint(self.tint)
        }
    }
}

private struct OperatorTabBarBehaviorModifier: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content.tabBarMinimizeBehavior(.onScrollDown)
        } else {
            content
        }
    }
}

private struct OperatorGlassSurfaceModifier: ViewModifier {
    let radius: CGFloat

    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content.glassEffect(.regular, in: .rect(cornerRadius: self.radius))
        } else {
            content.background(
                .regularMaterial,
                in: RoundedRectangle(cornerRadius: self.radius, style: .continuous))
        }
    }
}

extension View {
    func proPanelSurface(
        tint: Color? = nil,
        radius: CGFloat = OperatorProMetric.cardRadius,
        isProminent: Bool = false) -> some View
    {
        modifier(ProPanelSurfaceModifier(
            tint: tint,
            radius: radius,
            isProminent: isProminent))
    }

    func proInsetSurface(tint: Color, radius: CGFloat) -> some View {
        modifier(ProInsetSurfaceModifier(tint: tint, radius: radius))
    }

    func openClawGlassButton(prominent: Bool = false, tint: Color? = nil) -> some View {
        modifier(OperatorGlassButtonModifier(prominent: prominent, tint: tint))
    }

    func openClawTabBarBehavior() -> some View {
        modifier(OperatorTabBarBehaviorModifier())
    }

    func openClawGlassSurface(radius: CGFloat = OperatorProMetric.controlRadius) -> some View {
        modifier(OperatorGlassSurfaceModifier(radius: radius))
    }
}

private struct ProPanelSurfaceModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    let tint: Color?
    let radius: CGFloat
    let isProminent: Bool

    func body(content: Content) -> some View {
        content
            .background {
                ProPanelBackground(
                    radius: self.radius,
                    tint: self.tint,
                    isProminent: self.isProminent)
            }
            .shadow(
                color: self.isProminent
                    ? (self.colorScheme == .dark ? .black.opacity(0.14) : .black.opacity(0.045))
                    : .clear,
                radius: self.isProminent ? 5 : 0,
                y: self.isProminent ? 2 : 0)
    }
}

struct ProIconBadge: View {
    let systemName: String
    let color: Color

    var body: some View {
        Image(systemName: self.systemName)
            .font(OperatorType.captionSemiBold)
            .foregroundStyle(self.color)
            .frame(width: 30, height: 30)
            .background {
                RoundedRectangle(cornerRadius: OperatorRadius.xs, style: .continuous)
                    .fill(self.color.opacity(0.12))
            }
    }
}

struct OperatorSidebarHeaderAction {
    let systemName: String
    let accessibilityLabel: OperatorTextValue
    let accessibilityIdentifier: String?
    let action: () -> Void

    init(
        systemName: String,
        accessibilityLabel: OperatorTextValue,
        accessibilityIdentifier: String? = nil,
        action: @escaping () -> Void)
    {
        self.systemName = systemName
        self.accessibilityLabel = accessibilityLabel
        self.accessibilityIdentifier = accessibilityIdentifier
        self.action = action
    }
}

struct OperatorSidebarRevealButton: View {
    let headerAction: OperatorSidebarHeaderAction

    init(action: OperatorSidebarHeaderAction) {
        self.headerAction = action
    }

    var body: some View {
        let button = Button(action: headerAction.action) {
            Image(systemName: self.headerAction.systemName)
                .font(OperatorType.subheadSemiBold)
                .frame(
                    width: OperatorProMetric.compactControlSize,
                    height: OperatorProMetric.compactControlSize)
                .contentShape(Rectangle())
        }
        .buttonBorderShape(.circle)
        .openClawGlassButton(tint: OperatorBrand.accent)
        .accessibilityLabel(self.headerAction.accessibilityLabel.text)

        if let accessibilityIdentifier = headerAction.accessibilityIdentifier {
            button.accessibilityIdentifier(accessibilityIdentifier)
        } else {
            button
        }
    }
}

struct OperatorSidebarHeaderLeadingSlot: View {
    let action: OperatorSidebarHeaderAction

    var body: some View {
        OperatorSidebarRevealButton(action: self.action)
            .frame(width: 44, height: 44, alignment: .center)
    }
}

struct OperatorGlassControlGroup<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        if #available(iOS 26.0, *) {
            GlassEffectContainer(spacing: 8) {
                self.content
            }
        } else {
            self.content
        }
    }
}

enum OperatorNoticeDetail {
    case accent(String)
    case requestID(String)
}

struct OperatorNoticeBanner: View {
    let icon: String
    let title: OperatorTextValue
    let message: OperatorTextValue
    let ownerLabel: OperatorTextValue
    let tint: Color
    var detail: OperatorNoticeDetail?
    var primaryActionTitle: OperatorTextValue?
    var onPrimaryAction: (() -> Void)?
    var secondaryActionTitle: OperatorTextValue?
    var onSecondaryAction: (() -> Void)?

    var body: some View {
        ProCard(tint: self.tint, padding: 14) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    ProIconBadge(systemName: self.icon, color: self.tint)

                    VStack(alignment: .leading, spacing: 6) {
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            self.title.text
                                .font(OperatorType.subheadSemiBold)
                                .multilineTextAlignment(.leading)
                            Spacer(minLength: 0)
                            self.ownerLabel.text
                                .font(OperatorType.captionSemiBold)
                                .foregroundStyle(.secondary)
                        }

                        self.message.text
                            .font(OperatorType.footnote)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)

                        self.detailView
                    }
                }

                if self.onPrimaryAction != nil || self.onSecondaryAction != nil {
                    OperatorGlassControlGroup {
                        HStack(spacing: 10) {
                            if let primaryActionTitle, let onPrimaryAction {
                                Button(action: onPrimaryAction) {
                                    primaryActionTitle.text
                                        .font(OperatorType.captionSemiBold)
                                }
                                .font(OperatorType.captionSemiBold)
                                .openClawGlassButton(prominent: true)
                                .controlSize(.small)
                            }
                            if let secondaryActionTitle, let onSecondaryAction {
                                Button(action: onSecondaryAction) {
                                    secondaryActionTitle.text
                                        .font(OperatorType.captionSemiBold)
                                }
                                .font(OperatorType.captionSemiBold)
                                .openClawGlassButton()
                                .controlSize(.small)
                            }
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var detailView: some View {
        if let detail {
            switch detail {
            case let .accent(value):
                Text(value)
                    .font(OperatorType.captionMedium)
                    .foregroundStyle(self.tint)
                    .fixedSize(horizontal: false, vertical: true)
            case let .requestID(value):
                Text(verbatim: String(
                    format: String(localized: "Request ID: %@"),
                    value))
                    .font(OperatorType.monoSmallMedium)
                    .foregroundStyle(.secondary)
                    .textSelection(.enabled)
            }
        }
    }
}

struct OperatorAdaptiveHeaderRow<Leading: View, Accessory: View>: View {
    let title: OperatorTextValue
    let subtitle: OperatorTextValue?
    var titleFont: Font = OperatorType.title3SemiBold
    var subtitleFont: Font = OperatorType.subhead
    var subtitleLineLimit: Int? = 2
    @ViewBuilder let leading: Leading
    @ViewBuilder let accessory: Accessory

    init(
        title: OperatorTextValue,
        subtitle: OperatorTextValue? = nil,
        titleFont: Font = OperatorType.title3SemiBold,
        subtitleFont: Font = OperatorType.subhead,
        subtitleLineLimit: Int? = 2,
        @ViewBuilder leading: () -> Leading,
        @ViewBuilder accessory: () -> Accessory)
    {
        self.title = title
        self.subtitle = subtitle
        self.titleFont = titleFont
        self.subtitleFont = subtitleFont
        self.subtitleLineLimit = subtitleLineLimit
        self.leading = leading()
        self.accessory = accessory()
    }

    var body: some View {
        ViewThatFits(in: .horizontal) {
            self.horizontalLayout
            self.stackedLayout
        }
    }

    private var horizontalLayout: some View {
        HStack(alignment: .top, spacing: 12) {
            self.leading

            self.titleBlock
                .layoutPriority(1)

            Spacer(minLength: 8)

            self.accessory
                .fixedSize(horizontal: true, vertical: false)
        }
    }

    private var stackedLayout: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                self.leading

                self.titleBlock
                    .layoutPriority(1)

                Spacer(minLength: 8)
            }

            HStack {
                Spacer(minLength: 0)
                self.accessory
                    .fixedSize(horizontal: true, vertical: false)
            }
        }
    }

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: 4) {
            self.title.text
                .font(self.titleFont)
                .lineLimit(2)
                .minimumScaleFactor(0.86)
                .fixedSize(horizontal: false, vertical: true)
            if let subtitle {
                subtitle.text
                    .font(self.subtitleFont)
                    .foregroundStyle(.secondary)
                    .lineLimit(self.subtitleLineLimit)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

/// Shared switch indicator replacing the 3 duplicated capsule toggles.
/// Native Toggle only hits the switch edge on iOS 26; this full-width button approach
/// gives the whole row a tap target.
struct OperatorToggleIndicator: View {
    let isOn: Bool

    var body: some View {
        Capsule()
            .fill(self.isOn ? OperatorBrand.accent : Color.secondary.opacity(0.35))
            .frame(width: 52, height: 32)
            .overlay(alignment: self.isOn ? .trailing : .leading) {
                Circle()
                    .fill(Color.white)
                    .frame(width: 28, height: 28)
                    .padding(2)
                    .shadow(color: Color.black.opacity(0.14), radius: 1, x: 0, y: 1)
            }
    }
}

enum OperatorStatusTone {
    case ok
    case warn
    case danger
    case info
    case accent
    case teal
    case muted

    var color: Color {
        switch self {
        case .ok: OperatorBrand.ok
        case .warn: OperatorBrand.warn
        case .danger: OperatorBrand.danger
        case .info: OperatorBrand.info
        case .accent: OperatorBrand.accent
        case .teal: OperatorBrand.teal
        case .muted: OperatorBrand.textSecondary
        }
    }
}

struct OperatorStatusBadge: View {
    @Environment(\.colorScheme) private var colorScheme
    let label: OperatorTextValue
    let tone: OperatorStatusTone

    var body: some View {
        HStack(spacing: OperatorSpacing.space1 + 2) {
            Circle()
                .fill(self.tone.color)
                .frame(width: 7, height: 7)
                .shadow(color: self.tone.color.opacity(0.55), radius: 3)
            self.label.text
                .font(OperatorType.caption2SemiBold)
                .foregroundStyle(self.tone.color)
        }
        .padding(.horizontal, OperatorSpacing.space2)
        .padding(.vertical, 5)
        .background {
            Capsule()
                .fill(self.tone.color.opacity(self.colorScheme == .dark ? 0.14 : 0.10))
        }
    }
}

struct ProStatusDot: View {
    var color: Color

    var body: some View {
        Circle()
            .fill(self.color)
            .frame(width: 8, height: 8)
    }
}

struct ProValuePill: View {
    @Environment(\.colorScheme) private var colorScheme
    let value: String
    let color: Color

    var body: some View {
        Text(self.value)
            .font(OperatorType.footnoteSemiBold)
            .foregroundStyle(self.color)
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background {
                Capsule()
                    .fill(self.color.opacity(self.colorScheme == .dark ? 0.12 : 0.08))
            }
    }
}

struct OperatorProMark: View {
    var size: CGFloat = 42
    var shadowRadius: CGFloat = 10
    /// Opt-in tap Easter eggs; leave off when the mark sits inside a control.
    var interactive = false

    var body: some View {
        OperatorMascotView(interactive: self.interactive)
            .frame(width: self.size, height: self.size)
            .shadow(color: OperatorBrand.accent.opacity(0.18), radius: self.shadowRadius, y: self.shadowRadius / 3)
            .accessibilityLabel("Operator")
    }
}

struct ProProgressBar: View {
    let progress: Double
    var color: Color = OperatorBrand.accentHot

    var body: some View {
        GeometryReader { proxy in
            let clamped = max(0, min(self.progress, 1))
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.primary.opacity(0.10))
                Capsule()
                    .fill(self.color)
                    .frame(width: proxy.size.width * clamped)
            }
        }
        .frame(height: 3)
    }
}

struct OperatorGatewayCompactPill: View {
    @Environment(NodeAppModel.self) private var appModel

    var body: some View {
        OperatorStatusBadge(label: .verbatim(self.title), tone: self.tone)
            .accessibilityLabel(
                String(
                    format: String(localized: "Gateway %@"),
                    self.title))
    }

    private var title: String {
        switch GatewayStatusBuilder.build(appModel: self.appModel) {
        case .connected:
            String(localized: "Online")
        case .connecting:
            String(localized: "Connecting")
        case .error:
            String(localized: "Attention")
        case .disconnected:
            String(localized: "Offline")
        }
    }

    private var tone: OperatorStatusTone {
        switch GatewayStatusBuilder.build(appModel: self.appModel) {
        case .connected:
            .ok
        case .connecting:
            .accent
        case .error:
            .warn
        case .disconnected:
            .muted
        }
    }
}

struct ProMetricTile: View {
    @Environment(\.colorScheme) private var colorScheme
    let title: OperatorTextValue
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: self.icon)
                    .font(OperatorType.captionSemiBold)
                    .foregroundStyle(self.color)
                    .frame(width: 24, height: 24)
                    .background(self.color.opacity(self.colorScheme == .dark ? 0.18 : 0.10), in: Circle())
                Spacer(minLength: 4)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(self.value)
                    .font(OperatorType.headlineBold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                self.title.text
                    .font(OperatorType.caption2Medium)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .proInsetSurface(tint: self.color, radius: OperatorProMetric.controlRadius)
    }
}

struct ProMetric: Identifiable {
    let id = UUID()
    let icon: String
    let title: OperatorTextValue
    let value: String
    let color: Color
}

struct ProMetricGrid: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    let metrics: [ProMetric]

    var body: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible()), count: self.columnCount),
            spacing: 10)
        {
            ForEach(self.metrics) { metric in
                ProMetricTile(
                    title: metric.title,
                    value: metric.value,
                    icon: metric.icon,
                    color: metric.color)
            }
        }
        .padding(.horizontal, OperatorProMetric.pagePadding)
    }

    private var columnCount: Int {
        guard self.horizontalSizeClass != .compact else { return 1 }
        return min(max(self.metrics.count, 1), 3)
    }
}

struct ProPanelHeader: View {
    let title: OperatorTextValue
    var value: String?
    var actionTitle: OperatorTextValue?
    var actionIcon: String?
    var actionAccessibilityLabel: String?
    var isActionDisabled = false
    var action: (() -> Void)?

    var body: some View {
        HStack(spacing: 8) {
            self.title.text
                .font(OperatorType.subheadSemiBold)
            if let value {
                Text(value)
                    .font(OperatorType.caption2Bold)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 8)
            self.actionControl
        }
        .padding(.horizontal, 14)
        .padding(.top, 12)
        .padding(.bottom, 8)
    }

    @ViewBuilder
    private var actionControl: some View {
        if let action {
            if let actionIcon {
                Button(action: action) {
                    Image(systemName: actionIcon)
                }
                .accessibilityLabel(
                    self.actionAccessibilityLabel.map { Text(LocalizedStringKey($0)) }
                        ?? actionTitle?.text
                        ?? self.title.text)
                .disabled(self.isActionDisabled)
            } else if let actionTitle {
                Button(action: action) {
                    actionTitle.text
                        .font(OperatorType.captionSemiBold)
                }
                .disabled(self.isActionDisabled)
            }
        }
    }
}

struct ProStatusRow: View {
    let icon: String
    let title: OperatorTextValue
    let detail: OperatorTextValue
    let value: String?
    let color: Color
    var actionTitle: OperatorTextValue?
    var action: (() -> Void)?

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ProIconBadge(systemName: self.icon, color: self.color)
            VStack(alignment: .leading, spacing: 4) {
                self.title.text
                    .font(OperatorType.subheadSemiBold)
                    .lineLimit(1)
                self.detail.text
                    .font(OperatorType.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 6) {
                if let value {
                    ProValuePill(value: value, color: self.color)
                }
                if let actionTitle, let action {
                    Button(action: action) {
                        actionTitle.text
                            .font(OperatorType.captionSemiBold)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.mini)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }
}
