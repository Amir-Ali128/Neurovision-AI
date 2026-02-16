let canvas = document.getElementById("brain");
let ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Neural network
const NEURON_COUNT = 120;
let neurons = [];
let connections = [];

for (let i = 0; i < NEURON_COUNT; i++) {
    neurons.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        activity: 0
    });
}

for (let i = 0; i < NEURON_COUNT; i++) {
    for (let j = i + 1; j < NEURON_COUNT; j++) {
        if (Math.random() < 0.04) {
            connections.push([i, j]);
        }
    }
}

// WASM
let wasmInstance = null;

async function loadWasm() {
    try {
        let response = await fetch("/static/neural_core.wasm");
        let bytes = await response.arrayBuffer();
        let wasm = await WebAssembly.instantiate(bytes);
        wasmInstance = wasm.instance.exports;
    } catch {}
}

// 🎤 MICROPHONE
let audioLevel = 0;

async function initMic() {

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioContext = new AudioContext();
    const mic = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    mic.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    function updateAudio() {
        analyser.getByteFrequencyData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }

        audioLevel = sum / data.length / 255;

        requestAnimationFrame(updateAudio);
    }

    updateAudio();
}

// 📷 CAMERA
let motionLevel = 0;

async function initCamera() {

    const video = document.createElement("video");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    video.srcObject = stream;
    video.play();

    const offCanvas = document.createElement("canvas");
    const offCtx = offCanvas.getContext("2d");

    offCanvas.width = 160;
    offCanvas.height = 120;

    let lastFrame = null;

    function detectMotion() {

        offCtx.drawImage(video, 0, 0, 160, 120);

        const frame = offCtx.getImageData(0, 0, 160, 120).data;

        if (lastFrame) {

            let diff = 0;

            for (let i = 0; i < frame.length; i += 4) {
                diff += Math.abs(frame[i] - lastFrame[i]);
            }

            motionLevel = diff / frame.length / 255;
        }

        lastFrame = frame;

        requestAnimationFrame(detectMotion);
    }

    detectMotion();
}

// Neural stimulation
function stimulate() {

    let stimulus = audioLevel + motionLevel;

    neurons.forEach(n => {

        if (Math.random() < stimulus) {
            n.activity = stimulus;
        }

        if (wasmInstance) {
            n.activity = wasmInstance.wasm_neural_step(n.activity);
        } else {
            n.activity *= 0.96;
        }
    });
}

// Draw
function draw() {

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    connections.forEach(([a, b]) => {

        let n1 = neurons[a];
        let n2 = neurons[b];

        ctx.strokeStyle =
            `rgba(0,255,255,${(n1.activity+n2.activity)/2})`;

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
    });

    neurons.forEach(n => {

        ctx.fillStyle =
            `rgba(0,255,255,${n.activity})`;

        ctx.beginPath();
        ctx.arc(n.x, n.y, 2 + n.activity * 6, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Loop
function loop() {

    stimulate();
    draw();

    requestAnimationFrame(loop);
}

// INIT
loadWasm();
initMic();
initCamera();
loop();
