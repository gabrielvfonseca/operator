import Foundation

public enum operatorDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum operatorBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum operatorThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum operatorNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum operatorNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct operatorBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: operatorBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: operatorBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct operatorThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: operatorThermalState

    public init(state: operatorThermalState) {
        self.state = state
    }
}

public struct operatorStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct operatorNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: operatorNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [operatorNetworkInterfaceType]

    public init(
        status: operatorNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [operatorNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct operatorDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: operatorBatteryStatusPayload
    public var thermal: operatorThermalStatusPayload
    public var storage: operatorStorageStatusPayload
    public var network: operatorNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: operatorBatteryStatusPayload,
        thermal: operatorThermalStatusPayload,
        storage: operatorStorageStatusPayload,
        network: operatorNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct operatorDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
