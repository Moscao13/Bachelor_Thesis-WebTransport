package test

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/quic-go/webtransport-go"
)

var streamQty int = 100
var processQty int = 50

func getLoremIpsum() ([]byte, error) {
	bytes, err := os.ReadFile("./LoremIpsum.txt")

	if err != nil {
		return []byte{}, err
	}

	return bytes, nil
}

func writeResult(result string, filename string) {
	f, opErr := os.OpenFile("./"+filename, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if opErr != nil {
		log.Println(opErr)
	}
	defer f.Close()
	_, err := f.WriteString(result)

	if err != nil {
		log.Printf("An error occurred while writing on results file!: %s", err)
	}
}

/*---------------------------------------------------------------------------------------------------------------------------------------------*/

func TestSingleStreamSingleClient(context context.Context, d *webtransport.Dialer) {
	/// Opening connection with webtransport server
	rsp, conn, dialErr := d.Dial(context, "https://localhost/webtransport/tests/singlestream/singleclient", nil)

	if dialErr != nil {
		log.Printf("Error while calling endpoint: %s\nShutting down...", dialErr)
		return
	}
	defer rsp.Body.Close()

	/// Opening bidirectional stream with the server
	bistream, biErr := conn.OpenStream()

	if biErr != nil {
		log.Println("An error occurred while opening bidirectional stream")
		return
	}

	result := ""
	reader := bufio.NewReader(bistream)

	loremIpsum, errLoremIpsum := getLoremIpsum()
	if errLoremIpsum != nil {
		log.Printf("An error occurred while preparing request: %s", errLoremIpsum)
	}

	for i := 0; i < streamQty; i++ {

		before := time.Now()

		/// Writing request message to webtransport server
		_, wrErr := bistream.Write(loremIpsum)
		if wrErr != nil {
			log.Printf("An error occurred while writing on stream: %s", wrErr.Error())
		}

		/// Reading response message from webtransport server
		_, birderr := reader.ReadBytes('w')
		after := time.Now()

		if birderr != nil {
			log.Printf("An error occurred while reading from bidirectional stream: %s", birderr.Error())
			return
		}

		result += fmt.Sprintf("Latency: %d\n", after.Sub(before).Microseconds())
	}

	/// Closing stream with the webtransport server
	bistream.Close()
	/// Writing result into log file
	writeResult(result, "webtransport.singlestream.results.log")
}

/*---------------------------------------------------------------------------------------------------------------------------------------------*/

func multiStreamThread(stream webtransport.Stream, reader bufio.Reader, index int, wg *sync.WaitGroup, l *sync.Mutex) {
	defer wg.Done()
	result := ""
	loremIpsum, errLoremIpsum := getLoremIpsum()
	if errLoremIpsum != nil {
		log.Printf("An error occurred while preparing request: %s", errLoremIpsum)
	}

	for i := 0; i < streamQty; i++ {
		before := time.Now()

		/// Writing request message to webtransport server
		_, wrErr := stream.Write(loremIpsum)

		if wrErr != nil {
			log.Printf("%d: An error occurred while writing on stream: %s", index, wrErr.Error())
		}

		/// Reading response message from webtransport server
		_, birderr := reader.ReadBytes('w')
		after := time.Now()

		if birderr != nil {
			log.Printf("%d: An error occurred while reading from bidirectional stream: %s", index, birderr.Error())
			return
		}

		result += fmt.Sprintf("Latency: %d\n", after.Sub(before).Microseconds())
	}
	/// Closing stream with the webtransport server
	stream.Close()

	l.Lock()
	/// Writing result into log file
	writeResult(result, "webtransport.multistream.results.log")
	l.Unlock()
}

func TestMultiStreamSingleClient(context context.Context, d *webtransport.Dialer) {
	/// Opening connection with webtransport server
	rsp, conn, dialErr := d.Dial(context, "https://localhost/webtransport/tests/multistream/singleclient", nil)

	if dialErr != nil {
		log.Printf("Error while calling endpoint: %s\nShutting down...", dialErr)
		return
	}
	defer rsp.Body.Close()

	/// Creating stream array
	streams := make([]webtransport.Stream, processQty)
	readers := make([]bufio.Reader, processQty)

	var biErr error
	var wg sync.WaitGroup
	var l sync.Mutex

	for i := 0; i < processQty; i++ {
		/// Opening bidirectional stream with the server
		streams[i], biErr = conn.OpenStream()
		readers[i] = *bufio.NewReader(streams[i])

		if biErr != nil {
			log.Printf("An error occurred while opening bidirectional stream with id: %s\n", streams[i].StreamID().InitiatedBy().String())
			continue
		}
	}

	wg.Add(processQty)
	for i := 0; i < processQty; i++ {
		go multiStreamThread(streams[i], readers[i], i, &wg, &l)
	}

	wg.Wait()
	/// Closing connection with the webtransport server
	conn.CloseWithError(0, "Connection successfully closed!")
}

/*---------------------------------------------------------------------------------------------------------------------------------------------*/

func TestSingleStreamSingleClientWebSocket(d *websocket.Dialer) {
	/// Opening connection with websocket server
	conn, _, err := d.Dial("wss://localhost:4433/websockets/test", nil)

	if err != nil {
		log.Printf("An error occurred while opening connection with websocket server: %s", err.Error())
		return
	}

	result := ""

	loremIpsum, errLoremIpsum := getLoremIpsum()

	if errLoremIpsum != nil {
		log.Printf("An error occurred while preparing request: %s", errLoremIpsum)
	}

	for i := 0; i < streamQty; i++ {
		before := time.Now()
		/// Writing request message to websocket server
		wrErr := conn.WriteMessage(websocket.TextMessage, loremIpsum)
		if wrErr != nil {
			log.Println("An error occurred while writing on the websocket")
			return
		}

		/// Reading response message from websocket server
		_, _, rdErr := conn.ReadMessage()

		after := time.Now()
		if rdErr != nil {
			log.Println("An error occurred while reading from the websoket")
			return
		}

		result += fmt.Sprintf("Latency: %d\n", after.Sub(before).Microseconds())
	}
	/// Closing connection with the websocket server
	conn.Close()
	/// Writing result into log file
	writeResult(result, "websockets.singlestream.results.log")
}

/*---------------------------------------------------------------------------------------------------*/

func multiSocketThread(d *websocket.Dialer, wg *sync.WaitGroup, l *sync.Mutex) {
	defer wg.Done()

	/// Opening connection with websocket server
	conn, _, err := d.Dial("wss://localhost:4433/websockets/test", nil)

	if err != nil {
		log.Printf("An error occurred while opening websocket: %s", err.Error())
		return
	}

	result := ""
	loremIpsum, errLoremIpsum := getLoremIpsum()

	if errLoremIpsum != nil {
		log.Printf("An error occurred while preparing request: %s", errLoremIpsum)
	}

	for i := 0; i < streamQty; i++ {
		before := time.Now()
		/// Writing request message to websocket server
		wrErr := conn.WriteMessage(websocket.TextMessage, loremIpsum)
		if wrErr != nil {
			log.Printf("An error occurred while opening websocket: %s", err.Error())
			return
		}

		/// Reading response message from websocket server
		_, _, rdErr := conn.ReadMessage()
		after := time.Now()
		if rdErr != nil {
			log.Printf("An error occurred while opening websocket: %s", rdErr.Error())
			return
		}

		result += fmt.Sprintf("Latency: %d\n", after.Sub(before).Microseconds())
	}

	/// Closing connection with the websocket server
	conn.Close()
	l.Lock()
	/// Writing result into log file
	writeResult(result, "websocket.multistream.results.log")
	l.Unlock()
}

func TestMultiStreamSingleClientWebSocket(d *websocket.Dialer) {

	var wg sync.WaitGroup
	var l sync.Mutex

	wg.Add(processQty)
	for i := 0; i < processQty; i++ {
		go multiSocketThread(d, &wg, &l)
	}

	wg.Wait()
}
