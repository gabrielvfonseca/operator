import Testing
@testable import operator

@MainActor
struct ClawHubSkillsBrowserSmokeTests {
    @Test func `ClawHub browser builds guarded review flow`() {
        let view = ClawHubSkillsBrowser(installedSkills: [], onInstalled: { _ in })
        _ = view.body
    }
}
