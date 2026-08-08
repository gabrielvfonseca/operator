import Foundation
import OperatorProtocol

enum GatewayConnectPayload {
    static func makeClient(
        options: GatewayConnectOptions,
        displayName: String,
        platform: String) -> [String: OperatorProtocol.AnyCodable]
    {
        var client: [String: OperatorProtocol.AnyCodable] = [
            "id": OperatorProtocol.AnyCodable(options.clientId),
            "displayName": OperatorProtocol.AnyCodable(displayName),
            "version": OperatorProtocol.AnyCodable(
                Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "dev"),
            "platform": OperatorProtocol.AnyCodable(platform),
            "mode": OperatorProtocol.AnyCodable(options.clientMode),
            "instanceId": OperatorProtocol.AnyCodable(InstanceIdentity.instanceId),
            "deviceFamily": OperatorProtocol.AnyCodable(InstanceIdentity.deviceFamily),
        ]
        if let model = InstanceIdentity.modelIdentifier {
            client["modelIdentifier"] = OperatorProtocol.AnyCodable(model)
        }
        return client
    }
}
