var express = require("express"); 
var http = require("http");
var socketIO = require("socket.io");
var path = require("path");

var app = express();
var server = http.createServer(app);
var io = socketIO.listen(server);

app.use(express.static(path.join(__dirname + "/public")));
server.listen(process.env.PORT || 9002, '0.0.0.0');
console.log("Server running on localhost:9002");

function Player(startX, startY, paintCol, imgNum) {
    this.x = startX;
    this.y = startY;
    this.width = 64;
    this.height = 64;
    this.movespeed = 12;
    this.spriteSheetY = 0;
    this.spriteSheetLocations = [0, 64, 384, 448, 128, 256, 320, 192];
    this.currFrame = 0;
    this.animationFrames = [0, 64, 128, 192];
    this.isMoving = false;
    this.paintColour = paintCol;
    this.imgNum = imgNum;
}

var tealBlock = new Player(56, 32, "#39ffd2", 0);
var redBlock = new Player(56, 520, "#f96e6e", 1);
var greenBlock = new Player(520, 32, "#34ff41", 2);
var yellowBlock = new Player(520, 520, "#fcff00", 3);

var numConnections = 0;
var playerChars = {};
var roundStarted = false;
var waitlist = {};

io.on("connection", function (socket) {
    console.log("connection made with id: " + socket.id);

    numConnections++;

    if(numConnections <= 4) {
        if(numConnections === 1) {
            playerChars[socket.id] = tealBlock;
            io.sockets.to(socket.id).emit("getChar", tealBlock);
            // io.sockets.emit("startGame", playerChars);
        } else if(numConnections === 2) {
            playerChars[socket.id] = redBlock;
            io.sockets.to(socket.id).emit("getChar", redBlock);
        } else if(numConnections === 3) {
            playerChars[socket.id] = greenBlock;
            io.sockets.to(socket.id).emit("getChar", greenBlock);
        } else {
            playerChars[socket.id] = yellowBlock;
            io.sockets.to(socket.id).emit("getChar", yellowBlock);
        }
    }
    
    if(numConnections === 4) {
        io.sockets.emit("startGame", playerChars);
    }

    socket.on("disconnect", function () {
        console.log(socket.id + " has discconected");
        delete playerChars[socket.id];
        numConnections--;
    });

    socket.on("moveMade", function(data) {
        playerChars[socket.id] = data;
        io.sockets.emit("updateCanvas", playerChars);
    });

    socket.on("gameOver", function() {
        io.sockets.emit("endGame", playerChars);
    });
});