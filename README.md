# Performance Test and comparison between WebTransport and WebSocket protocols

## Test structure

The structure used for test and comparison between the two protocols is a client-server architecture. On server side there is a simple server echo responding to client with the same data received by It. In order to obtain interesting results, requests was made of a 65.535 bytes Lorem Ipsum.

Data provided by the first requests-responses was rejected in order to make communications using full power.

Primary test activity was carried out in a Go client-server application. A secondary test activity was carried out in a browser environment.

## Dictionary

- `Batch`: Set of actions made of a request from client to server followed by the the relative response from server;
- `Stream`: Object representing a WebTransport stream in WebTransport context or a socket in WebSocket context;
- `Batch single stream`: Single batch executed on a single stream of client-server communication;
- `Batch multi stream`: Set of batch concurrently executed on more streams (One batch per stream);
- `Latency`: Amount of time between the begginning of a batch and It's end, or between a request and It's realtive response. [ms] or [µs];
- `Throughput`: Max amount of data moved between the two endpoints. [bps];

## Test routine

- latency and throughput of a WebTransport batch single stream
- latency e throughput of a WebSocket batch single stream
- latency e throughput of a WebTransport batch multi stream
- latency e throughput of a WebSocket batch multi stream

## Credits

Libraries:

- NodeJs:
  - [webtransport](https://github.com/fails-components/webtransport) by [@fails-components](https://github.com/fails-components)
  - [ws](https://github.com/websockets/ws) by [@websockets](https://github.com/websockets)

- Go:
  - [webtransport-go](https://github.com/quic-go/webtransport-go) by [@quic-go](https://github.com/quic-go)
  - [websockets](https://github.com/gorilla/websocket) by [@gorilla](https://github.com/gorilla)
