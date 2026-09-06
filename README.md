🌍🎧 FreeLangX

Real-Time AI Audio Translation & Synchronized Subtitles

Bridge the global language barrier instantly. Stream any tab's audio, translate it via AI, and render Netflix-style synchronized subtitles in real-time.

🚀 Overview

FreeLangX is a full-stack browser extension designed to make global content universally accessible. Whether it's an educational lecture, a foreign film, or an international live stream, FreeLangX captures the browser's audio, routes it securely through a high-performance Python cloud backend, translates it into your target language, and renders stunning, frame-accurate visual subtitles right onto your screen.

✨ Key Features

Real-Time Tab Audio Capture: Leverages Chrome's tabCapture and Web Audio API to safely intercept audio cleanly without system-wide recording.

WebSocket Streaming Architecture: Maintains a lightning-fast, persistent two-way connection between the browser extension and the cloud server.

Perfect Audio & Subtitle Sync: Bundles subtitle text payloads with generated audio buffers to ensure zero drift between what you read and what you hear.

Netflix-Style Visual Overlays: Injects non-intrusive, high-contrast, professional-grade subtitle elements directly over web video players.

Cloud-Ready Infrastructure: Scalable FastAPI backend deployed on cloud infrastructure for 24/7 uptime.
👉 Note: The backend for this extension runs on a custom Python FastAPI cloud server. [Click here to view the Backend Source Code.
https://github.com/varshneydevansh21/freelangx-backend

🛠️ Tech Stack

Frontend (Browser Extension)

JavaScript (ES6+), HTML5, CSS3

Chrome Extensions Manifest V3, Web Audio API, WebSockets

Backend (Cloud Server)

FastAPI (Python) with Asynchronous WebSocket support

Pydub, SpeechRecognition

Translation Engine: Deep-Translator (Google/MyMemory Failover Pipelines)

Text-to-Speech (TTS): Edge-TTS (Neural voices for realistic synthesis)

📂 Project Architecture

manifest.json & background.js: Service worker handling tab routing and extension state.

offscreen.html/js: Hidden DOM environment for secure audio capture and WebSocket processing.

content.js: DOM injector for high-contrast visual subtitles.

server.py: Cloud Python backend hosting the AI translation pipeline.

⚙️ Installation & Setup

Clone the Repository: git clone https://github.com/your-username/FreeLangX.git

Load into Chrome: Go to chrome://extensions/, enable Developer mode, and select Load unpacked on the FreeLangX folder.

Run: Open a video, select your preferred language in the extension popup, and hit Start!

Created by DEVANSH VARSHNEY as a milestone full-stack project.
