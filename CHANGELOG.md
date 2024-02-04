# WebTransport APIs tests changelog

## v1.0

- Implemented a WebTransport client-server interation with fails-components/webtransport library for node.js environment.
- Issue with library: WebTransport server has problems with property transportInt which is always null.

## v1.1

- Implemented a WebTransport client-server interation with webtransport-go library for go environment.
- Test with a unidirectional stream from server to client.
- Test with a bidirectional stream.

## v1.2

- Solved browser certificates issue.
- Solved WebTransport nodejs server transportInt issue.
- Implemented server webtransport module and client WebTransport library.
- Added two version of client: browser client (browserclient.js) and process client (client.js)

## v1.3

- Created branch test
- Created test environment
