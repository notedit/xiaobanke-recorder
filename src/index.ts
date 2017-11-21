import { ipcRenderer,remote} from 'electron'
import  Logger from './logger'


window.localStorage.setItem('debug', '*')

declare var MediaRecorder: any 

const log = new Logger()

let localStream:MediaStream
let recordedChunks:any[] = [] 
let recordedBlob:Blob
let numRecordedChunks:number= 0
let recorder:any
let includeAudio:boolean = true
let isStarted:boolean = false

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#record-desktop').addEventListener('click', recordDesktop)
    document.querySelector('#record-window').addEventListener('click', recordWindow)
    document.querySelector('#record-stop').addEventListener('click', stopRecording)
    document.querySelector('#download-button').addEventListener('click', download)
    log.debug('loaded')
})



const recordDesktop = () => {
    if(isStarted){
        log.debug('already started, return')
        return
    }
    cleanRecord()
    ipcRenderer.send('show-picker',{types:['screen']})
}

const recordWindow = () => {
    if(isStarted){
        log.debug('already started, return')
        return
    }
    cleanRecord()
    ipcRenderer.send('show-picker', {types:['window']})
}

const stopRecording = () => {
    if(!isStarted){
        log.debug('is not started yet, return')
        return
    }
    isStarted = false
    if(recorder){
        recorder.stop()
    }
    if(localStream){
        if(localStream.getVideoTracks().length > 0){
            localStream.getVideoTracks()[0].stop()
        }
        if(localStream.getAudioTracks().length > 0){
            localStream.getAudioTracks()[0].stop()
        }
    }
}

const download =  () => {
    
    log.debug('download')
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
    log.debug('source-id-selected ', sourceId)
    onSourceSlected(sourceId)
    isStarted = true
})


const recorderOnDataAvailable = (event) => {
    
    log.debug('ondataavailable')
    if(event.data && event.data.size > 0){
        log.debug('recorderOnDataAvailable ',event.data.size)
        recordedChunks.push(event.data)
        numRecordedChunks += event.data.byteLength
    }
}


const onSourceSlected = async (sourceId:string):Promise<any> => {
    log.debug('sourceId: ' + sourceId)
    if (!sourceId) {
        log.debug('Access rejected.')
        return
    }

    let stream:MediaStream 
    try {
        stream = await (navigator as any).mediaDevices.getUserMedia({
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
    } catch (error) {
        log.error('getUserMedia error ', error)
        return
    }
    
    localStream = stream 
    if(includeAudio){
        log.debug('add audio track')
        let audioStream:MediaStream = await (navigator as any).mediaDevices.getUserMedia({audio:true,video:false})
        localStream.addTrack(audioStream.getAudioTracks()[0])
    }

    let mimeType = 'video/webm'
    if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        mimeType = 'video/webm;codecs=h264'
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8'
	}

    let option = {mimeType:mimeType}
    try{
        recorder = new MediaRecorder(stream,option)
    } catch(err) {
        log.debug('mediarecorder ',err)
        return
    }

    log.debug('mimeType ', recorder.mimeType)
    recorder.ondataavailable = recorderOnDataAvailable 

    recorder.onstop = () => {
        log.debug('recorder stop')
    }
    recorder.start()
    log.debug('recorder start')
    return
}


