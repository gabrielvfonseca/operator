package ai.operator.app.node

import ai.operator.app.protocol.operatorCalendarCommand
import ai.operator.app.protocol.operatorCallLogCommand
import ai.operator.app.protocol.operatorCameraCommand
import ai.operator.app.protocol.operatorCapability
import ai.operator.app.protocol.operatorContactsCommand
import ai.operator.app.protocol.operatorDeviceCommand
import ai.operator.app.protocol.operatorLocationCommand
import ai.operator.app.protocol.operatorMotionCommand
import ai.operator.app.protocol.operatorNotificationsCommand
import ai.operator.app.protocol.operatorPhotosCommand
import ai.operator.app.protocol.operatorSmsCommand
import ai.operator.app.protocol.operatorSystemCommand
import ai.operator.app.protocol.operatorTalkCommand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      operatorCapability.Canvas.rawValue,
      operatorCapability.Device.rawValue,
      operatorCapability.Notifications.rawValue,
      operatorCapability.System.rawValue,
      operatorCapability.Talk.rawValue,
      operatorCapability.Contacts.rawValue,
      operatorCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      operatorCapability.Camera.rawValue,
      operatorCapability.Location.rawValue,
      operatorCapability.Sms.rawValue,
      operatorCapability.CallLog.rawValue,
      operatorCapability.Motion.rawValue,
      operatorCapability.Photos.rawValue,
      operatorCapability.VoiceWake.rawValue,
    )

  private val coreCommands =
    setOf(
      operatorDeviceCommand.Status.rawValue,
      operatorDeviceCommand.Info.rawValue,
      operatorDeviceCommand.Permissions.rawValue,
      operatorDeviceCommand.Health.rawValue,
      operatorNotificationsCommand.List.rawValue,
      operatorNotificationsCommand.Actions.rawValue,
      operatorSystemCommand.Notify.rawValue,
      operatorTalkCommand.PttStart.rawValue,
      operatorTalkCommand.PttStop.rawValue,
      operatorTalkCommand.PttCancel.rawValue,
      operatorTalkCommand.PttOnce.rawValue,
      operatorContactsCommand.Search.rawValue,
      operatorContactsCommand.Add.rawValue,
      operatorCalendarCommand.Events.rawValue,
      operatorCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      operatorCameraCommand.Snap.rawValue,
      operatorCameraCommand.Clip.rawValue,
      operatorCameraCommand.List.rawValue,
      operatorLocationCommand.Get.rawValue,
      operatorMotionCommand.Activity.rawValue,
      operatorMotionCommand.Pedometer.rawValue,
      operatorSmsCommand.Send.rawValue,
      operatorSmsCommand.Search.rawValue,
      operatorCallLogCommand.Search.rawValue,
      operatorPhotosCommand.Latest.rawValue,
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

    assertFalse(disabled.contains(operatorDeviceCommand.Apps.rawValue))
    assertTrue(enabled.contains(operatorDeviceCommand.Apps.rawValue))
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

    assertTrue(commands.contains(operatorMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(operatorMotionCommand.Pedometer.rawValue))
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

    assertTrue(readOnlyCommands.contains(operatorSmsCommand.Search.rawValue))
    assertFalse(readOnlyCommands.contains(operatorSmsCommand.Send.rawValue))
    assertTrue(sendOnlyCommands.contains(operatorSmsCommand.Send.rawValue))
    assertFalse(sendOnlyCommands.contains(operatorSmsCommand.Search.rawValue))
    assertTrue(requestableSearchCommands.contains(operatorSmsCommand.Search.rawValue))
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

    assertTrue(readOnlyCapabilities.contains(operatorCapability.Sms.rawValue))
    assertTrue(sendOnlyCapabilities.contains(operatorCapability.Sms.rawValue))
    assertFalse(requestableSearchCapabilities.contains(operatorCapability.Sms.rawValue))
  }

  @Test
  fun advertisedCommands_excludesCallLogWhenUnavailable() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(callLogAvailable = false))

    assertFalse(commands.contains(operatorCallLogCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_excludesCallLogWhenUnavailable() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(callLogAvailable = false))

    assertFalse(capabilities.contains(operatorCapability.CallLog.rawValue))
  }

  @Test
  fun advertisedPhotosSurface_respectsFeatureAvailability() {
    val disabledFlags = defaultFlags(photosAvailable = false)
    val enabledFlags = defaultFlags(photosAvailable = true)

    assertFalse(InvokeCommandRegistry.advertisedCapabilities(disabledFlags).contains(operatorCapability.Photos.rawValue))
    assertFalse(InvokeCommandRegistry.advertisedCommands(disabledFlags).contains(operatorPhotosCommand.Latest.rawValue))
    assertTrue(InvokeCommandRegistry.advertisedCapabilities(enabledFlags).contains(operatorCapability.Photos.rawValue))
    assertTrue(InvokeCommandRegistry.advertisedCommands(enabledFlags).contains(operatorPhotosCommand.Latest.rawValue))
  }

  @Test
  fun find_returnsForegroundMetadataForCameraCommands() {
    val list = InvokeCommandRegistry.find(operatorCameraCommand.List.rawValue)
    val location = InvokeCommandRegistry.find(operatorLocationCommand.Get.rawValue)
    val pttStart = InvokeCommandRegistry.find(operatorTalkCommand.PttStart.rawValue)
    val pttStop = InvokeCommandRegistry.find(operatorTalkCommand.PttStop.rawValue)
    val pttCancel = InvokeCommandRegistry.find(operatorTalkCommand.PttCancel.rawValue)
    val pttOnce = InvokeCommandRegistry.find(operatorTalkCommand.PttOnce.rawValue)

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
