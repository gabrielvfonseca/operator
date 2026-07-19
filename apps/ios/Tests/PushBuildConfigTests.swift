import Foundation
import Testing
@testable import Operator

struct PushBuildConfigTests {
    @Test func `app store mode derives production relay contract`() {
        let config = PushBuildConfig(infoDictionary: [
            "OperatorPushMode": "appStore",
            "OperatorPushRelayBaseURL": "https://wrong.example.com",
        ])

        #expect(config.mode == .appStore)
        #expect(config.transport == .relay)
        #expect(config.distribution == .official)
        #expect(config.relayBaseURL?.absoluteString == "https://ios-push-relay.operator.ai")
        #expect(config.apnsEnvironment == .production)
        #expect(config.relayProfile == .production)
        #expect(config.proofPolicy == .appleStrict)
    }

    @Test func `simulator sandbox mode derives internal proof contract`() {
        let config = PushBuildConfig(infoDictionary: [
            "OperatorPushMode": "simulatorSandbox",
            "OperatorPushRelayBaseURL": "https://staging-relay.example.com",
        ])

        #expect(config.mode == .simulatorSandbox)
        #expect(config.transport == .relay)
        #expect(config.distribution == .official)
        #expect(config.relayBaseURL?.absoluteString == "https://staging-relay.example.com")
        #expect(config.apnsEnvironment == .sandbox)
        #expect(config.relayProfile == .simulatorSandbox)
        #expect(config.proofPolicy == .internalSimulator)
    }

    @Test func `local release mode remains direct production push`() {
        let config = PushBuildConfig(infoDictionary: [
            "OperatorPushMode": "localProduction",
            "OperatorPushRelayBaseURL": "https://ios-push-relay.operator.ai",
        ])

        #expect(config.mode == .localProduction)
        #expect(config.transport == .direct)
        #expect(config.distribution == .local)
        #expect(config.relayBaseURL == nil)
        #expect(config.apnsEnvironment == .production)
        #expect(config.relayProfile == .production)
        #expect(config.proofPolicy == .appleStrict)
    }
}
