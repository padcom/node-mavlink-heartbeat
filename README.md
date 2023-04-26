# Heartbeat scheduler and receiver for node-mavlink

Sending and receiving heartbeats is really a basic thing. It shouldn't have to be written per project.
This is why the `node-mavlink-heartbeat` package has been created. In a simple and effective way it allows the developer to concentrate on what is important and not what is just noise.

## Installation

To install the package issue the following command:

```bash
$ npm install --save node-mavlink-heartbeat
```

## Usage

There are 2 birds that you'll be able to kill with one stone, so to speak. That's because the same instance of `Heartbeat` can serve as both the receiver, sender and scheduler of sending heartbeat packets.

For a comprehensive example please see `examples/simple.ts`

```typescript
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

// send a single heartbeat
await heartbeat.send()
// start sending heartbeats
heartbeat.start()
// stop sending heartbeats
heartbeat.stop()
```

Happy coding!
