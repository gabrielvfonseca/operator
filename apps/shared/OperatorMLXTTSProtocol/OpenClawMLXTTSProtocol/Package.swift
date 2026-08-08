// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "OperatorMLXTTSProtocol",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "OperatorMLXTTSProtocol", targets: ["OperatorMLXTTSProtocol"]),
    ],
    targets: [
        .target(name: "OperatorMLXTTSProtocol"),
        .testTarget(
            name: "OperatorMLXTTSProtocolTests",
            dependencies: ["OperatorMLXTTSProtocol"]),
    ])
