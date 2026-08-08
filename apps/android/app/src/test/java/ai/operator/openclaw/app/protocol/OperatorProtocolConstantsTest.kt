package ai.operator.app.protocol

import org.junit.Assert.assertTrue
import org.junit.Test

class OperatorProtocolConstantsTest {
  @Test
  fun generatedCapabilitiesAreUniqueProtocolIds() {
    val values = OperatorCapability.entries.map { it.rawValue }

    assertTrue(values.isNotEmpty())
    assertTrue(values.all { it.isNotBlank() && "." !in it })
    assertTrue(values.size == values.toSet().size)
  }

  @Test
  fun generatedCommandGroupsMatchTheirNamespaces() {
    val groups =
      listOf(
        OperatorCanvasCommand.NamespacePrefix to OperatorCanvasCommand.entries.map { it.rawValue },
        OperatorCanvasA2UICommand.NamespacePrefix to OperatorCanvasA2UICommand.entries.map { it.rawValue },
        OperatorCameraCommand.NamespacePrefix to OperatorCameraCommand.entries.map { it.rawValue },
        OperatorSmsCommand.NamespacePrefix to OperatorSmsCommand.entries.map { it.rawValue },
        OperatorTalkCommand.NamespacePrefix to OperatorTalkCommand.entries.map { it.rawValue },
        OperatorLocationCommand.NamespacePrefix to OperatorLocationCommand.entries.map { it.rawValue },
        OperatorDeviceCommand.NamespacePrefix to OperatorDeviceCommand.entries.map { it.rawValue },
        OperatorNotificationsCommand.NamespacePrefix to OperatorNotificationsCommand.entries.map { it.rawValue },
        OperatorSystemCommand.NamespacePrefix to OperatorSystemCommand.entries.map { it.rawValue },
        OperatorPhotosCommand.NamespacePrefix to OperatorPhotosCommand.entries.map { it.rawValue },
        OperatorContactsCommand.NamespacePrefix to OperatorContactsCommand.entries.map { it.rawValue },
        OperatorCalendarCommand.NamespacePrefix to OperatorCalendarCommand.entries.map { it.rawValue },
        OperatorMotionCommand.NamespacePrefix to OperatorMotionCommand.entries.map { it.rawValue },
        OperatorCallLogCommand.NamespacePrefix to OperatorCallLogCommand.entries.map { it.rawValue },
      )

    val commands = groups.flatMap { (prefix, values) -> values.onEach { assertTrue(it.startsWith(prefix)) } }
    assertTrue(commands.size == commands.toSet().size)
  }
}
