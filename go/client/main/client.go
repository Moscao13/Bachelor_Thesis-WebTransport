package main

import (
	"context"
	"crypto/tls"
	"example/client/test"

	"github.com/gorilla/websocket"
	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

func main() {

	/// Setting webtransport dialer
	tconfig := &tls.Config{
		InsecureSkipVerify: true,
	}

	h3rt := &http3.RoundTripper{
		TLSClientConfig:    tconfig,
		DisableCompression: true,
	}

	d := &webtransport.Dialer{
		RoundTripper: h3rt,
	}

	/// Setting websockets dialer
	wsd := websocket.Dialer{
		TLSClientConfig: tconfig,
	}

	/// Test webtransport single client single stream
	test.TestSingleStreamSingleClient(context.Background(), d)

	/// Test websockets single client single stream
	test.TestSingleStreamSingleClientWebSocket(&wsd)

	/// Test webtransport single client multi stream
	test.TestMultiStreamSingleClient(context.Background(), d)

	/// Test websockets single client multi stream
	test.TestMultiStreamSingleClientWebSocket(&wsd)
}
