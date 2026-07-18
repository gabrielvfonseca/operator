package ai.operator.app.protocol

import org.junit.Assert.assertTrue
import org.junit.Test

class operatorProtocolConstantsTest {
  @Test
  fun generatedCapabilitiesAreUniqueProtocolIds() {
    val values = operatorCapability.entries.map { it.rawValue }

    assertTrue(values.isNotEmpty())
    assertTrue(values.all { it.isNotBlank() && "." !in it })
    assertTrue(values.size == values.toSet().size)
  }

  @Test
  fun generatedCommandGroupsMatchTheirNamespaces() {
    val groups =
      listOf(
        operatorCanvasCommand.NamespacePrefix to operatorCanvasCommand.entries.map { it.rawValue },
        operatorCanvasA2UICommand.NamespacePrefix to operatorCanvasA2UICommand.entries.map { it.rawValue },
        operatorCameraCommand.NamespacePrefix to operatorCameraCommand.entries.map { it.rawValue },
        operatorSmsCommand.NamespacePrefix to operatorSmsCommand.entries.map { it.rawValue },
        operatorTalkCommand.NamespacePrefix to operatorTalkCommand.entries.map { it.rawValue },
        operatorLocationCommand.NamespacePrefix to operatorLocationCommand.entries.map { it.rawValue },
        operatorDeviceCommand.NamespacePrefix to operatorDeviceCommand.entries.map { it.rawValue },
        operatorNotificationsCommand.NamespacePrefix to operatorNotificationsCommand.entries.map { it.rawValue },
        operatorSystemCommand.NamespacePrefix to operatorSystemCommand.entries.map { it.rawValue },
        operatorPhotosCommand.NamespacePrefix to operatorPhotosCommand.entries.map { it.rawValue },
        operatorContactsCommand.NamespacePrefix to operatorContactsCommand.entries.map { it.rawValue },
        operatorCalendarCommand.NamespacePrefix to operatorCalendarCommand.entries.map { it.rawValue },
        operatorMotionCommand.NamespacePrefix to operatorMotionCommand.entries.map { it.rawValue },
        operatorCallLogCommand.NamespacePrefix to operatorCallLogCommand.entries.map { it.rawValue },
      )

    val commands = groups.flatMap { (prefix, values) -> values.onEach { assertTrue(it.startsWith(prefix)) } }
    assertTrue(commands.size == commands.toSet().size)
  }
}
