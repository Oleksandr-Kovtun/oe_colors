const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const osc = require('osc');

const app = express();
const port = 80;

const server = http.createServer(app);
const io = socketIo(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/operator', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'operator.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('changeColor', (color) => {
        io.emit('changeColor', color);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// OSC server setup
const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 57121
});

udpPort.on("message", (oscMsg) => {
    if (oscMsg.address === "/changeColor") {
        const color = oscMsg.args[0];
        io.emit('changeColor', color);
    }
});

udpPort.open();

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

