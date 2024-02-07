let ws = null
let WSBefore = null
let WSAfter = null

let transport;
let WTBefore = null
let WTAfter = null

let WSData = []
let WTData = []

let size
var chart

const WSMessageToServer = document.getElementById("WSMessageToServer")
const WSConnectionStatusString = document.getElementById("WSConnectionStatus")
const WSErrorBox = document.getElementById("WSErrors")
const WSServerResponseBox = document.getElementById("WSMessageFromServer")

const WTMessageToServer = document.getElementById("WTMessageToServer")
const WTConnectionStatusString = document.getElementById("WTConnectionStatus")
const WTErrorBox = document.getElementById("WTErrors")
const WTServerResponseBox = document.getElementById("WTMessageFromServer")


function WSConnect(){
    ws = new WebSocket("wss://localhost:443")

    if(ws == null){
        WSErrorBox.value = "An error occurred while opening websocket with the server!"
        console.log("Connection closed")
        WSConnectionStatusString.innerHTML = 'Not connected'
        WSConnectionStatusString.style.color = 'red'
        return
    }

    ws.onopen = (ev) => {
        console.log('WebSocket is ready')
        WSConnectionStatusString.innerHTML = 'Connected'
        WSConnectionStatusString.style.color = 'green'
    }

    ws.onmessage = (ev) => {
        WSServerResponseBox.value = ev.data
        WSAfter = new Date().getTime()
        console.log(`Latency: ${WSAfter-WSBefore} ms`)
        WSData.push(WSAfter-WSBefore)
        WSClearMessage()
    }

    ws.onclose = (_) => {
        console.log("WebSocket chiusa")
        WSConnectionStatusString.innerHTML = 'Not connected'
        WSConnectionStatusString.style.color = 'red'
    }

}

function WSDisconnect(){
    ws.close()
    WSConnectionStatusString.innerHTML = 'Not connected'
    WSConnectionStatusString.style.color = 'red'
    window.postMessage(['WS', ...WSData], '*');
    WSClearMessage()
}

function WSSendToServer(){
    const data = WSMessageToServer.value
    if(data == null || data == ''){
      WSErrorBox.value += 'Message cannot be null'
      return
    }
    
    if(WSConnectionStatusString.innerHTML == 'Not connected'){
      WSErrorBox.value += 'Cannot send data because no connection were open\n'
      return
    }

    WSBefore = new Date().getTime()
    ws.send(data)
    
}


function WSClearMessage(){
  WSMessageToServer.value = ''
}

function WSClearErrors(){
  WSErrorBox.value = ''
}

function WTConnect(){

  const args = { hostname: '127.0.0.1', port: 8080 }
  const hashes = {
    serverCertificateHashes: [
      {
        algorithm: 'sha-256',
        value:
          ''//Insert here certificate fingerprint
      }
    ]
  }


  const url = 'https://' + args.hostname + ':' + args.port + '/webtransport/test'
  console.log('Starting connection...')
  const hashargs = {
    ...hashes,
    serverCertificateHashes: hashes.serverCertificateHashes.map((el) => ({
      algorithm: el.algorithm,
      value: buffer.Buffer.from(el.value.split(':').map((el) => parseInt(el, 16)))
    }))
  }
  transport = new WebTransport(url, hashargs)
  const waitForClosure = async () => {
    await transport.closed
    console.log("Connection closed")
    WTConnectionStatusString.innerHTML = 'Not connected'
    WTConnectionStatusString.style.color = 'red'
  }

  waitForClosure()

  transport.ready.then(() => {
    console.log('WebTransport connection is ready')
    WTConnectionStatusString.innerHTML = 'Connected'
    WTConnectionStatusString.style.color = 'green'
  }).catch((err) => {
    console.error(`An error occurred while connecting to server: ${err}`)
    WTErrorBox.value += `An error occurred while connecting to server: ${err}\n`
  })
  
}

function WTDisconnect(){
  closeConnection(transport)
  WTConnectionStatusString.innerHTML = 'Not connected'
  WTConnectionStatusString.style.color = 'red'
  window.postMessage(['WT', ...WTData], '*');
  WTClearMessage()
}


