const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const osc = require('osc');

const app = express();
const port = process.env.PORT || 80;

const server = http.createServer(app);
const io = socketIo(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
});

app.use(express.static(path.join(__dirname, 'public')));

// Middleware для обробки JSON в тілі запиту
app.use(express.json());

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

    socket.on('oscMessage', (oscMsg) => {
        if (oscMsg.address === "/changeColor") {
            const color = oscMsg.args[0];
            io.emit('changeColor', color);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// OSC server setup
const udpPort = new osc.UDPPort({
	localAddress: "100.20.92.101",
    localPort: 57121
});

udpPort.on("message", (oscMsg) => {
    io.emit('oscMessage', oscMsg);
});

udpPort.open();

// API route to change color
app.post('/api/changeColor', (req, res) => {
    const color = req.body.color;
    if (color) {
        io.emit('changeColor', color);
        res.status(200).send({ status: 'success', color: color });
    } else {
        res.status(400).send({ status: 'error', message: 'Color not specified' });
    }
});

// API route to change color via URL
app.get('/api/changeColor/:color', (req, res) => {
    const color = req.params.color;
    if (color) {
        io.emit('changeColor', color);
        res.status(200).send({ status: 'success', color: color });
    } else {
        res.status(400).send({ status: 'error', message: 'Color not specified' });
    }
});

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

