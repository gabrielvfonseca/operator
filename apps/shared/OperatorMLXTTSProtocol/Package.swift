// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "operatorMLXTTSProtocol",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "operatorMLXTTSProtocol", targets: ["operatorMLXTTSProtocol"]),
    ],
    targets: [
        .target(name: "operatorMLXTTSProtocol"),
        .testTarget(
            name: "operatorMLXTTSProtocolTests",
            dependencies: ["operatorMLXTTSProtocol"]),
    ])
