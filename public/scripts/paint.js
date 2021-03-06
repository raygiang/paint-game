function pageInit() {
    const socket  = io.connect();
    const updateArea  = document.getElementById("updates");
    const canvas  = document.getElementById("game-area");
    const playerNames = document.getElementsByClassName("player-name");
    const playAgain = document.getElementById("play-again");
    const context = canvas.getContext("2d");
    const backgroundImage = new Image();
    let paintedSquares = [];
    let character = {};
    let imgSources = [
        "images/blue-block.png",
        "images/red-block.png",
        "images/green-block.png",
        "images/yellow-block.png"
    ];
    let chrImgs = ["", "", "", ""];
    let timer = 15;
    let keysPressed = {};
    let playerName = null;

    // Get player name
    while (playerName === null || playerName.trim() === "" || 
            playerName.toLowerCase().trim() === "no player" ||
            playerName.toLowerCase().trim() === "disconnected") {
        playerName = prompt("Please enter a player name");
    }

    socket.emit("newPlayer", playerName);

    // Converts RGB value to Hex
    function toHexValue(rgbComponent) {
        let hexValue = rgbComponent.toString(16);

        if(hexValue.length === 1) {
            return "0" + hexValue;
        } else {
            return hexValue;
        }
    }

    // Retrieve the character assigned to this socket from the server
    socket.on("getChar", function(data) {
        character = data;
    });

    // Notifies that a game is already started
    socket.on("tryAgain", function() {
        updateArea.innerHTML = "A game has already started, try again later";
    });

    // Updates the player list
    socket.on("updatePlayers", function(data, item) {
        Object.keys(data).forEach((key) => {
            playerNames[data[key].imgNum].innerHTML = data[key].playerName;
        });
    });

    // Update the canvas to reflect the current game
    socket.on("updateCanvas", function(data) {
        context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        paintedSquares.forEach(function(square) {
            context.fillStyle = square[4];
            context.fillRect(square[0], square[1], square[2], square[3]);
        });

        for (let i in data){
            context.fillStyle = data[i].paintColour;
            paintedSquares.push([data[i].x+8, data[i].y+32, 40, 24, 
                data[i].paintColour]);
            context.fillRect(data[i].x+8, data[i].y+32, 40, 24);
            context.drawImage(chrImgs[data[i].imgNum], 
                data[i].animationFrames[data[i].currFrame], 
                data[i].spriteSheetY, data[i].width, data[i].height, data[i].x, 
                data[i].y, data[i].width, data[i].height);
        }
    });

    // Runs when four players have connected and the game is ready to start
    socket.on("startGame", function(data) {
        paintedSquares = [];

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

        updateArea.innerHTML = "Time until start: " + timer;
        let startInterval = setInterval(function() {
            timer--;
            updateArea.innerHTML = "Time until start: " + timer;
        }, 1000);

        let gameInterval;
        setTimeout(function() {
            clearInterval(startInterval);
            addEventListener("keydown", moveListener);
            timer = 60;

            gameInterval = setInterval(function() {
                timer--;
                updateArea.innerHTML = "Keep painting! Time Left: " + timer;
            }, 1000);

            setTimeout(function() {
                clearInterval(gameInterval);
                updateArea.innerHTML = "Out of Time!";
                removeEventListener("keydown", moveListener);
                socket.emit("gameOver");
            }, 60000);
        }, 15000);

        addEventListener("keyup", function(e) { delete keysPressed[e.keyCode] });
    });

    // Runs when the game is over, calculates the amount of colour on the canvas
    socket.on("endGame", function(data) {
        let blueCount = 0;
        let redCount = 0;
        let greenCount = 0;
        let yellowCount = 0;

        context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        paintedSquares.forEach(function(square) {
            context.fillStyle = square[4];
            context.fillRect(square[0], square[1], square[2], square[3]);
        });

        let pixelInfo = context.getImageData(0, 0, 640, 640).data;
        for(let i = 0; i < canvas.width; i++) {
            for(let j = 0; j < canvas.height; j++) {
                let index = (j * canvas.width + i) * 4;
                let hexValue = "#" + toHexValue(pixelInfo[index]) + 
                    toHexValue(pixelInfo[index+1]) + toHexValue(pixelInfo[index+2]);
                if(hexValue === "#39ffd2") {
                    blueCount++;
                } else if (hexValue === "#f96e6e") {
                    redCount++;
                } else if (hexValue === "#34ff41") {
                    greenCount++;
                } else if (hexValue === "#fcff00") {
                    yellowCount++;
                }
            }
        }

        totalCount = blueCount + redCount + greenCount + yellowCount;

        let results = [];
        results.push((blueCount/totalCount*100).toFixed(2));
        results.push((redCount/totalCount*100).toFixed(2));
        results.push((greenCount/totalCount*100).toFixed(2));
        results.push((yellowCount/totalCount*100).toFixed(2));

        let resultClasses = ["blue-bar", "red-bar", "green-bar", "yellow-bar"];
        let resultBars = [];

        updateArea.innerHTML = "Calculating Results: ";
        for(let i = 0; i < 4; i++) {
            let newBar = document.createElement("div");
            newBar.setAttribute("class", resultClasses[i]);
            newBar.style.width = "0%";
            resultBars.push(newBar);
            updateArea.appendChild(newBar);
        }

        setTimeout(function() { displayResults (results, resultBars); }, 500);

        playAgain.style.display = "block";
    });

    // Displays the results in the form of percentage bars
    function displayResults(results, resultBars) {
        let delay = 100;
        let maxPercent = Math.max(results[0], results[1], results[2], results[3]);

        for(let i = 1; i < maxPercent; i++) {
            if(i < results[0]) {
                setTimeout(function() {
                    resultBars[0].style.width = i + "%";  
                }, delay*i);
            }
            if(i < results[1]) {
                setTimeout(function() {
                    resultBars[1].style.width = i + "%";  
                }, delay*i);
            }
            if(i < results[2]) {
                setTimeout(function() {
                    resultBars[2].style.width = i + "%";  
                }, delay*i);
            }
            if(i < results[3]) {
                setTimeout(function() {
                    resultBars[3].style.width = i + "%";  
                }, delay*i);
            }
            if(i >= maxPercent - 1) {
                setTimeout(function() {
                    resultBars[0].innerHTML = results[0] + "%";
                    resultBars[1].innerHTML = results[1] + "%";
                    resultBars[2].innerHTML = results[2] + "%";
                    resultBars[3].innerHTML = results[3] + "%";
                }, delay*(i-1));
            }
        }
    }

    // Event Listener to move the player
    function moveListener(e) {
        e.preventDefault();
        let validKey = false;

        if (Object.keys(keysPressed).length < 2) {
            keysPressed[e.keyCode] = 1;
        }

        if (character.isMoving === false) {
            if (character.currFrame === character.animationFrames.length - 1) {
                character.currFrame = 0;
            }
            else {
                character.currFrame ++;
            }

            if (40 in keysPressed && 39 in keysPressed) {
                character.x += character.movespeed;
                character.y += character.movespeed;
                character.spriteSheetY = character.spriteSheetLocations[4];
                validKey = true;
            } else if (40 in keysPressed && 37 in keysPressed) {
                character.x -= character.movespeed;
                character.y += character.movespeed;
                character.spriteSheetY = character.spriteSheetLocations[5];
                validKey = true;
            } else if (38 in keysPressed && 39 in keysPressed) {
                character.x += character.movespeed;
                character.y -= character.movespeed;
                character.spriteSheetY = character.spriteSheetLocations[6];
                validKey = true;
            } else if (38 in keysPressed && 37 in keysPressed) {
                character.x -= character.movespeed;
                character.y -= character.movespeed;
                character.spriteSheetY = character.spriteSheetLocations[7];
                validKey = true;
            } else if(40 in keysPressed) {
                character.y += character.movespeed;
                character.spriteSheetY = character.spriteSheetLocations[0];
                validKey = true;
            } else if (38 in keysPressed) {
                character.y -= character.movespeed;
                character.spriteSheetY = character.spriteSheetLocations[1];
                validKey = true;
            } else if (39 in keysPressed) {
                character.x += character.movespeed;
                character.spriteSheetY = character.spriteSheetLocations[2];
                validKey = true;
            } else if (37 in keysPressed) {
                character.x -= character.movespeed;
                character.spriteSheetY = character.spriteSheetLocations[3];
                validKey = true;
            }

            if (character.x < 64) {
                character.x = 56;
            }
            if (character.x > 528) {
                character.x = 528;
            }
            if (character.y < 32) {
                character.y = 32;
            }
            if (character.y > 520) {
                character.y = 520;
            }

            if (validKey === true) {
                character.isMoving = true;
                socket.emit("moveMade", character);
                setTimeout(function() { character.isMoving = false }, 100);
            }
        }
    }

    // Event Listener for the Play Again button
    playAgain.addEventListener("mouseup", () => {
        window.location = "";
    });

    backgroundImage.onload = function() {
        context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); 
    };
    backgroundImage.src = "images/background.png";

    canvas.width = 640;
    canvas.height= 640;

    updateArea.innerHTML = "Waiting for Players...";
}

window.onload = pageInit;