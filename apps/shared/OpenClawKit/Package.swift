// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "OperatorKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
        .watchOS(.v11),
    ],
    products: [
        .library(name: "OperatorProtocol", targets: ["OperatorProtocol"]),
        .library(name: "OperatorKit", targets: ["OperatorKit"]),
        .library(name: "OperatorChatUI", targets: ["OperatorChatUI"]),
    ],
    traits: [
        .trait(name: "Talk", description: "ElevenLabs cloud TTS / talk support"),
        .default(enabledTraits: ["Talk"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.1"),
        .package(url: "https://github.com/mgriebling/SwiftMath", exact: "1.7.3"),
        .package(url: "https://github.com/swiftlang/swift-markdown", exact: "0.8.0"),
    ],
    targets: [
        .target(
            name: "OperatorProtocol",
            path: "Sources/OperatorProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OperatorKit",
            dependencies: [
                "OperatorProtocol",
                .product(
                    name: "ElevenLabsKit",
                    package: "ElevenLabsKit",
                    condition: .when(platforms: [.iOS, .macOS], traits: ["Talk"])),
            ],
            path: "Sources/OperatorKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OperatorChatUI",
            dependencies: [
                "OperatorKit",
                "OperatorProtocol",
                .product(name: "Markdown", package: "swift-markdown"),
                .product(name: "SwiftMath", package: "SwiftMath"),
            ],
            path: "Sources/OperatorChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "OperatorKitTests",
            dependencies: ["OperatorKit", "OperatorChatUI", "OperatorProtocol"],
            path: "Tests/OperatorKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
