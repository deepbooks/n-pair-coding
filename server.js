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
//https.createServer(options, app).listen(4000)
const server = http.createServer(app).listen(8080);

// Static file serving
app.use("/",express.static("./"));

// Bind socket.io to the server
const io = require('socket.io')(server);

// When a new socket connects
io.on('connection', socket => {
    // Create terminal
    const term = pty.spawn('sh', [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });

    // Listen on the terminal for output and send it to the client
    term.on('data', data => {
        console.log(data);
        io.emit('output', data);
    });

    // Listen on the client and send any input to the terminal
    socket.on('input', data => {
        term.write(data);
    });

    // Listen for a resize request and update the terminal size
    socket.on('resize', data => {
        term.resize(data[0], data[1]);
    });

    // When socket disconnects, destroy the terminal
    socket.on("disconnect", () => {
        term.destroy();
        console.log("bye");
    });
});
