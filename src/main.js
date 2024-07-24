import Player from "./factories/playerFactory.js";

class GameController {
  constructor(height, length, allShips) {
    this.height = height;
    this.length = length;
    this.allShips = allShips;
    this.human = new Player("human", this, this.allShips);
    this.computer = new Player("computer", this, this.allShips);

    // Connect to other controllers
    this.renderController;
    this.audioController;
    this.eventController;
  }

  getHumanPlayer() {
    return this.human;
  }

  getComputerPlayer() {
    return this.computer;
  }

  restartGame() {
    this.human.gameboard.resetBoard(this.height, this.length);
    this.computer.gameboard.resetBoard(this.height, this.length);
  }

  initializeGame() {
    this.computer.initializeAIBoard();
    this.human.probabilityAI.resetShipLengths();
  }

  attackComputer(verticalLoc, horizontalLoc) {
    if (!this.computer.gameboard.validAttack(verticalLoc, horizontalLoc))
      return;
    this.computer.gameboard.receiveAttack(verticalLoc, horizontalLoc);
    if (!this.computer.gameboard.successfulAttack(verticalLoc, horizontalLoc))
      setTimeout(() => {
        this.attackPlayer();
      }, 500); // Variable delay
  }

  attackPlayer() {
    const compChoice = this.human.decideAI("extreme"); // adjustable
    this.human.gameboard.receiveAttack(compChoice[0], compChoice[1]);
    this.human.probabilityAI.checkAdjacentMode();
    this.human.probabilityAI.checkSunkShip(compChoice);
    console.log(this.audioController);
    this.audioController.playRandomAudio("attack");
    this.renderController.updateBoard();

    this.eventController.startListenerTimer(500);
    if (this.human.gameboard.successfulAttack(compChoice[0], compChoice[1])) {
      setTimeout(() => {
        this.attackPlayer();
      }, 500); // Variable delay
    }
  }
}

class InitializeController {
  constructor(gameController, renderController, audioController) {
    this.totalShips = [];
    this.rotatationMode = "vertical";
    this.selectedShip = null;

    // Connect to other controllers
    this.gameController = gameController;
    this.renderController = renderController;
    this.audioController = audioController;
  }

  toggleRotate() {
    if (this.rotatationMode === "vertical") this.rotatationMode = "horizontal";
    else this.rotatationMode = "vertical";
  }

  toggleSelectedShip(ship) {
    if (this.selectedShip)
      this.selectedShip.classList.remove("highlighted-ship");
    this.selectedShip = ship;
    if (this.selectedShip) this.selectedShip.classList.add("highlighted-ship");
  }

  highlightShipPlacement(location, cellIndex) {
    if (this.selectedShip === null) return;
    const length = +this.selectedShip.id.charAt(0);

    if (
      this.gameController.human.gameboard.validPlacement(
        location,
        length,
        this.rotatationMode
      )
    ) {
      this.renderController.updateHighlightPlacement(
        cellIndex,
        length,
        this.rotatationMode
      );
    }
  }

  clearHighlightShipPlacement(location, cellIndex) {
    if (this.selectedShip === null) return;
    const length = +this.selectedShip.id.charAt(0);

    this.renderController.updateClearHighlightPlacement(
      cellIndex,
      length,
      this.rotatationMode
    );
  }

  confirmShipPlacement(location, cellIndex) {
    if (this.selectedShip === null) return;
    const length = +this.selectedShip.id.charAt(0);

    if (
      this.gameController.human.gameboard.validPlacement(
        location,
        length,
        this.rotatationMode
      )
    ) {
      this.gameController.human.gameboard.placeShip(
        location,
        length,
        this.rotatationMode,
        this.selectedShip.id.charAt(2)
      );
      this.clearHighlightShipPlacement(location, cellIndex);
      this.toggleSelectedShip(null);
      this.renderController.updateBoard();
      this.audioController.playAudio("deploy", 0.8);
    }
  }
}

class EventController {
  constructor(height, length) {
    this.listenerTimer = null;
    this.listenerTimerActive = false;

    this.height = height;
    this.length = length;
    this.startBtn = document.getElementById("start-btn");
    this.rotateBtn = document.getElementById("rotate-btn");
    this.bgMusic = document.getElementById("bg-music");
    this.musicBtn = document.getElementById("toggle-music");
    this.shipSettingsBtns = document.querySelectorAll(
      ".ship-size-container img"
    );
    this.shipSettingsBtnsArr = Array.from(this.shipSettingsBtns);

    this.settings = document.getElementById("settings");

    this.audioController = new AudioController();
    this.gameController = new GameController(
      height,
      length,
      this.processAllShips([...this.shipSettingsBtnsArr], this.audioController)
    );
    this.renderController = new RenderController(this.gameController);
    this.initializeController = new InitializeController(
      this.gameController,
      this.renderController,
      this.audioController
    );
    this.gameController.renderController = this.renderController;
    this.gameController.audioController = this.audioController;
    this.gameController.eventController = this;

    this.setupEventListeners();
  }

