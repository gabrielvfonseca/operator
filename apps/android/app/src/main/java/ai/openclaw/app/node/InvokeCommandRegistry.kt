package ai.operator.app.node

import ai.operator.app.protocol.OperatorCalendarCommand
import ai.operator.app.protocol.OperatorCallLogCommand
import ai.operator.app.protocol.OperatorCameraCommand
import ai.operator.app.protocol.OperatorCanvasA2UICommand
import ai.operator.app.protocol.OperatorCanvasCommand
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

/** Runtime feature flags used to decide which node tools are advertised. */
data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val sendSmsAvailable: Boolean,
  val readSmsAvailable: Boolean,
  val smsSearchPossible: Boolean,
  val callLogAvailable: Boolean,
  val photosAvailable: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val installedAppsSharingEnabled: Boolean,
  val debugBuild: Boolean,
  val voiceWakeEnabled: Boolean = false,
)

/** Per-command availability gates checked before advertising invoke methods. */
enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SendSmsAvailable,
  ReadSmsAvailable,
  RequestableSmsSearchAvailable,
  CallLogAvailable,
  PhotosAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  InstalledAppsSharingEnabled,
  DebugBuild,
}

/** Per-capability availability gates for the node capabilities manifest. */
enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  CallLogAvailable,
  PhotosAvailable,
  MotionAvailable,
  VoiceWakeEnabled,
}

/** Capability entry reported to the gateway when its availability gate passes. */
data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

/** Invoke method entry advertised to gateway plus foreground routing metadata. */
data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  /** Capabilities mirror gateway protocol ids and are filtered by device state. */
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = OperatorCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = OperatorCapability.Device.rawValue),
      NodeCapabilitySpec(name = OperatorCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = OperatorCapability.System.rawValue),
      NodeCapabilitySpec(
        name = OperatorCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = OperatorCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(name = OperatorCapability.Talk.rawValue),
      NodeCapabilitySpec(
        name = OperatorCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(
        name = OperatorCapability.Photos.rawValue,
        availability = NodeCapabilityAvailability.PhotosAvailable,
      ),
      NodeCapabilitySpec(name = OperatorCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = OperatorCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = OperatorCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
      NodeCapabilitySpec(
        name = OperatorCapability.CallLog.rawValue,
        availability = NodeCapabilityAvailability.CallLogAvailable,
      ),
      NodeCapabilitySpec(
        name = OperatorCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
    )

  /** Complete Android node command catalog before runtime availability filtering. */
  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = OperatorCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OperatorCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OperatorCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OperatorCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OperatorCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OperatorCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OperatorCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OperatorCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OperatorSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorTalkCommand.PttStart.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorTalkCommand.PttStop.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorTalkCommand.PttCancel.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorTalkCommand.PttOnce.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OperatorCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = OperatorCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = OperatorCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = OperatorLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = OperatorDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorDeviceCommand.Apps.rawValue,
        availability = InvokeCommandAvailability.InstalledAppsSharingEnabled,
      ),
      InvokeCommandSpec(
        name = OperatorNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorPhotosCommand.Latest.rawValue,
        availability = InvokeCommandAvailability.PhotosAvailable,
      ),
      InvokeCommandSpec(
        name = OperatorContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = OperatorMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = OperatorMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = OperatorSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SendSmsAvailable,
      ),
      InvokeCommandSpec(
        name = OperatorSmsCommand.Search.rawValue,
        availability = InvokeCommandAvailability.RequestableSmsSearchAvailable,
      ),
      InvokeCommandSpec(
        name = OperatorCallLogCommand.Search.rawValue,
        availability = InvokeCommandAvailability.CallLogAvailable,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  /** Finds the command metadata used by dispatch and advertised-method builders. */
  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  /** Returns gateway capability ids the current Android device can actually serve. */
  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> =
    capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.sendSmsAvailable || flags.readSmsAvailable
          NodeCapabilityAvailability.CallLogAvailable -> flags.callLogAvailable
          NodeCapabilityAvailability.PhotosAvailable -> flags.photosAvailable
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
        }
      }.map { it.name }

  /** Returns gateway invoke method ids available under current permissions/build flags. */
  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> =
    all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SendSmsAvailable -> flags.sendSmsAvailable
          InvokeCommandAvailability.ReadSmsAvailable -> flags.readSmsAvailable
          InvokeCommandAvailability.RequestableSmsSearchAvailable -> flags.smsSearchPossible
          InvokeCommandAvailability.CallLogAvailable -> flags.callLogAvailable
          InvokeCommandAvailability.PhotosAvailable -> flags.photosAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.InstalledAppsSharingEnabled -> flags.installedAppsSharingEnabled
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
        }
      }.map { it.name }
}
