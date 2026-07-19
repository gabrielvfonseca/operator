package ai.operator.app.node

import ai.operator.app.protocol.OperatorCalendarCommand
import ai.operator.app.protocol.OperatorCallLogCommand
import ai.operator.app.protocol.OperatorCameraCommand
import ai.operator.app.protocol.OperatorCapability
import ai.operator.app.protocol.OperatorContactsCommand
import ai.operator.app.protocol.OperatorDeviceCommand
import ai.operator.app.protocol.OperatorLocationCommand
import ai.operator.app.protocol.OperatorMotionCommand
import ai.operator.app.protocol.OperatorNotificationsCommand
import ai.operator.app.protocol.OperatorPhotosCommand
import ai.operator.app.protocol.OperatorSmsCommand
import ai.operator.app.protocol.OperatorSystemCommand
import ai.operator.app.protocol.OperatorTalkCommand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      OperatorCapability.Canvas.rawValue,
      OperatorCapability.Device.rawValue,
      OperatorCapability.Notifications.rawValue,
      OperatorCapability.System.rawValue,
      OperatorCapability.Talk.rawValue,
      OperatorCapability.Contacts.rawValue,
      OperatorCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      OperatorCapability.Camera.rawValue,
      OperatorCapability.Location.rawValue,
      OperatorCapability.Sms.rawValue,
      OperatorCapability.CallLog.rawValue,
      OperatorCapability.Motion.rawValue,
      OperatorCapability.Photos.rawValue,
      OperatorCapability.VoiceWake.rawValue,
    )

  private val coreCommands =
    setOf(
      OperatorDeviceCommand.Status.rawValue,
      OperatorDeviceCommand.Info.rawValue,
      OperatorDeviceCommand.Permissions.rawValue,
      OperatorDeviceCommand.Health.rawValue,
      OperatorNotificationsCommand.List.rawValue,
      OperatorNotificationsCommand.Actions.rawValue,
      OperatorSystemCommand.Notify.rawValue,
      OperatorTalkCommand.PttStart.rawValue,
      OperatorTalkCommand.PttStop.rawValue,
      OperatorTalkCommand.PttCancel.rawValue,
      OperatorTalkCommand.PttOnce.rawValue,
      OperatorContactsCommand.Search.rawValue,
      OperatorContactsCommand.Add.rawValue,
      OperatorCalendarCommand.Events.rawValue,
      OperatorCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      OperatorCameraCommand.Snap.rawValue,
      OperatorCameraCommand.Clip.rawValue,
      OperatorCameraCommand.List.rawValue,
      OperatorLocationCommand.Get.rawValue,
      OperatorMotionCommand.Activity.rawValue,
      OperatorMotionCommand.Pedometer.rawValue,
      OperatorSmsCommand.Send.rawValue,
      OperatorSmsCommand.Search.rawValue,
      OperatorCallLogCommand.Search.rawValue,
      OperatorPhotosCommand.Latest.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          photosAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          voiceWakeEnabled = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesDeviceAppsOnlyWhenUserOptedIn() {
    val disabled = InvokeCommandRegistry.advertisedCommands(defaultFlags(installedAppsSharingEnabled = false))
    val enabled = InvokeCommandRegistry.advertisedCommands(defaultFlags(installedAppsSharingEnabled = true))

    assertFalse(disabled.contains(OperatorDeviceCommand.Apps.rawValue))
    assertTrue(enabled.contains(OperatorDeviceCommand.Apps.rawValue))
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          photosAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          sendSmsAvailable = false,
          readSmsAvailable = false,
          smsSearchPossible = false,
          callLogAvailable = false,
          photosAvailable = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          installedAppsSharingEnabled = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(OperatorMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(OperatorMotionCommand.Pedometer.rawValue))
  }

  @Test
  fun advertisedCommands_splitsSmsSendAndSearchAvailability() {
    val readOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(readSmsAvailable = true, smsSearchPossible = true),
      )
    val sendOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCommands.contains(OperatorSmsCommand.Search.rawValue))
    assertFalse(readOnlyCommands.contains(OperatorSmsCommand.Send.rawValue))
    assertTrue(sendOnlyCommands.contains(OperatorSmsCommand.Send.rawValue))
    assertFalse(sendOnlyCommands.contains(OperatorSmsCommand.Search.rawValue))
    assertTrue(requestableSearchCommands.contains(OperatorSmsCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_includeSmsWhenEitherSmsPathIsAvailable() {
    val readOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(readSmsAvailable = true),
      )
    val sendOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCapabilities.contains(OperatorCapability.Sms.rawValue))
    assertTrue(sendOnlyCapabilities.contains(OperatorCapability.Sms.rawValue))
    assertFalse(requestableSearchCapabilities.contains(OperatorCapability.Sms.rawValue))
  }

  @Test
  fun advertisedCommands_excludesCallLogWhenUnavailable() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(callLogAvailable = false))

    assertFalse(commands.contains(OperatorCallLogCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_excludesCallLogWhenUnavailable() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(callLogAvailable = false))

    assertFalse(capabilities.contains(OperatorCapability.CallLog.rawValue))
  }

  @Test
  fun advertisedPhotosSurface_respectsFeatureAvailability() {
    val disabledFlags = defaultFlags(photosAvailable = false)
    val enabledFlags = defaultFlags(photosAvailable = true)

    assertFalse(InvokeCommandRegistry.advertisedCapabilities(disabledFlags).contains(OperatorCapability.Photos.rawValue))
    assertFalse(InvokeCommandRegistry.advertisedCommands(disabledFlags).contains(OperatorPhotosCommand.Latest.rawValue))
    assertTrue(InvokeCommandRegistry.advertisedCapabilities(enabledFlags).contains(OperatorCapability.Photos.rawValue))
    assertTrue(InvokeCommandRegistry.advertisedCommands(enabledFlags).contains(OperatorPhotosCommand.Latest.rawValue))
  }

  @Test
  fun find_returnsForegroundMetadataForCameraCommands() {
    val list = InvokeCommandRegistry.find(OperatorCameraCommand.List.rawValue)
    val location = InvokeCommandRegistry.find(OperatorLocationCommand.Get.rawValue)
    val pttStart = InvokeCommandRegistry.find(OperatorTalkCommand.PttStart.rawValue)
    val pttStop = InvokeCommandRegistry.find(OperatorTalkCommand.PttStop.rawValue)
    val pttCancel = InvokeCommandRegistry.find(OperatorTalkCommand.PttCancel.rawValue)
    val pttOnce = InvokeCommandRegistry.find(OperatorTalkCommand.PttOnce.rawValue)

    assertNotNull(list)
    assertEquals(true, list?.requiresForeground)
    assertNotNull(location)
    assertEquals(false, location?.requiresForeground)
    assertNotNull(pttStart)
    assertEquals(false, pttStart?.requiresForeground)
    assertNotNull(pttStop)
    assertEquals(false, pttStop?.requiresForeground)
    assertNotNull(pttCancel)
    assertEquals(false, pttCancel?.requiresForeground)
    assertNotNull(pttOnce)
    assertEquals(true, pttOnce?.requiresForeground)
  }

  @Test
  fun find_returnsNullForUnknownCommand() {
    assertNull(InvokeCommandRegistry.find("not.real"))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    sendSmsAvailable: Boolean = false,
    readSmsAvailable: Boolean = false,
    smsSearchPossible: Boolean = false,
    callLogAvailable: Boolean = false,
    photosAvailable: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    installedAppsSharingEnabled: Boolean = false,
    debugBuild: Boolean = false,
    voiceWakeEnabled: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      sendSmsAvailable = sendSmsAvailable,
      readSmsAvailable = readSmsAvailable,
      smsSearchPossible = smsSearchPossible,
      callLogAvailable = callLogAvailable,
      photosAvailable = photosAvailable,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      installedAppsSharingEnabled = installedAppsSharingEnabled,
      debugBuild = debugBuild,
      voiceWakeEnabled = voiceWakeEnabled,
    )

  private fun assertContainsAll(
    actual: List<String>,
    expected: Set<String>,
  ) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(
    actual: List<String>,
    forbidden: Set<String>,
  ) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
