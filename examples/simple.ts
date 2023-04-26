#!/usr/bin/env -S npx ts-node

import { SerialPort } from 'serialport'
import {
  MavLinkPacketParser,
  MavLinkPacketSplitter,
} from 'node-mavlink'

import { Heartbeat, HeartbeatData } from '..'

(async () => {
  const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200 })
  const heartbeat = new Heartbeat(port)
  heartbeat.on('heartbeat', ({ packet, heartbeat }: HeartbeatData) => {
    // do something with the packet
    console.log(packet.debug())
    // or with the typed heartbeat packet
    console.log(heartbeat.baseMode)
  })

  port
    .pipe(new MavLinkPacketSplitter())
    .pipe(new MavLinkPacketParser())
    .pipe(heartbeat)
    .resume()

  // Wait for the drone to give us a sign it's alive
  // That way we know for sure the connection is ready.
  await heartbeat.waitForOne()

  // That's how you send one heartbeat to the other side.
  // If you want to do it periodically call the `start()` method.
  await heartbeat.send()
})()

