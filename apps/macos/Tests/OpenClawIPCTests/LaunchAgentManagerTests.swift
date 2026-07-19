import Foundation
import Testing
@testable import Operator

struct LaunchAgentManagerTests {
    @Test func `enabling an already loaded login job only refreshes its plist`() async {
        var persistedBundlePaths: [String] = []
        let reloaded = await LaunchAgentManager.set(
            enabled: true,
            bundlePath: "/Applications/Operator.app",
            loaded: true,
            writePlist: { persistedBundlePaths.append($0) })

        #expect(reloaded == false)
        #expect(persistedBundlePaths == ["/Applications/Operator.app"])
    }

    @Test func `launch at login plist does not keep app alive after manual quit`() throws {
        let plist = LaunchAgentManager.plistContents(bundlePath: "/Applications/Operator.app")
        let data = try #require(plist.data(using: .utf8))
        let object = try #require(
            PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any])

        #expect(object["RunAtLoad"] as? Bool == true)
        #expect(object["KeepAlive"] == nil)

        let args = try #require(object["ProgramArguments"] as? [String])
        #expect(args == ["/Applications/Operator.app/Contents/MacOS/Operator"])
    }
}
