// swift-tools-version: 6.2
// Package manifest for the Operator macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "Operator",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "OperatorIPC", targets: ["OperatorIPC"]),
        .library(name: "OperatorDiscovery", targets: ["OperatorDiscovery"]),
        .executable(name: "Operator", targets: ["Operator"]),
        .executable(name: "operator-mac", targets: ["OperatorMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.3.0"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.4.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.12.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.9.0"),
        .package(url: "https://github.com/steipete/Peekaboo.git", exact: "3.9.3"),
        .package(url: "https://github.com/pointfreeco/swift-concurrency-extras", from: "1.3.1"),
        .package(path: "../shared/OperatorKit"),
        .package(path: "../shared/OperatorMLXTTSProtocol"),
        .package(path: "../swabble"),
    ],
    targets: [
        .target(
            name: "OperatorIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OperatorDiscovery",
            dependencies: [
                .product(name: "OperatorKit", package: "OperatorKit"),
            ],
            path: "Sources/OperatorDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "Operator",
            dependencies: [
                "OperatorIPC",
                "OperatorDiscovery",
                .product(name: "OperatorKit", package: "OperatorKit"),
                .product(name: "OperatorChatUI", package: "OperatorKit"),
                .product(name: "OperatorMLXTTSProtocol", package: "OperatorMLXTTSProtocol"),
                .product(name: "OperatorProtocol", package: "OperatorKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
                .product(name: "ConcurrencyExtras", package: "swift-concurrency-extras"),
            ],
            exclude: [
                "Resources/Info.plist",
                "Resources/Localizable.xcstrings",
            ],
            resources: [
                .copy("Resources/Operator.icns"),
                .copy("Resources/DeviceModels"),
                .copy("Resources/ProviderIcons"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "OperatorMacCLI",
            dependencies: [
                "OperatorDiscovery",
                .product(name: "OperatorKit", package: "OperatorKit"),
                .product(name: "OperatorProtocol", package: "OperatorKit"),
            ],
            path: "Sources/OperatorMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "OperatorIPCTests",
            dependencies: [
                "OperatorIPC",
                "Operator",
                "OperatorMacCLI",
                "OperatorDiscovery",
                .product(name: "OperatorChatUI", package: "OperatorKit"),
                .product(name: "OperatorKit", package: "OperatorKit"),
                .product(name: "OperatorMLXTTSProtocol", package: "OperatorMLXTTSProtocol"),
                .product(name: "OperatorProtocol", package: "OperatorKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