  processAllShips(shipArray) {
    const result = [];

    shipArray.forEach((ship) => {
      const cleanData = {
        length: ship.id.charAt(0),
        variant: ship.id.charAt(2),
      };
      result.push(cleanData);
    });

    return result;
  }

  setupEventListeners() {
    this.startBtn.addEventListener("click", () => {
      this.renderController.renderBoard("computer");
      this.computerCells = document.querySelectorAll("#computer-board .cell");
      this.computerCellsArr = [...this.computerCells];

      this.gameController.initializeGame();
      this.renderController.updateBoard();
      this.settings.style.display = "none";
      this.audioController.playAudio("startgame");

      // Set up computer cell listeners after getting computerCells array
      this.setupComputerCellListeners();
    });

    this.rotateBtn.addEventListener("click", () => {
      this.initializeController.toggleRotate();
      this.audioController.playAudio("click", 0.7);
    });

    this.shipSettingsBtnsArr.forEach((shipSetting) => {
      shipSetting.addEventListener("click", () => {
        this.initializeController.toggleSelectedShip(shipSetting);
        this.audioController.playAudio("select", 0.8);
      });

      shipSetting.addEventListener("mouseenter", () => {
        this.audioController.playAudio("click", 0.7);
      });
    });

    this.musicBtn.addEventListener("click", () => {
      this.audioController.toggleBGMusic(this.bgMusic, this.musicBtn);
    });
  }

  renderHumanBoard() {
    this.gameController.restartGame(this.height, this.length);
    this.renderController.renderBoard("human");

    this.humanCells = document.querySelectorAll("#human-board .cell");
    this.humanCellsArr = [...this.humanCells];
    this.setupHumanCellListeners();
  }

  setupComputerCellListeners() {
    this.computerCellsArr.forEach((cell) => {
      cell.addEventListener("click", () => {
        if (!this.listenerTimerActive) {
          const cellIndex = parseInt(cell.id.substring(5));
          const verticalLoc = Math.floor(cellIndex / this.length);
          const horizontalLoc = cellIndex % this.length;
          this.gameController.attackComputer(verticalLoc, horizontalLoc);
          this.renderController.updateBoard();
          this.audioController.playRandomAudio("attack");
        }
      });
    });
  }

  setupHumanCellListeners() {
    this.humanCellsArr.forEach((cell) => {
      const cellIndex = parseInt(cell.id.substring(5));
      const verticalLoc = Math.floor(cellIndex / this.length);
      const horizontalLoc = cellIndex % this.length;

      cell.addEventListener("mouseenter", () => {
        this.initializeController.highlightShipPlacement(
          [verticalLoc, horizontalLoc],
          cellIndex
        );
      });

      cell.addEventListener("mouseleave", () => {
        this.initializeController.clearHighlightShipPlacement(
          [verticalLoc, horizontalLoc],
          cellIndex
        );
      });

      cell.addEventListener("click", () => {
        this.initializeController.confirmShipPlacement(
          [verticalLoc, horizontalLoc],
          cellIndex
        );
      });
    });
  }

  startListenerTimer(time) {
    this.listenerTimerActive = true;
    clearTimeout(this.listenerTimer);
    this.listenerTimer = setTimeout(() => {
      this.listenerTimerActive = false;
    }, time);
  }
}

class AudioController {
  constructor() {}

  toggleBGMusic(bgMusic, musicBtn) {
    bgMusic.volume = 1;
    if (bgMusic.paused) {
      bgMusic.play();
      musicBtn.textContent = "MUSIC: ON";
    } else {
      bgMusic.pause();
      musicBtn.textContent = "MUSIC: OFF";
    }
  }

  playRandomAudio(name) {
    const sound = new Audio();
    const number = this.getRandomNumber(4);
    sound.src = `/src/assets/audio/${name}/${name}-${number}.mp3`;
    sound.play();
  }

  playAudio(name, volume = 1) {
    const sound = new Audio();
    sound.src = `/src/assets/audio/${name}.mp3`;
    sound.volume = volume;
    sound.play();
  }

  getRandomNumber(max) {
    return Math.floor(Math.random() * (max + 1));
  }
}

class RenderController {
  constructor(gameController) {
    this.gameController = gameController;
  }

  updateHighlightPlacement(cellIndex, length, rotation) {
    if (rotation === "horizontal") {
      for (let i = cellIndex; i < cellIndex + length; i++) {
        const selectedCell = document.querySelector(`#human-board #cell-${i}`);
        selectedCell.classList.add("highlighted-cell");
      }
    }

    if (rotation === "vertical") {
      for (let i = 0; i < length; i++) {
        const adjustedIndex = cellIndex + i * this.gameController.length;
        const selectedCell = document.querySelector(
          `#human-board #cell-${adjustedIndex}`
        );
        selectedCell.classList.add("highlighted-cell");
      }
    }
  }

