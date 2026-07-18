import Foundation
import Testing
@testable import operator

@Suite("Application Relocator Tests")
@MainActor
struct ApplicationRelocatorTests {
    private let home = URL(fileURLWithPath: "/Users/tester")
    private let current = ApplicationRelocator.ApplicationIdentity(
        bundleIdentifier: "ai.operator.mac",
        buildVersion: "100")

    @Test
    func `stable application locations continue normally`() {
        let paths = [
            "/Applications/operator.app",
            "/Users/tester/Applications/operator.app",
            "/Users/tester/Tools/operator.app",
            "/Volumes/External/Apps/operator.app",
        ]
        for path in paths {
            let recommendation = ApplicationRelocator.recommendation(
                for: self.environment(path: path, readOnlyVolume: false))
            #expect(recommendation == .continueLaunch)
        }
    }

    @Test
    func `debug and test builds never relocate`() {
        let recommendation = ApplicationRelocator.recommendation(
            for: self.environment(
                path: "/Users/tester/Downloads/operator.app",
                debugOrTesting: true))

        #expect(recommendation == .continueLaunch)
    }

    @Test
    func `transient copy offers system installation when available`() {
        let destination = URL(fileURLWithPath: "/Applications/operator.app")
        let recommendation = ApplicationRelocator.recommendation(
            for: self.environment(
                path: "/Users/tester/Downloads/operator.app",
                candidates: [self.missing(destination, writable: true)]))

        #expect(recommendation == .offerInstall(destination: destination, replacing: false))
    }

    @Test
    func `read only mounted copy offers installation`() {
        let destination = URL(fileURLWithPath: "/Applications/operator.app")
        let recommendation = ApplicationRelocator.recommendation(
            for: self.environment(
                path: "/Volumes/operator/operator.app",
                candidates: [self.missing(destination, writable: true)],
                readOnlyVolume: true))

        #expect(recommendation == .offerInstall(destination: destination, replacing: false))
    }

    @Test
    func `translocated copy offers installation`() {
        let destination = URL(fileURLWithPath: "/Applications/operator.app")
        let recommendation = ApplicationRelocator.recommendation(
            for: self.environment(
                path: "/private/var/folders/x/AppTranslocation/y/d/operator.app",
                candidates: [self.missing(destination, writable: true)]))

        #expect(recommendation == .offerInstall(destination: destination, replacing: false))
    }

    @Test
    func `equal or newer installed build receives handoff`() {
        let destination = URL(fileURLWithPath: "/Applications/operator.app")
        for build in ["100", "110"] {
            let installed = ApplicationRelocator.ApplicationIdentity(
                bundleIdentifier: self.current.bundleIdentifier,
                buildVersion: build)
            let recommendation = ApplicationRelocator.recommendation(
                for: self.environment(
                    path: "/Users/tester/Downloads/operator.app",
                    candidates: [self.installed(destination, identity: installed)]))
            #expect(recommendation == .handOff(destination))
        }
    }

    @Test
    func `older installed build can be replaced`() {
        let destination = URL(fileURLWithPath: "/Applications/operator.app")
        let installed = ApplicationRelocator.ApplicationIdentity(
            bundleIdentifier: self.current.bundleIdentifier,
            buildVersion: "90")
        let recommendation = ApplicationRelocator.recommendation(
            for: self.environment(
                path: "/Users/tester/Downloads/operator.app",
                candidates: [self.installed(destination, identity: installed)]))

        #expect(recommendation == .offerInstall(destination: destination, replacing: true))
    }

    @Test
    func `different same named app is never replaced`() {
        let systemDestination = URL(fileURLWithPath: "/Applications/operator.app")
        let userDestination = self.home.appendingPathComponent("Applications/operator.app")
        let unrelated = ApplicationRelocator.ApplicationIdentity(
            bundleIdentifier: "example.unrelated",
            buildVersion: "999")
        let recommendation = ApplicationRelocator.recommendation(
            for: self.environment(
                path: "/Users/tester/Desktop/operator.app",
                candidates: [
                    self.installed(systemDestination, identity: unrelated),
                    self.missing(userDestination, writable: true),
                ]))

        #expect(recommendation == .offerInstall(destination: userDestination, replacing: false))
    }

    @Test
    func `untrusted same identity app never receives handoff`() {
        let systemDestination = URL(fileURLWithPath: "/Applications/operator.app")
        let userDestination = self.home.appendingPathComponent("Applications/operator.app")
        let recommendation = ApplicationRelocator.recommendation(
            for: self.environment(
                path: "/Users/tester/Downloads/operator.app",
                candidates: [
                    self.installed(systemDestination, identity: self.current, trusted: false),
                    self.missing(userDestination, writable: true),
                ]))

        #expect(recommendation == .offerInstall(destination: userDestination, replacing: false))
    }

    @Test
    func `unwritable destinations require manual installation`() {
        let recommendation = ApplicationRelocator.recommendation(
            for: self.environment(
                path: "/Users/tester/Downloads/operator.app",
                candidates: [
                    self.missing(URL(fileURLWithPath: "/Applications/operator.app"), writable: false),
                    self.missing(self.home.appendingPathComponent("Applications/operator.app"), writable: false),
                ]))

        #expect(recommendation == .cannotInstall)
    }

    @Test
    func `launch at login hydration does not persist the current bundle path`() {
        #expect(!AppState.shouldPersistLaunchAtLoginChange(
            isInitializing: false,
            isHydrating: true,
            isEnabling: true,
            bundleLocationAllowsPersistentIntegration: true))
        #expect(!AppState.shouldPersistLaunchAtLoginChange(
            isInitializing: false,
            isHydrating: false,
            isEnabling: true,
            bundleLocationAllowsPersistentIntegration: false))
        #expect(AppState.shouldPersistLaunchAtLoginChange(
            isInitializing: false,
            isHydrating: false,
            isEnabling: false,
            bundleLocationAllowsPersistentIntegration: false))
    }

    private func environment(
        path: String,
        candidates: [ApplicationRelocator.InstallCandidate] = [],
        readOnlyVolume: Bool = false,
        debugOrTesting: Bool = false) -> ApplicationRelocator.Environment
    {
        ApplicationRelocator.Environment(
            bundleURL: URL(fileURLWithPath: path),
            homeDirectory: self.home,
            currentIdentity: self.current,
            candidates: candidates,
            isReadOnlyVolume: readOnlyVolume,
            isDebugOrTesting: debugOrTesting)
    }

    private func missing(_ url: URL, writable: Bool) -> ApplicationRelocator.InstallCandidate {
        ApplicationRelocator.InstallCandidate(
            url: url,
            exists: false,
            isWritable: writable,
            isTrusted: false,
            identity: nil)
    }

    private func installed(
        _ url: URL,
        identity: ApplicationRelocator.ApplicationIdentity,
        trusted: Bool = true) -> ApplicationRelocator.InstallCandidate
    {
        ApplicationRelocator.InstallCandidate(
            url: url,
            exists: true,
            isWritable: true,
            isTrusted: trusted,
            identity: identity)
    }
}
