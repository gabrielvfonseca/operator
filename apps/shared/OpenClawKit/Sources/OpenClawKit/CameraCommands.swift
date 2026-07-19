import Foundation

public enum OperatorCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum OperatorCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum OperatorCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum OperatorCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct OperatorCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: OperatorCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: OperatorCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: OperatorCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: OperatorCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct OperatorCameraClipParams: Codable, Sendable, Equatable {
    public var facing: OperatorCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: OperatorCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: OperatorCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: OperatorCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