  updateClearHighlightPlacement(cellIndex, length, rotation) {
    if (rotation === "horizontal") {
      for (let i = cellIndex; i < cellIndex + length; i++) {
        const selectedCell = document.querySelector(`#human-board #cell-${i}`);
        selectedCell.classList.remove("highlighted-cell");
      }
    }

    if (rotation === "vertical") {
      for (let i = 0; i < length; i++) {
        const adjustedIndex = cellIndex + i * this.gameController.length;
        const selectedCell = document.querySelector(
          `#human-board #cell-${adjustedIndex}`
        );
        selectedCell.classList.remove("highlighted-cell");
      }
    }
  }

  updateBoard() {
    const gameboards = document.getElementsByClassName("gameboard");

    Array.from(gameboards).forEach((board) => {
      let player;
      let boardId = board.id;

      if (boardId === "human-board") {
        player = this.gameController.getHumanPlayer();
      } else {
        player = this.gameController.getComputerPlayer();
      }

      let cellIndex = 0;
      player.gameboard.coordinates.forEach((row) => {
        row.forEach((cell) => {
          this.updateCellHit(cell, cellIndex, boardId);
          this.updateCellShowShip(cell, cellIndex, boardId);
          cellIndex++;
        });
      });
    });
  }

  updateCellShowShip(cell, cellIndex, boardId) {
    if (boardId === "human-board") {
      const targetCell = document.querySelector(
        `#${boardId} #cell-${cellIndex}`
      );

      if (cell.hasShip && cell.shipHead) {
        const shipImg = this.createShipImg(cell, cellIndex, boardId);
        targetCell.appendChild(shipImg);
      } else {
        // If the image exists, remove it
        const shipImg = targetCell.querySelector(".ship-img");

        if (shipImg !== null) {
          console.log("GONNA REMOVE SMTH");
          console.log(shipImg);
          shipImg.style.display = "none";
          targetCell.removeChild(shipImg);
          targetCell.innerHTML = "";
        }
      }
    }

    if (cell.hasShip?.sunk) {
      const targetCell = document.querySelector(
        `#${boardId} #cell-${cellIndex}`
      );
      targetCell.style.backgroundColor = "#070220";

      const targetImg = document.querySelector(
        `#${boardId} #cell-${cellIndex} img`
      );
      targetImg.style.opacity = 0.1;
    }

    if (cell.hasShip?.sunk && cell.shipHead) {
      const shipImg = this.createShipImg(cell, cellIndex, boardId);
      shipImg.classList.add("sunk-img");

      const targetCell = document.querySelector(
        `#${boardId} #cell-${cellIndex}`
      );
      targetCell.appendChild(shipImg);
    }
  }

  createShipImg(cell, cellIndex, boardId) {
    const shipImg = document.createElement("img");

    let color = "red"; // Human
    let length = cell.shipHead.length;
    let variant = cell.shipHead.variant;
    let rotation = cell.shipHead.rotation;

    if (boardId === "computer-board") color = "orange";
    if (rotation === "horizontal") {
      shipImg.style.top = `50%`;
      shipImg.style.left = `${(length - 1) * 100 + 50}%`;
      shipImg.style.transform = `rotate(90deg)`;
    }

    shipImg.src = `/src/assets/images/ships/${color}/${color}-${length}-${variant}.png`;
    shipImg.classList.add("ship-img");
    return shipImg;
  }

  updateCellHit(cell, cellIndex, boardId) {
    if (cell.hasHit) {
      const hitImg = document.createElement("img");
      hitImg.src = "/src/assets/images/gameboard/hit.png";
      if (cell.hasShip)
        hitImg.src = "/src/assets/images/gameboard/hit-and-ship.png";
      hitImg.classList.add("hit-img");

      const targetCell = document.querySelector(
        `#${boardId} #cell-${cellIndex}`
      );
      targetCell.innerHTML = ""; // Remove all children
      targetCell.classList.add("has-hit");
      targetCell.appendChild(hitImg);
    }
  }

  renderBoard(player) {
    // Gameboard
    const gameboardContainer = document.getElementById("gameboard-container");
    const gameboard = document.createElement("div");
    gameboard.className = "gameboard";
    gameboard.id = `${player}-board`;

    // Cells
    const height = 10; // Adjustable height, length
    const length = 10;
    const totalCells = height * length;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `cell-${i}`;
      gameboard.appendChild(cell);
    }

    gameboard.style.gridTemplateColumns = `repeat(${length}, 1fr)`;
    gameboard.style.gridTemplateRows = `repeat(${length}, 1fr)`;
    gameboardContainer.appendChild(gameboard);
  }

  consoleLog() {
    const human = this.gameController.getHumanPlayer();
    const computer = this.gameController.getComputerPlayer();

    console.log("Human:", human.gameboard.coordinates);
    // console.log("Computer:", computer.gameboard.coordinates);

    // console.log(eventController.initializeController.rotatationMode);
    console.log(eventController.initializeController.selectedShip);
    console.log(eventController.initializeController.placedShips);
    console.log(computer.allShips);

    // console.log(human.probabilityAI.adjacentMode)
  }
}

const eventController = new EventController(10, 10);
eventController.renderHumanBoard();
