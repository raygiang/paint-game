var express = require("express"); 
var http = require("http");
var socketIO = require("socket.io");
var path = require("path");

var app = express();
var server = http.createServer(app);
var io = socketIO.listen(server);

var yoda = {
    x: 40,
    y: 30,
    width: 30,
    height: 50,
    spriteSheetY: 0,
    spriteSheetLocations: [0, 145, 98, 48],
    currFrame: 0,
    animationFrames: [0, 33, 66, 99],
    isMoving: false,
    paintColour: "lightgreen",
    imgNum: 0
};

var luke = {
    x: 40,
    y: 510,
    width: 30,
    height: 50,
    spriteSheetY: 0,
    spriteSheetLocations: [0, 145, 98, 48],
    currFrame: 0,
    animationFrames: [0, 33, 66, 99],
    isMoving: false,
    paintColour: "lightgreen",
    imgNum: 1
};

var ironman = {
    x: 530,
    y: 30,
    width: 30,
    height: 50,
    spriteSheetY: 0,
    spriteSheetLocations: [0, 145, 95, 48],
    currFrame: 0,
    animationFrames: [0, 33, 66, 99],
    isMoving: false,
    paintColour: "red",
    imgNum: 2
};

var cap = {
    x: 530,
    y: 510,
    width: 30,
    height: 46,
    spriteSheetY: 0,
    spriteSheetLocations: [0, 145, 96, 48],
    currFrame: 0,
    animationFrames: [0, 33, 66, 99],
    isMoving: false,
    paintColour: "red",
    imgNum: 3
};

var playerChars = {};

app.use(express.static(path.join(__dirname + "/public")));
server.listen(process.env.PORT || 9002, '0.0.0.0');
console.log("Server running on localhost:9002");

var numConnections = 0;

io.on("connection", function (socket) {
    console.log("connection made with id: " + socket.id);

    numConnections++;

    if(numConnections <= 4) {
        if(numConnections === 1) {
            playerChars[socket.id] = yoda;
            io.sockets.to(socket.id).emit("getChar", yoda);
        } else if(numConnections === 2) {
            playerChars[socket.id] = luke;
            io.sockets.to(socket.id).emit("getChar", luke);
        } else if(numConnections === 3) {
            playerChars[socket.id] = ironman;
            io.sockets.to(socket.id).emit("getChar", ironman);
        } else {
            playerChars[socket.id] = cap;
            io.sockets.to(socket.id).emit("getChar", cap);
        }
    }
    if(numConnections === 4) {
        io.sockets.emit("startGame", playerChars);
    }

    socket.on("disconnect", function () {
        console.log(socket.id + " has discconected");
    });

    socket.on("moveMade", function(data) {
        playerChars[socket.id] = data;
        io.sockets.emit("updateCanvas", playerChars);
    });
});