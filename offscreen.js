// Your live Cloud URL with Secure WebSockets and translation endpoint
const SERVER_URL = "wss://freelangx-backend.onrender.com/ws/translate";

let socket;
let mediaRecorder;
let audioContext = new AudioContext();
let currentStream = null;

let audioQueue = [];
let isPlaying = false;
let currentSource = null;
let pendingText = ""; // Holds text until the audio arrives

let vadInterval;
let silenceTimer;
let analyser;
let dataArray;

async function playNextInQueue() {
    if (audioQueue.length === 0) {
        isPlaying = false;
        // PERFECT SYNC: Clear subtitles exactly when audio queue finishes
        chrome.runtime.sendMessage({ target: 'background', type: 'FORWARD_SUBTITLE', text: '' });
        return;
    }
    
    isPlaying = true;
    const item = audioQueue.shift();
    
    // PERFECT SYNC: Show subtitle exactly when this specific audio chunk starts
    if (item.text) {
        chrome.runtime.sendMessage({ target: 'background', type: 'FORWARD_SUBTITLE', text: item.text });
    }
    
    try {
        const audioBuffer = await audioContext.decodeAudioData(item.buffer);
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        currentSource.connect(audioContext.destination);
        
        currentSource.start();
        
        const blendTimeMs = (audioBuffer.duration * 1000) - 300; 
        const waitTime = blendTimeMs > 0 ? blendTimeMs : audioBuffer.duration * 1000;

        setTimeout(() => {
            currentSource = null;
            playNextInQueue(); 
        }, waitTime);
        
    } catch (e) {
        console.error("Audio decode error:", e);
        playNextInQueue();
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'offscreen') return;

    if (message.type === 'START_CAPTURE') {
        startAudioCapture(message.streamId, message.language);
    } else if (message.type === 'STOP_CAPTURE') {
        stopAudioCapture();
    }
});

async function startAudioCapture(streamId, targetLanguage) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            }
        });
        
        currentStream = stream;

        const wsUrl = `${SERVER_URL}?lang=${targetLanguage}`;
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("Connected to Cloud Translation server.");
            
            const vadCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = vadCtx.createMediaStreamSource(stream);
            analyser = vadCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                    socket.send(event.data);
                }
            };
            
            mediaRecorder.start(); 
            let recordingStartTime = Date.now();

            vadInterval = setInterval(() => {
                if (!analyser || mediaRecorder.state !== 'recording') return;
                
                analyser.getByteFrequencyData(dataArray);
                let isCurrentlySpeaking = dataArray.some(value => value > 35); 
                
                if (isCurrentlySpeaking) {
                    if (silenceTimer) {
                        clearTimeout(silenceTimer);
                        silenceTimer = null;
                    }
                } else {
                    if (!silenceTimer && (Date.now() - recordingStartTime > 1000)) {
                        silenceTimer = setTimeout(() => {
                            if (mediaRecorder.state === 'recording') {
                                mediaRecorder.stop();
                                mediaRecorder.start();
                                recordingStartTime = Date.now();
                            }
                            silenceTimer = null;
                        }, 1200); 
                    }
                }
                
                // Keep chunk safe under 4 seconds for the free cloud tier
                if (Date.now() - recordingStartTime > 4000) {
                    if (silenceTimer) clearTimeout(silenceTimer);
                    silenceTimer = null;
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                        mediaRecorder.start();
                        recordingStartTime = Date.now();
                    }
                }
            }, 100); 
        };

        socket.onmessage = async (event) => {
            try {
                if (typeof event.data === 'string') {
                    pendingText = event.data;
                    return;
                }
                
                const arrayBuffer = await event.data.arrayBuffer();
                audioQueue.push({
                    buffer: arrayBuffer,
                    text: pendingText
                });
                
                pendingText = "";
                
                if (!isPlaying) {
                    playNextInQueue();
                }
            } catch (e) {
                console.error("Error decoding received translated audio:", e);
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };

    } catch (err) {
        console.error("Error accessing tab audio:", err);
    }
}

function stopAudioCapture() {
    if (vadInterval) clearInterval(vadInterval);
    if (silenceTimer) clearTimeout(silenceTimer);
    analyser = null;

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (socket) {
        socket.close();
    }
    
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    audioQueue = [];
    if (currentSource) {
        try { currentSource.stop(); } catch(e) {}
        currentSource = null;
    }
    isPlaying = false;
    pendingText = "";
    
    chrome.runtime.sendMessage({ target: 'background', type: 'FORWARD_SUBTITLE', text: '' });
}