const express = require("express"); 
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO.listen(server);

app.use(express.static(path.join(__dirname + "/public")));
server.listen(process.env.PORT || 9001, '0.0.0.0');
console.log("Server running on localhost:9001");

// Function used to create a Player Block
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
    this.playerName = "";
}

// Initialize the four blocks
const tealBlock = new Player(56, 32, "#39ffd2", 0);
const redBlock = new Player(56, 520, "#f96e6e", 1);
const greenBlock = new Player(520, 32, "#34ff41", 2);
const yellowBlock = new Player(520, 520, "#fcff00", 3);

let numConnections = 0;
let playerChars = {};
let playerNames = {};
let roundStarted = false;
let assignedBlocks = new Array(4);

// Assign a player to a block that hasn't been taken yet
let assignBlock = (socketId) => {
    if(!assignedBlocks[0]) {
        assignedBlocks[0] = socketId;
        tealBlock.playerName = playerNames[socketId];
        playerChars[socketId] = tealBlock;
        io.sockets.to(socketId).emit("getChar", tealBlock);
    }
    else if(!assignedBlocks[1]) {
        assignedBlocks[1] = socketId;
        redBlock.playerName = playerNames[socketId];
        playerChars[socketId] = redBlock;
        io.sockets.to(socketId).emit("getChar", redBlock);
    }
    else if(!assignedBlocks[2]) {
        assignedBlocks[2] = socketId;
        greenBlock.playerName = playerNames[socketId];
        playerChars[socketId] = greenBlock;
        io.sockets.to(socketId).emit("getChar", greenBlock);
    }
    else {
        assignedBlocks[3] = socketId;
        yellowBlock.playerName = playerNames[socketId];
        playerChars[socketId] = yellowBlock;
        io.sockets.to(socketId).emit("getChar", yellowBlock);
    }
    io.sockets.emit("updatePlayers", playerChars);
}

// On new connection
io.on("connection", function (socket) {
    console.log("connection made with id: " + socket.id);

    /* Tries to assign a block to a player if four players
       have not connected yet and game has not started */ 
    socket.on("newPlayer", function(data) {
        playerNames[socket.id] = data;

        if(!roundStarted && numConnections < 4) {
            if(numConnections === 1) {
                assignBlock(socket.id);
            } else if(numConnections === 2) {
                assignBlock(socket.id);
            } else if(numConnections === 3) {
                assignBlock(socket.id);
            } else {
                assignBlock(socket.id);
            }
            numConnections++;
        }
        
        if(numConnections === 4 && !roundStarted) {
            roundStarted = true;
            io.sockets.emit("startGame", playerChars);
        }
        else if(roundStarted) {
            io.sockets.emit("tryAgain");
        }
    });

    // On disconnect
    socket.on("disconnect", function () {
        console.log(socket.id + " has discconected");
        let socketIndex = assignedBlocks.indexOf(socket.id);

        if(playerChars[socket.id]) {
            playerChars[socket.id].playerName = "disconnected";
            io.sockets.emit("updatePlayers", playerChars);
        }

        if(socketIndex !== -1) {
            assignedBlocks[socketIndex] = null;
            delete playerChars[socket.id];
            delete playerNames[socket.id];
            numConnections--;
        }

        if(numConnections === 0) {
            roundStarted = false;
        }
    });

    // When a key is pressed to move a player
    socket.on("moveMade", function(data) {
        playerChars[socket.id] = data;
        io.sockets.emit("updateCanvas", playerChars);
    });

    // When the game has ended
    socket.on("gameOver", function() {
        numConnections = 0;
        playerChars = {};
        playerNames = {};
        roundStarted = false;
        assignedBlocks = new Array(4);
        io.sockets.emit("endGame", playerChars);
    });
});