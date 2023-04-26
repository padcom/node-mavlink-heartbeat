import { Transform, TransformOptions, TransformCallback, Writable } from 'stream'
import { MavLinkPacket, MavLinkProtocol, MavLinkProtocolV2, send, minimal } from 'node-mavlink'

/**
 * Heartbeat transformer options specific to the implementation
 */
export interface HeartbeatOptions {
  /** Protocol (MavLinkProtocolV2 by default) */
  protocol?: MavLinkProtocol
}

export interface HeartbeatData {
  packet: MavLinkPacket
  heartbeat: minimal.Heartbeat
}

/**
 * Heartbeat manager for node-mavlink
 */
export class Heartbeat extends Transform {
  private readonly protocol: MavLinkProtocol
  private timer: any = null

  public type: minimal.MavType = minimal.MavType.GCS
  public autopilot: minimal.MavAutopilot = minimal.MavAutopilot.GENERIC
  public baseMode: minimal.MavModeFlag = minimal.MavModeFlag.CUSTOM_MODE_ENABLED | minimal.MavModeFlag.TEST_ENABLED
  public customMode: number = 0
  public systemStatus: minimal.MavState = minimal.MavState.ACTIVE
  public mavlinkVersion: number = 2

  constructor(
    private readonly port: Writable,
    options: TransformOptions & HeartbeatOptions = {}
  ) {
    super({ objectMode: true, ...options })

    this.protocol = options.protocol || new MavLinkProtocolV2()
    this.send = this.send.bind(this)
  }

  _transform(packet: MavLinkPacket, encoding: string, callback: TransformCallback) {
    if (packet.header.msgid === minimal.Heartbeat.MSG_ID) {
      const heartbeat = packet.protocol.data(packet.payload, minimal.Heartbeat)
      this.emit('heartbeat', { packet, heartbeat })
    }

    callback(null, packet)
  }

  /**
   * Send heartbeat packet to the other side
   */
  async send() {
    const packet = new minimal.Heartbeat()
    packet.type = this.type
    packet.autopilot = this.autopilot
    packet.baseMode = this.baseMode
    packet.customMode = this.customMode
    packet.systemStatus = this.systemStatus
    packet.mavlinkVersion = this.mavlinkVersion

    await send(this.port, packet, this.protocol)
  }

  /**
   * Start sending heartbeat packets periodically every <code>interval<code> millisecond
   */
  start(interval: number = 1000) {
    if (this.timer) throw new Error('Heartbeat already running')

    this.timer = setInterval(this.send, interval)
  }

  /**
   * Stop sending heartbeat packets periodically
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
