let ws = null
let WSBefore = null
let WSAfter = null
let WSDataSize = null

let transport;
let WTBefore = null
let WTAfter = null
let WTDataSize = null

let WSLatencyData = []
let WTLatencyData = []

let WSThroughputData = []
let WTThroughputData = []

let size
var latencyChart
var throughputChart

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
        console.log(`Latency: ${WSAfter.toFixed(2)-WSBefore.toFixed(2)} ms`)
        WSLatencyData.push((WSAfter.toFixed(2)-WSBefore.toFixed(2)))
        WSThroughputData.push((WSDataSize/(WSAfter-WSBefore)).toFixed(2))
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

    WSDataSize = data.length
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
    WTDataSize = data.length
    WTBefore = new Date().getTime()
    await writeOnOutgoingStream(value.writable, data)
    const resp = new TextDecoder().decode(await readData(value.readable))
    WTAfter = new Date().getTime()
    console.log(`Latency: ${WTAfter.toFixed(2)-WTBefore.toFixed(2)} ms`)
    WTLatencyData.push((WTAfter.toFixed(2)-WTBefore.toFixed(2)))
    WTThroughputData.push((WTDataSize/(WTAfter-WTBefore)).toFixed(2))
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
    const maxWSLatency = size <= 0 ? 0 : Math.max(...WSLatencyData).toFixed(2)
    const maxWTLatency = size <= 0 ? 0 : Math.max(...WTLatencyData).toFixed(2)
    const minWSLatency = size <= 0 ? 0 : Math.min(...WSLatencyData).toFixed(2)
    const minWTLatency = size <= 0 ? 0 : Math.min(...WTLatencyData).toFixed(2)

    const maxWSThroughput = size <= 0 ? 0 : Math.max(...WSThroughputData).toFixed(2)
    const maxWTThroughput = size <= 0 ? 0 : Math.max(...WTThroughputData).toFixed(2)
    const minWSThroughput = size <= 0 ? 0 : Math.min(...WSThroughputData).toFixed(2)
    const minWTThroughput = size <= 0 ? 0 : Math.min(...WTThroughputData).toFixed(2)

    let sumPerc = 0
    let maxPercDiff = 0
    for(var i = 0; i < size; i++){
        sumPerc += (Math.abs(WSLatencyData[i] - WTLatencyData[i]))/WTLatencyData[i]
        if(Math.abs(WSLatencyData[i] - WTLatencyData[i]) > maxPercDiff) maxPercDiff = Math.abs(WSLatencyData[i] - WTLatencyData[i])
    }

    const maxPercentageLatencyDiff = maxPercDiff.toFixed(2)
    const avgPercentageLatencyDiff = size <= 0 ? 0 : (sumPerc/size).toFixed(2)

    sumPerc = 0
    maxPercDiff = 0
    for(var i = 0; i < size; i++){
        sumPerc += (Math.abs(WSThroughputData[i] - WTThroughputData[i]))/WTThroughputData[i]
        if(Math.abs(WSThroughputData[i] - WTThroughputData[i]) > maxPercDiff) maxPercDiff = Math.abs(WSThroughputData[i] - WTThroughputData[i])
    }

    const maxPercentageThroughputDiff = maxPercDiff.toFixed(2)
    const avgPercentageThroughputDiff = size <= 0 ? 0 : (sumPerc/size).toFixed(2)

    

    document.querySelector('#maxWSLatency').innerHTML = maxWSLatency + ' ms'
    document.querySelector('#maxWTLatency').innerHTML = maxWTLatency + ' ms'
    document.querySelector('#minWSLatency').innerHTML = minWSLatency + ' ms'
    document.querySelector('#minWTLatency').innerHTML = minWTLatency + ' ms'
    document.querySelector('#avgPercLatencyDiff').innerHTML = avgPercentageLatencyDiff + ' %'
    document.querySelector('#maxPercLatencyDiff').innerHTML = maxPercentageLatencyDiff + ' ms'

    document.querySelector('#maxWSThroughput').innerHTML = maxWSThroughput + ' b/ms'
    document.querySelector('#maxWTThroughput').innerHTML = maxWTThroughput + ' b/ms'
    document.querySelector('#minWSThroughput').innerHTML = minWSThroughput + ' b/ms'
    document.querySelector('#minWTThroughput').innerHTML = minWTThroughput + ' b/ms'
    document.querySelector('#avgPercThroughputDiff').innerHTML = avgPercentageThroughputDiff + ' %'
    document.querySelector('#maxPercThroughputDiff').innerHTML = maxPercentageThroughputDiff + ' b/ms'
}


function StatsErase(){
    WSLatencyData = []
    WTLatencyData = []
    WSThroughputData = []
    WTThroughputData = []
    latencyChart.updateSeries(
        [
            {
                data: WTLatencyData
            },
            {
                data: WSLatencyData
            }
        ]
    )

    throughputChart.updateSeries(
      [
          {
              data: WTThroughputData
          },
          {
              data: WSThroughputData
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
            data: WTLatencyData
        },
        {
            data: WSLatencyData
        }
    ]
  )

  size = Math.max(WTLatencyData.length, WSLatencyData.length)
  StatsCompute()
}


function load(){
  changePage(0)
  WTConnectionStatusString.innerHTML = 'Not connected'
  WTConnectionStatusString.style.color = 'red'

  WSConnectionStatusString.innerHTML = 'Not connected'
  WSConnectionStatusString.style.color = 'red'

  const range = []
  size = Math.max(WTLatencyData.length, WSLatencyData.length)

  for(var i = 1; i <= size; i++){
      range.push(i.toString())
  }

  var latencyOptions = {
          series: [{
          name: 'WebTransport',
          data: WTLatencyData
      },
      {
          name: 'WebSockets',
          data: WSLatencyData
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

  var throughputOptions = {
          series: [{
          name: 'WebTransport',
          data: WTThroughputData
      },
      {
          name: 'WebSockets',
          data: WSThroughputData
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
      text: 'Throughput',
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
        text: 'Throughput (b/ms)'
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

  latencyChart = new ApexCharts(document.querySelector("#latencyChart"), latencyOptions);
  throughputChart = new ApexCharts(document.querySelector("#throughputChart"), throughputOptions);

  latencyChart.render();
  throughputChart.render()
  StatsCompute()
}


function changePage(v){
  let cnt = 0
  const blocks = document.querySelectorAll(".block")

  for(var i = 0; i < blocks.length; i++){
    if(i == v) {
      blocks[i].style.display = 'block'
      size = Math.max(WTLatencyData.length, WSLatencyData.length)
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