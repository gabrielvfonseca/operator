import CoreLocation
import Foundation
import OperatorKit
import UIKit

typealias OperatorCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias OperatorCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: OperatorCameraSnapParams) async throws -> OperatorCameraSnapResult
    func clip(params: OperatorCameraClipParams) async throws -> OperatorCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: OperatorLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: OperatorLocationGetParams,
        desiredAccuracy: OperatorLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func setBackgroundLocationUpdatesEnabled(_ enabled: Bool)
    func setAuthorizationChangeHandler(
        _ handler: @escaping @MainActor @Sendable (CLAuthorizationStatus) -> Void)
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> OperatorDeviceStatusPayload
    func info() -> OperatorDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: OperatorPhotosLatestParams) async throws -> OperatorPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: OperatorContactsSearchParams) async throws -> OperatorContactsSearchPayload
    func add(params: OperatorContactsAddParams) async throws -> OperatorContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: OperatorCalendarEventsParams) async throws -> OperatorCalendarEventsPayload
    func add(params: OperatorCalendarAddParams) async throws -> OperatorCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: OperatorRemindersListParams) async throws -> OperatorRemindersListPayload
    func add(params: OperatorRemindersAddParams) async throws -> OperatorRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: OperatorMotionActivityParams) async throws -> OperatorMotionActivityPayload
    func pedometer(params: OperatorPedometerParams) async throws -> OperatorPedometerPayload
}

struct WatchMessagingStatus: Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Codable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var gatewayStableID: String?
    var note: String?
    var sentAtMs: Int64?
    var transport: String
}

enum WatchMessageKind: String, Codable, Equatable {
    case chat
    case quickReply
}

struct WatchExecApprovalResolveEvent: Codable, Equatable {
    var replyId: String
    var approvalId: String
    var gatewayStableID: String?
    var decision: OperatorWatchExecApprovalDecision
    var sentAtMs: Int64?
    var transport: String
}

struct WatchExecApprovalSnapshotRequestItem: Equatable {
    var approvalId: String
    var activeResolutionAttemptId: String?
}

struct WatchExecApprovalSnapshotRequestEvent: Equatable {
    var requestId: String
    var gatewayStableID: String?
    var heldApprovals: [WatchExecApprovalSnapshotRequestItem]
    var sentAtMs: Int64?
    var transport: String

    init(
        requestId: String,
        gatewayStableID: String? = nil,
        heldApprovals: [WatchExecApprovalSnapshotRequestItem] = [],
        sentAtMs: Int64?,
        transport: String)
    {
        self.requestId = requestId
        self.gatewayStableID = gatewayStableID
        self.heldApprovals = heldApprovals
        self.sentAtMs = sentAtMs
        self.transport = transport
    }
}

struct WatchAppSnapshotRequestEvent: Equatable {
    var requestId: String
    var sentAtMs: Int64?
    var transport: String
}

struct WatchAppCommandEvent: Codable, Equatable {
    var commandId: String
    var command: OperatorWatchAppCommand
    var sessionKey: String?
    var gatewayStableID: String?
    var text: String?
    var sentAtMs: Int64?
    var transport: String
    var messageKind: WatchMessageKind?
}

struct WatchNotificationSendResult: Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setStatusHandler(_ handler: (@Sendable (WatchMessagingStatus) -> Void)?)
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func setExecApprovalResolveHandler(_ handler: (@Sendable (WatchExecApprovalResolveEvent) -> Void)?)
    func setExecApprovalSnapshotRequestHandler(
        _ handler: (@Sendable (WatchExecApprovalSnapshotRequestEvent) -> Void)?)
    func setAppSnapshotRequestHandler(_ handler: (@Sendable (WatchAppSnapshotRequestEvent) -> Void)?)
    func setAppCommandHandler(_ handler: (@Sendable (WatchAppCommandEvent) -> Void)?)
    func sendDirectNodeSetup(setupCode: String) async throws -> WatchNotificationSendResult
    func sendNotification(
        id: String,
        params: OperatorWatchNotifyParams,
        gatewayStableID: String?) async throws -> WatchNotificationSendResult
    func sendExecApprovalPrompt(
        _ message: OperatorWatchExecApprovalPromptMessage) async throws -> WatchNotificationSendResult
    func sendExecApprovalResolved(
        _ message: OperatorWatchExecApprovalResolvedMessage) async throws -> WatchNotificationSendResult
    func sendExecApprovalExpired(
        _ message: OperatorWatchExecApprovalExpiredMessage) async throws -> WatchNotificationSendResult
    func syncExecApprovalSnapshot(
        _ message: OperatorWatchExecApprovalSnapshotMessage) async throws -> WatchNotificationSendResult
    func syncAppSnapshot(
        _ message: OperatorWatchAppSnapshotMessage) async throws -> WatchNotificationSendResult
    func sendChatCompletion(
        _ message: OperatorWatchChatCompletionMessage) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
