const canvas = document.getElementById('whiteboard');
const context = canvas.getContext('2d');
const socket = io();

let drawing = false;
let currentColor = 'black';
let brushSize = 4;

// Toolbar event listeners
document.querySelectorAll('.tool').forEach(button => {
    button.addEventListener('click', () => {
        currentColor = button.getAttribute('data-color');
    });
});

document.getElementById('eraser').addEventListener('click', () => {
    currentColor = 'white';
});

document.getElementById('brush-size').addEventListener('input', (event) => {
    brushSize = event.target.value;
});

document.getElementById('save-canvas').addEventListener('click', () => {
    const dataURL = canvas.toDataURL();
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'whiteboard.png';
    link.click();
});

document.getElementById('upload-canvas').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle drawing
canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);

canvas.addEventListener('mousemove', (event) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    draw(x, y, currentColor, brushSize, true);
});

function draw(x, y, color, size, emit = false) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, size / 2, 0, Math.PI * 2);
    context.fill();

    if (emit) {
        socket.emit('draw', { x, y, color, size });
    }
}

socket.on('update_canvas', (data) => {
    draw(data.x, data.y, data.color, data.size, false);
});

// Chat functionality
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const sendChatButton = document.getElementById('send-chat');

sendChatButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit('chat', message);
        chatInput.value = '';
    }
});

socket.on('new_message', (message) => {
    const msgElem = document.createElement('div');
    msgElem.textContent = message;
    chatMessages.appendChild(msgElem);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});
