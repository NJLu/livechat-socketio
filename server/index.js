// Importing packages
const cors = require('cors');

// Initializing Socket.io with express
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

// console.log(io);

// Importing router object
const router = require('./router.js');

// Importing user functions
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js');

// Setting up the port number
const PORT = process.env.PORT || 5000;


// Establish sockets
io.on('connection', (socket) => {
    /**
     * Listening to "joinRoom" event emitted from the frontend
     * Taking data passed in from the frontend ({name, room} and a pointer to the callback function defined at the frontend) as the arguments of the second argument of .on()
     */
    socket.on('joinRoom', ({name, room}, callback) => {
        console.log(room);
        console.log(name);
        console.log(socket.id);

        /**
         * Create user based on named argument 'name' and 'room' passed in from the frontend and assign a socket id to the user created by Socket.io
         * addUser() returns an {error: ""} object or an user object {id: "", name: "", room: ""} depending on whether or not there is error
         */
        const { error, user } = addUser({id: socket.id, name, room});

        // if error object is returned by addUser(), pass the error message to callback function and send to frontend
        if (error) return callback(error);

        // if user is created successfully, log the user information on the server
        console.log(user);

        // Join the newly created user to the specified room
        socket.join(user.room);

        // Emit a "message" event with a message object {user: "", text: ""}
        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});

        // Broadcast to the other users (sockets) of the room with a "message" event with object {user: "", text: ""}
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joined`});

        // Emit "roomData" to all users in the room with {room: "", users: ""}
        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });

    /**
     * Listening to "sendMessage" event emitted from the frontend
     * Taking data passed in from the frontend (message and a pointer to the callback function defined at the frontend) as the arguments of the second argument of .on()
     */
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        console.log(user);

        // io.to() emits "message" event to all the users connected to the specific room
        io.to(user.room).emit('message', {user: user.name, text: message});
        callback();
    });

    /**
     * Listening to "Disconnect" event emitted from the frontend
     * Taking no data from frontend
     */
    socket.on('disconnect', () => {
        // Removed the user with current socket id from the room's user list and return the removed user
        const user = removeUser(socket.id);

        /**
         * If user was successfully removed,
         * emits "message" and "roomData" events to all the users in that room
         */
        if (user) {
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left the room.`});
            io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
        }
    })
});


app.use(cors());
app.use(router);

// Listen to http server on pre-defined port
httpServer.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
});