const express = require('express');
/* const https = require('https'); */
const http = require('http');
const fs = require('fs');

const pty = require('node-pty');

// Setup the express app
const app = express();
// HTTPS key and certificate files
/* const options = {
  key: fs.readFileSync('keys/key.pem'),
  cert: fs.readFileSync('keys/cert.pem')
}; */

// Create Server using the app and bind it to a port
/* https.createServer(options, app).listen(4000); */
const server = http.createServer(app).listen(8081);

// Static file serving
app.use("/", express.static("./"));

// Bind socket.io to the server
const io = require('socket.io')(server);

const room = "default";

// When a new socket connects
io.on('connection', socket => {
    socket.join(room);
    // Create terminal
    const term = pty.spawn('sh', [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });
        
    io.emit('connected', JSON.stringify(sids2array(io)));

    // When socket disconnects, destroy the terminal
    socket.on("disconnect", () => {
        term.destroy();
        io.emit("disconnected");
        console.log(`${socket.id}: bye`);
    });

    // Listen on the terminal for output and send it to the client
    term.on('data', data => {
        const json = JSON.stringify({ sid: socket.id, data });
        console.log(data);
        // socket.broadcast.to(room).emit('output', json);
        io.emit('output', json);
    });

    // Listen on the client and send any input to the terminal
    socket.on('input', data => term.write(data));

    // Listen for a resize request and update the terminal size
    socket.on('resize', data => term.resize(data[0], data[1]));
});

function sids2array(io) {
    const sids = io.of("/").adapter.sids;

    const array = [];
    for (let [sid, room] of sids)
        array.push(sid);

    console.log(array);
    return array;
}