function WTSendToServer(){
  const data = WTMessageToServer.value
  if(data == null || data == ''){
    WTErrorBox.value += 'Message cannot be null'
    return
  }
  
  if(WTConnectionStatusString.innerHTML == 'Not connected'){
    WTErrorBox.value += 'Cannot send data because no connection were open\n'
    return
  }   
  
  transport.createBidirectionalStream().then(async (value) => {
    WTBefore = new Date().getTime()
    await writeOnOutgoingStream(value.writable, data)
    const resp = new TextDecoder().decode(await readData(value.readable))
    WTAfter = new Date().getTime()
    console.log(`Latency: ${WTAfter-WTBefore} ms`)
    WTData.push(WTAfter-WTBefore)
    console.log(resp)
    WTServerResponseBox.value = resp
    WTClearMessage()
  }).catch((err) => {
    console.error(`An error occurred while writing data to server: ${err}`)
    WTErrorBox.value += `An error occurred while writing data to server: ${err}\n`
  })
}

function WTClearMessage(){
  WTMessageToServer.value = ''
}

function WTClearErrors(){
  WTErrorBox.value = ''
}

function StatsCompute(){
    const maxWSLatency = size <= 0 ? 0 : Math.max(...WSData).toFixed(2)
    const maxWTLatency = size <= 0 ? 0 : Math.max(...WTData).toFixed(2)
    const minWSLatency = size <= 0 ? 0 : Math.min(...WSData).toFixed(2)
    const minWTLatency = size <= 0 ? 0 : Math.min(...WTData).toFixed(2)

    let sumPerc = 0
    let maxPercDiff = 0
    for(var i = 0; i < size; i++){
        sumPerc += (WSData[i] - WTData[i])/WTData[i]
        if(WSData[i] - WTData[i] > maxPercDiff) maxPercDiff = WSData[i] - WTData[i]
    }

    const avgPercentageLatencyDiff = size <= 0 ? 0 : (sumPerc/size).toFixed(2)

    document.querySelector('#maxWSLatency').innerHTML = maxWSLatency + ' ms'
    document.querySelector('#maxWTLatency').innerHTML = maxWTLatency + ' ms'
    document.querySelector('#minWSLatency').innerHTML = minWSLatency + ' ms'
    document.querySelector('#minWTLatency').innerHTML = minWTLatency + ' ms'
    document.querySelector('#avgPercLatencyDiff').innerHTML = avgPercentageLatencyDiff + ' %'
    document.querySelector('#maxPercLatencyDiff').innerHTML = maxPercDiff + ' %'
}


function StatsErase(){
    WSData = []
    WTData = []
    chart.updateSeries(
        [
            {
                data: WTData
            },
            {
                data: WSData
            }
        ]
    )

    size = 0
    StatsCompute()
}

function StatsRefresh(){
  chart.updateSeries(
    [
        {
            data: WTData
        },
        {
            data: WSData
        }
    ]
  )

  size = Math.max(WTData.length, WSData.length)
  StatsCompute()
}


function load(){
  changePage(0)
  WTConnectionStatusString.innerHTML = 'Not connected'
  WTConnectionStatusString.style.color = 'red'

  WSConnectionStatusString.innerHTML = 'Not connected'
  WSConnectionStatusString.style.color = 'red'

  const range = []
  size = Math.max(WTData.length, WSData.length)

  for(var i = 1; i <= size; i++){
      range.push(i.toString())
  }

  var options = {
          series: [{
          name: 'WebTransport',
          data: WTData
      },
      {
          name: 'WebSockets',
          data: WSData
      }
    ],
      chart: {
      type: 'area',
      stacked: false,
      height: 350,
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        autoSelected: 'zoom'
      }
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 0,
    },
    title: {
      text: 'Latency',
      align: 'left'
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100]
      },
    },
    yaxis: {
      title: {
        text: 'Latency (ms)'
      },
    },
    xaxis: {
      title: {
          text: 'Batch number'
      },
      categories: range
    },
    tooltip: {
      shared: false,
    }
  };

  chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();
  StatsCompute()
}


function changePage(v){
  let cnt = 0
  const blocks = document.querySelectorAll(".block")

  for(var i = 0; i < blocks.length; i++){
    if(i == v) {
      blocks[i].style.display = 'block'
      size = Math.max(WTData.length, WSData.length)
      StatsCompute()
    }
    else{
      blocks[i].style.display = 'none'
      document.querySelectorAll(".goto")[cnt].innerHTML = "Go to " + blocks[i].id
      document.querySelectorAll(".goto")[cnt].id = i
      cnt++
    }
  }

}