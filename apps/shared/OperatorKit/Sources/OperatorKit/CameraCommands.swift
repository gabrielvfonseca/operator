import Foundation

public enum operatorCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum operatorCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum operatorCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum operatorCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct operatorCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: operatorCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: operatorCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: operatorCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: operatorCameraImageFormat? = nil,
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

public struct operatorCameraClipParams: Codable, Sendable, Equatable {
    public var facing: operatorCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: operatorCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: operatorCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: operatorCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
