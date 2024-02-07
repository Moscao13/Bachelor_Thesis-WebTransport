package main

import (
	"context"
	"crypto/tls"
	"log"

	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

func main() {

	/// Settings for the call
	tconfig := &tls.Config{
		InsecureSkipVerify: true,
	}

	h3rt := &http3.RoundTripper{
		TLSClientConfig:    tconfig,
		DisableCompression: true,
	}

	/// Setting the client webtransport with http3 and tls configurations
	d := &webtransport.Dialer{
		RoundTripper: h3rt,
	}

	/// Calling the endpoint with webtransport protocol
	rsp, conn, dialErr := d.Dial(context.Background(), "https://localhost/webtransport", nil)

	log.Printf("Status code: %d", rsp.StatusCode)

	if dialErr != nil {
		log.Printf("Error while calling endpoint: %s\nShutting down...", dialErr)
		return
	}
	defer rsp.Body.Close()

	// body := make([]byte, 12)

	// log.Printf("body len: %d\n", len(body))
	// log.Printf("content len: %d\n", rsp.ContentLength)
	// count, errore := rsp.Body.Read(body)
	// log.Println(errore.Error())
	// log.Printf("read count: %d\n", count)

	// log.Printf("Body: %s", body)

	/// Opening unidirectional incoming stream
	rcv, uniErr := conn.AcceptUniStream(context.Background())

	if uniErr != nil {
		log.Println("An error occurred while opening unidirectional incoming stream")
		return
	}

	log.Printf("Stream initialized with id: %d", rcv.StreamID())

	message := make([]byte, 2)

	/// Trying to open a unidirectional incoming stream
	num, rdErr := rcv.Read(message)

	if rdErr != nil {
		log.Println("An error occurred while reading from the unidirectional incoming stream")
		return
	}

	log.Printf("Read %d bytes from stream!\nReceived string: %s", num, string(message))
	log.Println("Stream closure not needed. It is a unidirectioinal incoming stream. Only server has to shut it down")

	/// Trying to open a bidirectional stream
	bistream, biErr := conn.OpenStream()

	if biErr != nil {
		log.Println("An error occurred while opening bidirectional stream")
		return
	}

	log.Println("Bidirectional stream opened")

	/// Writing message to server
	hellofromclient := "Hello server"
	bistream.Write([]byte(hellofromclient))

	log.Printf("Sending to client string: %s", hellofromclient)

	/// Waiting for server response
	hellofromserver := make([]byte, 13)

	rdnum, birderr := bistream.Read(hellofromserver)

	if birderr != nil {
		log.Printf("An error occurred while reading from bidirectional stream: %s", birderr.Error())
		return
	}

	log.Printf("Read %d bytes from stream!\nReceived string: %s", rdnum, string(hellofromserver))

	/// Closing client side bidirectional stream
	bistream.Close()
	log.Println("Bidirectional stream closed")
}
