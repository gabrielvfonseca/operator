package ai.operator.app.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class VoiceWakePreferencesTest {
  @Test
  fun sanitizeTrimsDropsEmptyAndUsesDefaults() {
    assertEquals(listOf("hello", "computer"), VoiceWakePreferences.sanitizeTriggerWords(listOf(" hello ", "", "computer")))
    assertEquals(VoiceWakePreferences.defaultTriggerWords, VoiceWakePreferences.sanitizeTriggerWords(emptyList()))
  }

  @Test
  fun sanitizePreservesPhrasePunctuationAndNewlines() {
    assertEquals(
      listOf("hey, openclaw", "line\nbreak"),
      VoiceWakePreferences.sanitizeTriggerWords(listOf(" hey, operator ", "line\nbreak")),
    )
  }

  @Test
  fun matcherRequiresWordBoundariesAndCommand() {
    assertNull(VoiceWakePhraseMatcher.match("reoperator show status", listOf("@gabrielvfonseca/operator")))
    assertNull(VoiceWakePhraseMatcher.match("@gabrielvfonseca/operator", listOf("@gabrielvfonseca/operator")))
    assertNull(VoiceWakePhraseMatcher.match("tell operator show status", listOf("@gabrielvfonseca/operator")))
    assertEquals(
      VoiceWakeMatch(trigger = "Operator", command = "show status"),
      VoiceWakePhraseMatcher.match("Hey Operator, show status", listOf("@gabrielvfonseca/operator")),
    )
  }

  @Test
  fun matcherUsesEarliestTrigger() {
    assertEquals(
      VoiceWakeMatch(trigger = "computer", command = "ask claude for status"),
      VoiceWakePhraseMatcher.match("computer ask claude for status", listOf("claude", "computer")),
    )
  }

  @Test
  fun matcherSupportsScriptsWithoutWhitespaceWordBoundaries() {
    assertEquals(
      VoiceWakeMatch(trigger = "小龙虾", command = "天气怎么样"),
      VoiceWakePhraseMatcher.match("小龙虾天气怎么样", listOf("小龙虾")),
    )
    assertEquals(
      VoiceWakeMatch(trigger = "โอเพนคลอ", command = "สภาพอากาศ"),
      VoiceWakePhraseMatcher.match("โอเพนคลอสภาพอากาศ", listOf("โอเพนคลอ")),
    )
  }

  @Test
  fun matcherNormalizesSpokenPunctuationAndWhitespace() {
    assertEquals(
      VoiceWakeMatch(trigger = "Hey Operator", command = "show status"),
      VoiceWakePhraseMatcher.match("Hey Operator show status", listOf("hey,\nopenclaw")),
    )
  }
}
