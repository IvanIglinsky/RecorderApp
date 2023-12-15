import React, { useState, useRef, useEffect } from 'react';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
const AudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);
    const [recordedAudioBlobAll, setRecordedAudioBlobAll] = useState(null);
    const [recordedAudioBlobVoice, setRecordedAudioBlobVoice] = useState(null);
    const [recordedAudioURLVoice, setRecordedAudioURLVoice] = useState(null);

    const timerRef = useRef(null);
    const mediaRecorderRefAll = useRef(null);
    const mediaRecorderRefVoice = useRef(null);

    const soundMeter = async () => {
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.log("Web Audio API is not supported by this browser");
            return;
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            const chunksAll = [];
            const chunksVoice = [];
            let isRecordingAllowed = false;

            scriptProcessor.onaudioprocess = function (event) {
                const inputBuffer = event.inputBuffer.getChannelData(0);
                const sum = inputBuffer.reduce((acc, val) => acc + val ** 2, 0);
                const rms = Math.sqrt(sum / inputBuffer.length);
                const dB = 20 * Math.log10(rms);

                chunksAll.push(new Float32Array(inputBuffer));

                if (isRecordingAllowed) {
                    chunksVoice.push(new Float32Array(inputBuffer));
                }

                if (dB > -30 && !isRecordingAllowed) {
                    isRecordingAllowed = true;
                } else if (dB <= -30 && isRecordingAllowed) {
                    isRecordingAllowed = false;
                }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            const mediaRecorderAll = new MediaRecorder(stream);
            mediaRecorderAll.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    const blob = new Blob(chunksAll, { type: 'audio/mp3' });
                    setRecordedAudioBlobAll(blob);
                }
            };

            const mediaRecorderVoice = new MediaRecorder(stream);
            mediaRecorderVoice.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    const blob = new Blob(chunksVoice, { type: 'audio/mp3' });
                    setRecordedAudioBlobVoice(blob);
                }
            };

            mediaRecorderAll.onstop = mediaRecorderVoice.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRefAll.current = mediaRecorderAll;
            mediaRecorderRefVoice.current = mediaRecorderVoice;
            mediaRecorderAll.start();
            mediaRecorderVoice.start();
        } catch (error) {
            console.log("Error accessing the microphone:", error);
        }
    };

    const startRecording = async () => {
        if (mediaRecorderRefAll.current || mediaRecorderRefVoice.current) {
            console.error('Recording is already in progress');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioTrack = stream.getAudioTracks()[0];

            const mediaRecorderAll = new MediaRecorder(stream);
            const mediaRecorderVoice = new MediaRecorder(stream);

            mediaRecorderAll.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedAudioBlobAll(event.data);
                }
            };

            mediaRecorderVoice.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedAudioBlobVoice(event.data);
                }
            };

            mediaRecorderAll.onstop = mediaRecorderVoice.onstop = () => {
                audioTrack.stop();
            };

            setIsRecording(true);
            mediaRecorderRefAll.current = mediaRecorderAll;
            mediaRecorderRefVoice.current = mediaRecorderVoice;
            mediaRecorderAll.start();
            mediaRecorderVoice.start();
            await soundMeter();
            timerRef.current = setInterval(() => {
                setTimer((prevTimer) => prevTimer + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing the microphone or starting recording:', error);
        }
    };

    const stopRecording = async () => {
        if( mediaRecorderRefAll.current && mediaRecorderRefAll.current.state === 'recording' ) {
            mediaRecorderRefAll.current.stop ();
        }

        if( mediaRecorderRefVoice.current && mediaRecorderRefVoice.current.state === 'recording' ) {
            mediaRecorderRefVoice.current.stop ();
        }
        const storage = getStorage ();
        const currentDateTime = new Date ();
        const formattedDateTime = currentDateTime.toISOString ().replace ( /[\W_]+/g , '' );
        const audioRef = ref ( storage , `react-audio/audio_${formattedDateTime}.mp3` );
        await uploadBytes ( audioRef , recordedAudioBlobVoice );
        setIsRecording ( false );
        clearInterval ( timerRef.current );
        setTimer ( 0 );
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const downloadRecordedAudioAll = () => {
        if (recordedAudioBlobAll) {
            const url = URL.createObjectURL(recordedAudioBlobAll);

            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            a.download = 'recorded_audio_all.mp3';
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('Recorded all audio downloaded successfully!');
        } else {
            console.error('No recorded all audio blob to download');
        }
    };

    const downloadRecordedAudioVoice = () => {
        if (recordedAudioBlobVoice) {
            const url = URL.createObjectURL(recordedAudioBlobVoice);
            setRecordedAudioURLVoice(url);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            a.download = 'recorded_audio_voice.mp3';
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('Recorded voice audio downloaded successfully!');
        } else {
            console.error('No recorded voice audio blob to download');
        }
    };

    return (
        <div>
            <h3>Press start to record</h3>
            <button
                className={`StartStopBtn ${isRecording ? 'StopBtn' : ''}`}
                onClick={toggleRecording}
            >
                {isRecording ? 'Stop' : 'Start'}
            </button>
            {isRecording && <p>Timer: {timer} seconds</p>}

            <div>
                {recordedAudioBlobAll ?
                <button className="DownloadBtn" onClick={downloadRecordedAudioAll}>
                    Download All Audio
                </button>
                    :''}<br></br>
                {recordedAudioBlobVoice ?
                <button className="DownloadBtn" onClick={downloadRecordedAudioVoice}>
                    Download Voice Audio
                </button>
                :''}<br/>
                {recordedAudioURLVoice && (
                    <div>
                        <audio controls src={recordedAudioURLVoice}></audio>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioRecorder;
