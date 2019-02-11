var socket  = io.connect();
var canvas  = document.getElementById("drawing-area");
var context = canvas.getContext("2d");
var backgroundImage = new Image();
var paintedSquares = [];
var character = {};
var imgSources = [
    "images/yoda.png",
    "images/luke.png",
    "images/ironman.png",
    "images/captainamerica_shield.png"
];
var chrImgs = ["", "", "", ""];

socket.on("getChar", function(data) {
    character = data;
});

socket.on("updateCanvas", function(data){
    context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    paintedSquares.forEach(function(square) {
        context.fillStyle = square[4];
        context.fillRect(square[0], square[1], square[2], square[3]);
    });

    for (let i in data){
        context.fillStyle = data[i].paintColour;
        paintedSquares.push([data[i].x+5, data[i].y+20, 20, 20, 
            data[i].paintColour]);
        context.fillRect(data[i].x+5, data[i].y+20, 20, 20);
        context.drawImage(chrImgs[data[i].imgNum], 
            data[i].animationFrames[data[i].currFrame], 
            data[i].spriteSheetY, data[i].width, data[i].height, data[i].x, 
            data[i].y, data[i].width, data[i].height);
    }
});

socket.on("startGame", function(data){
    backgroundImage.onload = function(){
        context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); 
    };
    backgroundImage.src = "images/background.png";

    for(let i in data) {
        let chrImg = new Image();
        chrImg.onload = function(){
            context.drawImage(chrImg, 
                data[i].animationFrames[data[i].currFrame], 
                data[i].spriteSheetY, data[i].width, data[i].height, data[i].x, 
                data[i].y, data[i].width, data[i].height);
        };
        chrImg.src = imgSources[data[i].imgNum];
        chrImgs[data[i].imgNum] = chrImg;
    }

    addEventListener('keydown', moveListener);
});

function moveListener(e) {
    if (character.isMoving === false) {
        if (character.currFrame === character.animationFrames.length - 1) {
            character.currFrame = 0;
        }
        else {
            character.currFrame ++;
        }

        if(e.keyCode === 40) {
            character.y += 10;
            character.spriteSheetY = character.spriteSheetLocations[0];
        } else if (e.keyCode === 38) {
            character.y -= 10;
            character.spriteSheetY = character.spriteSheetLocations[1];
        } else if (e.keyCode === 39) {
            character.x += 10;
            character.spriteSheetY = character.spriteSheetLocations[2];
        } else if (e.keyCode === 37) {
            character.x -= 10;
            character.spriteSheetY = character.spriteSheetLocations[3];
        }

        if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 39 ||
                e.keyCode === 37) {
            character.isMoving = true;
            socket.emit("moveMade", character);
            setTimeout(function() { character.isMoving = false }, 100);
        }
    }
}

function pageInit() {
    canvas.width = 600;
    canvas.height= 600;
}

window.onload = pageInit;