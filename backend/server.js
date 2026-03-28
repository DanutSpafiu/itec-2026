const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Initialize socket.io with CORS configuration
const io = socketIO(server, {
    cors: {
        origin: "*", // allow any origin for development
        methods: ["GET", "POST"]
    }
});
const port = process.env.PORT || 3000;

// In-memory state for posters. { "poster_id_1": [ { type: 'path', data: ... } ] }
const postersState = {};

app.get("/", (req, res) => {
    res.send("iTEC 2026 Override Backend is running.");
});

io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);

    // User scans a poster and joins its room
    socket.on('joinPoster', (posterId) => {
        socket.join(posterId);
        console.log(`User ${socket.id} joined poster: ${posterId}`);
        
        if (!postersState[posterId]) {
            postersState[posterId] = [];
        }
        
        // Send the current history to the newly connected user
        socket.emit('posterState', postersState[posterId]);
    });

    // User draws something on a poster
    socket.on('addGraffiti', ({ posterId, element }) => {
        if (!postersState[posterId]) {
            postersState[posterId] = [];
        }
        
        postersState[posterId].push(element);
        
        // Broadcast to everyone ELSE viewing the same poster
        socket.to(posterId).emit('newGraffiti', element);
    });

    socket.on('clearPoster', ({ posterId }) => {
        postersState[posterId] = [];
        io.to(posterId).emit('posterCleared');
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});