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
        console.log(`Color change requested: ${color}`);
        io.emit('changeColor', color);
    });

    socket.on('oscMessage', (oscMsg) => {
        console.log(`OSC Message received: ${JSON.stringify(oscMsg)}`);
        if (oscMsg.address === "/changeColor") {
            const color = oscMsg.args[0];
            console.log(`Changing color via OSC: ${color}`);
            io.emit('changeColor', color);
        }
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

udpPort.on("ready", () => {
    console.log(`OSC server is listening on port ${udpPort.options.localPort}`);
});

udpPort.on("message", (oscMsg) => {
    console.log(`OSC message received: ${JSON.stringify(oscMsg)}`);
    io.emit('oscMessage', oscMsg);
});

udpPort.on("error", (err) => {
    console.error(`Error with OSC server: ${err.message}`);
});

udpPort.open();

// API route to change color
app.post('/api/changeColor', (req, res) => {
    const color = req.body.color;
    if (color) {
        console.log(`API Color change requested: ${color}`);
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
        console.log(`URL Color change requested: ${color}`);
        io.emit('changeColor', color);
        res.status(200).send({ status: 'success', color: color });
    } else {
        res.status(400).send({ status: 'error', message: 'Color not specified' });
    }
});

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
