/**
 * Created by nikita on 19.08.15.
 */
var socketio = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

module.exports.listen = function (server) {
    io = socketio.listen(server)
    io.set('log level', 1);
    io.sockets.on('conntection', function (socket) {
       guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

        joinRoom(socket, 'Lobby');

        handleMessageBroadcasting(socket, nickNames);

        handleNameChangeAttempts(socket, nickNames, namesUsed);

        handleRommJoining(socket);

        socket.on('rooms', function() {
           socket.emit('rooms', io.sockets.manager.rooms)
        });


        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};


function assignGuestName (socket, guestNubmer, nickNames, namesUsed) {
    var name = 'Guest' + guestNubmer;
    nickNames[socket.id] = name;
    socket.emit('namesResult', {
        success: true,
        name: name
    });
    namesUsed.push(name);
    return guestNubmer + 1;
}

function joinRomm (socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room: room});

    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + 'has joined' + room + '.'
    });
    var usersInRoom = io.sockets.clients(room);
    if (usersInRoom.length > 1) {
        var usersInRoomSummary = 'Users currently in '+ room + ':';
        for (var index in usersInRoom) {
            var userSockedId = usersInRoom[index].id;
            if (userSockedId !== socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ','
                }
                usersInRoomSummary += nickNames[userSockedId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', {text: usersInRoomSummary});

    }
}
