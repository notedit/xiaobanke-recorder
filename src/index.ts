import { ipcRenderer,remote} from 'electron'
import * as Debug from 'debug'

const debug = Debug('recorder')

let localStream:MediaStream
let recordedChunks = []
let recordedBlob:Blob
let numRecordedChunks = 0
let recorder 
let includeAudio:boolean = true
let isStarted:boolean = false

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#record-desktop').addEventListener('click', recordDesktop)
    document.querySelector('#record-window').addEventListener('click', recordWindow)
    document.querySelector('#record-stop').addEventListener('click', stopRecording)
    document.querySelector('#download-button').addEventListener('click', download)
})

declare var MediaRecorder: any 

const recordDesktop = () => {
    if(isStarted){
        debug('already started, return')
        return
    }
    cleanRecord()
    isStarted = true
    ipcRenderer.send('show-picker',{types:['screen']})
}

const recordWindow = () => {
    if(isStarted){
        debug('already started, return')
        return
    }
    cleanRecord()
    isStarted = true
    ipcRenderer.send('show-picker', {types:['window']})
}

const stopRecording = () => {
    if(!isStarted){
        debug('is not started yet, return')
        return
    }
    if(recorder){
        recorder.stop()
    }
    if(localStream){
        localStream.stop()
    }
}

const download =  () => {
    
    debug('download')
    let blob = new Blob(recordedChunks, {type: 'video/webm'})
    let url = URL.createObjectURL(blob)
    let a = document.createElement('a')
    document.body.appendChild(a)
    a.hidden = true
    a.href = url
    a.download = 'xiaobanke-recorder.webm'
    a.click()
    setTimeout(function() {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }, 100)
}

const cleanRecord = () => {
  recordedChunks = []
  numRecordedChunks = 0
}

ipcRenderer.on('source-id-selected', (event, sourceId:string) => {
    debug('source-id-selected ', sourceId)
    onSourceSlected(sourceId)

})


const recorderOnDataAvailable = (event) => {
    if(event.data && event.data.size > 0){
        debug('recorderOnDataAvailable ',event.data.size)
        recordedChunks.push(event.data)
        numRecordedChunks += event.data.byteLength
    }
}


const onSourceSlected = async (sourceId:string):Promise<any> => {
    debug('sourceId: ' + sourceId)
    if (!sourceId) {
        debug('Access rejected.')
        return
    }

    let stream = await (navigator as any).webkitGetUserMedia({
        audio:false,
        video:{
            mandatory:{
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId,
                maxWidth:1280,
                maxHeight:720
                }
        }
    })
    
    localStream = stream 
    if(includeAudio){
        debug('add audio track')
        let audioStream:MediaStream = await (navigator as any).webkitGetUserMedia({audio:true,video:false})
        localStream.addTrack(audioStream.getAudioTracks()[0])
    }

    try{
        recorder = new MediaRecorder(stream)
    } catch(err) {
        debug('error ',err)
        return
    }

    if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        recorder.mimeType = 'video/webm;codecs=h264'
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        recorder.mimeType = 'video/webm;codecs=vp8'
	}

    recorder.ondataavailable = recorderOnDataAvailable
    recorder.onstop = () => {
        debug('recorder stop')
    }
    recorder.start()
    debug('recorder start')
    return
}


