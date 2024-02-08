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

	latencyResult := ""
	throughputResult := ""
	reader := bufio.NewReader(bistream)

	loremIpsum, errLoremIpsum := getLoremIpsum()
	if errLoremIpsum != nil {
		log.Printf("An error occurred while preparing request: %s", errLoremIpsum)
	}

	for i := 0; i < streamQty; i++ {

		before := time.Now()

		/// Writing request message to webtransport server
		dataSize := len(loremIpsum)
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

		latencyResult += fmt.Sprintf("Latency: %d\n", after.Sub(before).Microseconds())
		throughputResult += fmt.Sprintf("Throughput: %f\n", float64(dataSize)/float64(after.Sub(before).Microseconds()))
	}

	/// Closing stream with the webtransport server
	bistream.Close()
	/// Writing result into log file
	writeResult(latencyResult, "webtransport.singlestream.latency.results.log")
	writeResult(throughputResult, "webtransport.singlestream.throughput.results.log")
}

/*---------------------------------------------------------------------------------------------------------------------------------------------*/

func multiStreamThread(stream webtransport.Stream, reader bufio.Reader, index int, wg *sync.WaitGroup, l *sync.Mutex) {
	defer wg.Done()
	latencyResult := ""
	throughputResult := ""
	loremIpsum, errLoremIpsum := getLoremIpsum()
	if errLoremIpsum != nil {
		log.Printf("An error occurred while preparing request: %s", errLoremIpsum)
	}

	for i := 0; i < streamQty; i++ {
		before := time.Now()

		/// Writing request message to webtransport server
		dataSize := len(loremIpsum)
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

		latencyResult += fmt.Sprintf("Latency: %d\n", after.Sub(before).Microseconds())
		throughputResult += fmt.Sprintf("Throughput: %f\n", float64(dataSize)/float64(after.Sub(before).Microseconds()))
	}
	/// Closing stream with the webtransport server
	stream.Close()

	l.Lock()
	/// Writing result into log file
	writeResult(latencyResult, "webtransport.multistream.latency.results.log")
	writeResult(throughputResult, "webtransport.multistream.throughput.results.log")
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

	latencyResult := ""
	throughputResult := ""

	loremIpsum, errLoremIpsum := getLoremIpsum()

	if errLoremIpsum != nil {
		log.Printf("An error occurred while preparing request: %s", errLoremIpsum)
	}

	for i := 0; i < streamQty; i++ {
		before := time.Now()
		/// Writing request message to websocket server
		dataSize := len(loremIpsum)
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

		latencyResult += fmt.Sprintf("Latency: %d\n", after.Sub(before).Microseconds())
		throughputResult += fmt.Sprintf("Throughput: %f\n", float64(dataSize)/float64(after.Sub(before).Microseconds()))
	}
	/// Closing connection with the websocket server
	conn.Close()
	/// Writing result into log file
	writeResult(latencyResult, "websockets.singlestream.latency.results.log")
	writeResult(throughputResult, "websockets.singlestream.throughput.results.log")
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

	latencyResult := ""
	throughputResult := ""
	loremIpsum, errLoremIpsum := getLoremIpsum()

	if errLoremIpsum != nil {
		log.Printf("An error occurred while preparing request: %s", errLoremIpsum)
	}

	for i := 0; i < streamQty; i++ {
		before := time.Now()
		/// Writing request message to websocket server
		dataSize := len(loremIpsum)
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

		latencyResult += fmt.Sprintf("Latency: %d\n", after.Sub(before).Microseconds())
		throughputResult += fmt.Sprintf("Throughput: %f\n", float64(dataSize)/float64(after.Sub(before).Microseconds()))
	}

	/// Closing connection with the websocket server
	conn.Close()
	l.Lock()
	/// Writing result into log file
	writeResult(latencyResult, "websockets.multistream.latency.results.log")
	writeResult(throughputResult, "websockets.multistream.throughput.results.log")
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
