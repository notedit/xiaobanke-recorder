import { ipcRenderer, remote} from "electron";
import { clearTimeout, setInterval } from "timers";
import  Logger from "./logger";

window.localStorage.setItem("debug", "*");

declare var MediaRecorder: any;

const log = new Logger();

let localStream: MediaStream;
let recordedChunks: any[] = [];
let recordedBlob: Blob;
let numRecordedChunks: number = 0;
let recorder: any;
let includeAudio: boolean = true;
let isStarted: boolean = false;

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#record-start").addEventListener("click", recordStart);
    document.querySelector("#micro-audio").addEventListener("click", toggleAudio);
    document.querySelector("#set-btn").addEventListener("click", toggleSet);
    document.querySelector("#record-stop").addEventListener("click", () => {
        stopRecording();
        download();
    });
    // document.querySelector('#download-button').addEventListener('click', download)
    log.debug("loaded");
});

function toggleAudio() {
    const oTip = document.getElementById("micro-tip");
    if (this.parentNode.className.indexOf("no-include") !== -1) { // 包含音频
        this.parentNode.className = "option-item fr";
        oTip.innerHTML = "包含声音";
        includeAudio = true;
    } else {
        this.parentNode.className = "option-item fr no-include";
        oTip.innerHTML = "不包含声音";
        includeAudio = false;
    }
}

const toggleSet = () => {
    const setBox = document.getElementById("set-box");
    setBox.style.display = setBox.style.display === "none" ? "block" : "none";
};

const recordStart = () => {
    if (isStarted) {
        log.debug("already started, return");
        return;
    }
    cleanRecord();
    ipcRenderer.send("show-picker", {types: ["window", "screen"]});
};

const stopRecording = () => {
    if (!isStarted) {
        log.debug("is not started yet, return");
        return;
    }
    isStarted = false;
    if (recorder) {
        recorder.stop();
        const oActionBox = document.getElementById("action-box");
        const oRecordingBox = document.getElementById("recording-box");
        oActionBox.style.display = "block";
        oRecordingBox.style.display = "none";
        clearInterval(timer);
    }
    if (localStream) {
        if (localStream.getVideoTracks().length > 0) {
            localStream.getVideoTracks()[0].stop();
        }
        if (localStream.getAudioTracks().length > 0) {
            localStream.getAudioTracks()[0].stop();
        }
    }
};

const download =  () => {
    log.debug("download");
    const blob = new Blob(recordedChunks, {type: "video/webm"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.hidden = true;
    a.href = url;
    a.download = "xiaobanke-recorder.webm";
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
};

const cleanRecord = () => {
  recordedChunks = [];
  numRecordedChunks = 0;
};

let timer = null;
const recording = () => {
    const oActionBox = document.getElementById("action-box");
    const oRecordingBox = document.getElementById("recording-box");
    const oTimeBox = document.getElementById("recording-time");
    oActionBox.style.display = "none";
    oRecordingBox.style.display = "block";
    let i = 0;
    function setTime() {
        i++;
        oTimeBox.innerHTML = secondToDate(i);
        clearTimeout(timer);
        timer = setTimeout(() => {
            setTime();
        }, 1000);
    }
    setTime();
};

function secondToDate(result) {
    const h = Math.floor(result / 3600);
    const m = Math.floor((result / 60 % 60));
    const s = Math.floor((result % 60));
    return result = todouble(h) + ":" + todouble(m) + ":" + todouble(s);
}
function todouble(num) {
    return num < 10 ? "0" + num : "" + num;
}

ipcRenderer.on("source-id-selected", (event, sourceId: string) => {
    log.debug("source-id-selected ", sourceId);
    onSourceSlected(sourceId);
    recording();
    isStarted = true;
});

const recorderOnDataAvailable = (event) => {

    log.debug("ondataavailable");
    if (event.data && event.data.size > 0) {
        log.debug("recorderOnDataAvailable ", event.data.size);
        recordedChunks.push(event.data);
        numRecordedChunks += event.data.byteLength;
    }
};

const onSourceSlected = async (sourceId: string): Promise<any> => {
    log.debug("sourceId: " + sourceId);
    if (!sourceId) {
        log.debug("Access rejected.");
        return;
    }

    let stream: MediaStream;
    try {
        stream = await (navigator as any).mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: sourceId,
                    maxWidth: 1280,
                    maxHeight: 720,
                    },
            },
        });
    } catch (error) {
        log.error("getUserMedia error ", error);
        return;
    }

    localStream = stream;
    if (includeAudio) {
        log.debug("add audio track");
        const audioStream: MediaStream = await (navigator as any).mediaDevices.getUserMedia({audio: true, video: false});
        localStream.addTrack(audioStream.getAudioTracks()[0]);
    }

    let mimeType = "video/webm";
    if (MediaRecorder.isTypeSupported("video/webm;codecs=h264")) {
        mimeType = "video/webm;codecs=h264";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8";
	}

    const option = {mimeType};
    try {
        recorder = new MediaRecorder(stream, option);
    } catch (err) {
        log.debug("mediarecorder ", err);
        return;
    }

    log.debug("mimeType ", recorder.mimeType);
    recorder.ondataavailable = recorderOnDataAvailable;

    recorder.onstop = () => {
        log.debug("recorder stop");
    };
    recorder.start();
    log.debug("recorder start");
    return;
};
