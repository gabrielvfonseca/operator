import Foundation
import operatorProtocol

enum GatewayConnectPayload {
    static func makeClient(
        options: GatewayConnectOptions,
        displayName: String,
        platform: String) -> [String: operatorProtocol.AnyCodable]
    {
        var client: [String: operatorProtocol.AnyCodable] = [
            "id": operatorProtocol.AnyCodable(options.clientId),
            "displayName": operatorProtocol.AnyCodable(displayName),
            "version": operatorProtocol.AnyCodable(
                Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "dev"),
            "platform": operatorProtocol.AnyCodable(platform),
            "mode": operatorProtocol.AnyCodable(options.clientMode),
            "instanceId": operatorProtocol.AnyCodable(InstanceIdentity.instanceId),
            "deviceFamily": operatorProtocol.AnyCodable(InstanceIdentity.deviceFamily),
        ]
        if let model = InstanceIdentity.modelIdentifier {
            client["modelIdentifier"] = operatorProtocol.AnyCodable(model)
        }
        return client
    }
}
