import ActivityKit
import SwiftUI
import WidgetKit

struct operatorLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: operatorActivityAttributes.self) { context in
            self.lockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    self.statusDot(state: context.state)
                }
                DynamicIslandExpandedRegion(.center) {
                    self.statusText(state: context.state)
                        .font(operatorActivityType.subheadSemiBold)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    self.trailingView(state: context.state)
                }
            } compactLeading: {
                self.statusDot(state: context.state)
            } compactTrailing: {
                self.compactStatusIcon(state: context.state)
            } minimal: {
                self.statusDot(state: context.state)
            }
        }
    }

    private func lockScreenView(context: ActivityViewContext<operatorActivityAttributes>) -> some View {
        HStack(spacing: 10) {
            self.statusIcon(state: context.state)
                .frame(width: 30, height: 30)
                .background(.thinMaterial, in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text("operator")
                    .font(operatorActivityType.subheadBold)
                    .lineLimit(1)
                self.statusText(state: context.state)
                    .font(operatorActivityType.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            Spacer()
            self.trailingView(state: context.state)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private func trailingView(state: operatorActivityAttributes.ContentState) -> some View {
        self.statusIcon(state: state)
            .font(operatorActivityType.symbol(size: 16, weight: .semibold))
            .frame(width: 28, height: 28)
    }

    private func statusDot(state: operatorActivityAttributes.ContentState) -> some View {
        Circle()
            .fill(self.dotColor(state: state))
            .frame(width: 6, height: 6)
    }

    private func compactStatusIcon(state: operatorActivityAttributes.ContentState) -> some View {
        self.statusIcon(state: state)
            .font(operatorActivityType.symbol(size: 12, weight: .semibold))
            .frame(width: 18, height: 18)
    }

    @ViewBuilder
    private func statusIcon(state: operatorActivityAttributes.ContentState) -> some View {
        switch state.status {
        case .connecting, .reconnecting:
            Image(systemName: "arrow.triangle.2.circlepath")
                .foregroundStyle(operatorActivityStyle.info)
        case .disconnected:
            Image(systemName: "wifi.slash")
                .foregroundStyle(operatorActivityStyle.danger)
        case .idle:
            Image(systemName: "checkmark")
                .foregroundStyle(operatorActivityStyle.ok)
        case .approvalNeeded, .actionRequired, .attention:
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(operatorActivityStyle.warn)
        }
    }

    private func statusText(state: operatorActivityAttributes.ContentState) -> Text {
        if let detail = state.verbatimDetail {
            return Text(verbatim: detail)
        }
        return switch state.status {
        case .connecting: Text("Connecting...")
        case .reconnecting: Text("Reconnecting...")
        case .approvalNeeded: Text("Approval needed")
        case .actionRequired, .attention: Text("Action required")
        case .idle: Text("Connected")
        case .disconnected: Text("Disconnected")
        }
    }

    private func dotColor(state: operatorActivityAttributes.ContentState) -> Color {
        switch state.status {
        case .connecting, .reconnecting:
            operatorActivityStyle.info
        case .disconnected:
            operatorActivityStyle.danger
        case .idle:
            operatorActivityStyle.ok
        case .approvalNeeded, .actionRequired, .attention:
            operatorActivityStyle.warn
        }
    }
}

private enum operatorActivityStyle {
    static let info = Color(red: 0, green: 122 / 255.0, blue: 1)
    static let danger = Color(red: 185 / 255.0, green: 28 / 255.0, blue: 28 / 255.0)
    static let ok = Color(red: 34 / 255.0, green: 197 / 255.0, blue: 94 / 255.0)
    static let warn = Color(red: 245 / 255.0, green: 158 / 255.0, blue: 11 / 255.0)
}
