import Player from "./factories/playerFactory.js";

class GameController {
  constructor(height, length, allShips) {
    this.height = height;
    this.length = length;
    this.allShips = allShips;
    this.human = new Player("human", this, this.allShips);
    this.computer = new Player("computer", this, this.allShips);
    this.shipsPlaced = this.human.gameboard.shipsPlaced;
    this.compChoice;
    this.wonGame = null;

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
    this.prepareAttackPlayer();
  }

  attackComputer(verticalLoc, horizontalLoc) {
    if (!this.computer.gameboard.validAttack(verticalLoc, horizontalLoc))
      return;
    this.eventController.startListenerTimer(500);
    this.computer.gameboard.receiveAttack(verticalLoc, horizontalLoc);

    if (this.computer.gameboard.checkLose()) this.wonGame = "human";
    if (!this.computer.gameboard.successfulAttack(verticalLoc, horizontalLoc))
      setTimeout(() => {
        this.attackPlayer();
      }, 500); // Variable delay
  }

  prepareAttackPlayer() {
    this.compChoice = this.human.decideAI("extreme"); // adjustable
    this.renderController.renderProbabilityMap(this.compChoice);
  }

  attackPlayer() {
    this.human.gameboard.receiveAttack(this.compChoice[0], this.compChoice[1]);

    if (this.human.gameboard.checkLose()) this.wonGame = "computer";
    this.human.probabilityAI.checkAdjacentMode();
    this.human.probabilityAI.checkSunkShip(this.compChoice);
    this.audioController.playRandomAudio("attack");
    this.renderController.updateBoard();

    if (
      this.human.gameboard.successfulAttack(
        this.compChoice[0],
        this.compChoice[1]
      )
    ) {
      this.eventController.startListenerTimer(500);
      setTimeout(() => {
        this.attackPlayer();
      }, 500); // Variable delay
    }
    this.prepareAttackPlayer();
  }
}

class InitializeController {
  constructor(
    gameController,
    renderController,
    audioController,
    eventController
  ) {
    this.rotatationMode = "vertical";
    this.selectedShip = null;

    // Connect to other controllers
    this.gameController = gameController;
    this.renderController = renderController;
    this.audioController = audioController;
    this.eventController = eventController;
  }

  toggleRotate() {
    const shipContainer = document.getElementById("ships-container");
    if (this.rotatationMode === "vertical") {
      this.rotatationMode = "horizontal";
      shipContainer.classList.add("horizontal");
    } else {
      this.rotatationMode = "vertical";
      shipContainer.classList.remove("horizontal");
    }
  }

  toggleSelectedShip(ship) {
    if (this.selectedShip)
      this.selectedShip.classList.remove("highlighted-ship");
    this.selectedShip = ship;
    if (this.selectedShip) this.selectedShip.classList.add("highlighted-ship");
  }

  highlightShipPlacement(location, cellIndex) {
    if (this.selectedShip === null) return;
    this.renderController.toggleShipPointerEvents(false);
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
    } else {
      this.renderController.updateInvalidHighlightPlacement(
        cellIndex,
        length,
        this.rotatationMode
      );
    }
  }

  clearHighlightShipPlacement(location, cellIndex) {
    if (this.selectedShip === null) return;
    const length = +this.selectedShip.id.charAt(0); // Length

    this.renderController.updateClearHighlightPlacement(
      cellIndex,
      length,
      this.rotatationMode
    );
  }

  confirmShipPlacement(location, cellIndex) {
    if (this.selectedShip === null) return;
    const length = +this.selectedShip.id.charAt(0);
    const variant = this.selectedShip.id.charAt(2);

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
        variant
      );
      this.eventController.recentlyPlacedShip = true;
      this.renderController.toggleShipPointerEvents(true);
      this.clearHighlightShipPlacement(location, cellIndex);
      this.renderController.updateShipSettings(length, variant);
      this.toggleSelectedShip(null);
      this.renderController.updateBoard();
      this.audioController.playAudio("deploy", 0.8);
    }
  }

  movePlacedShip(cellData, verticalLoc, horizontalLoc) {
    if (cellData.hasShip) {
      // Find the ship head
      let shipHeadCell = cellData;
      let shipHeadVertical = verticalLoc;
      let shipHeadHorizontal = horizontalLoc;

      while (!shipHeadCell.shipHead) {
        if (cellData.hasShip.rotation === "horizontal") {
          shipHeadHorizontal--;
        } else {
          shipHeadVertical--;
        }
        shipHeadCell =
          this.gameController.human.gameboard.coordinates[shipHeadVertical][
            shipHeadHorizontal
          ];
      }

      // Get ship details from the head
      const length = shipHeadCell.shipHead.length;
      const variant = shipHeadCell.shipHead.variant;

      const shipImg = document.getElementById(`${length}-${variant}-board`);
      this.toggleSelectedShip(shipImg);

      // Update the board visually
      this.renderController.updateBoard();
      this.renderController.updateShipSettings();

      // Play a sound effect if needed
      this.audioController.playAudio("select", 0.8);
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
    this.probabilityBtn = document.getElementById("toggle-probability");
    this.targetsBtn = document.getElementById("toggle-targets");

    // Controllers
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
      this.audioController,
      this
    );
    this.gameController.renderController = this.renderController;
    this.gameController.audioController = this.audioController;
    this.gameController.eventController = this;

    this.recentlyPlacedShip = false;
    this.gameStarted = false;

    this.consoleBtn = document.getElementById("console-btn"); // Temp console

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
    let musicLoaded = false;
    document.addEventListener("click", () => {
      if (musicLoaded === false) {
        this.audioController.toggleBGMusic(this.bgMusic, this.musicBtn);
        musicLoaded = true;
      }
    });

    this.consoleBtn.addEventListener("click", () => {
      this.renderController.consoleLog();
    });

    this.probabilityBtn.addEventListener("click", () => {
      if (this.renderController.showProbabilityMap) {
        this.renderController.showProbabilityMap = false;
        this.probabilityBtn.textContent = "PROBABILITY MAP: OFF";
      } else {
        this.renderController.showProbabilityMap = true;
        this.probabilityBtn.textContent = "PROBABILITY MAP: ON";
      }

      this.renderController.updateProbabilityTargets();
    });

    this.targetsBtn.addEventListener("click", () => {
      if (this.renderController.showTargets) {
        this.renderController.showTargets = false;
        this.targetsBtn.textContent = "TARGETS: OFF";
      } else {
        this.renderController.showTargets = true;
        this.targetsBtn.textContent = "TARGETS: ON";
      }

      this.renderController.updateProbabilityTargets();
    });

    this.startBtn.addEventListener("click", () => {
      this.renderController.renderBoard("computer");
      this.computerCells = document.querySelectorAll("#computer-board .cell");
      this.computerCellsArr = [...this.computerCells];

      this.gameStarted = true;
      this.renderController.togglePlacedShipHover(false);
      this.gameController.initializeGame();
      this.renderController.updateBoard();
      this.renderController.toggleSettingsDisplay();
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
    this.setupPlacedShipListeners();
  }

  setupPlacedShipListeners() {
    const humanBoard = document.getElementById("human-board");

    humanBoard.addEventListener("click", (event) => {
      if (this.gameStarted) return;

      if (this.recentlyPlacedShip) {
        this.recentlyPlacedShip = false;
        return;
      }

      const clickedCell = event.target.closest(".cell");
      if (!clickedCell) return;

      const cellIndex = parseInt(clickedCell.id.substring(5));
      const verticalLoc = Math.floor(cellIndex / this.gameController.length);
      const horizontalLoc = cellIndex % this.gameController.length;
      const cellData =
        this.gameController.human.gameboard.coordinates[verticalLoc][
          horizontalLoc
        ];

      this.initializeController.movePlacedShip(
        cellData,
        verticalLoc,
        horizontalLoc
      );
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
    sound.src = `src/assets/audio/${name}/${name}-${number}.mp3`;
    sound.play();
  }

  playAudio(name, volume = 1) {
    const sound = new Audio();
    sound.src = `src/assets/audio/${name}.mp3`;
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
    this.bestCoords;
    this.showProbabilityMap = true;
    this.showTargets = true;
  }

  togglePlacedShipHover(toggleOn) {
    const shipElements = document.getElementsByClassName("ship-img");
    Array.from(shipElements).forEach((ship) => {
      if (toggleOn) {
        ship.classList.remove("no-hover");
      } else {
        ship.classList.add("no-hover");
      }
    });
  }

  toggleShipPointerEvents(toggleOn) {
    const shipElements = document.getElementsByClassName("ship-img");

    Array.from(shipElements).forEach((ship) => {
      if (toggleOn) {
        setTimeout(() => {
          ship.style.pointerEvents = "all";
        }, 500);
      } else {
        ship.style.pointerEvents = "none";
      }
    });
  }

  updateShipSettings() {
    const shipsPlaced = this.gameController.human.gameboard.shipsPlaced;
    const allShips = this.gameController.allShips;

    // Remove all ship-placed class
    allShips.forEach((ship) => {
      const shipElement = document.getElementById(
        `${ship.length}-${ship.variant}`
      );
      shipElement.classList.remove("ship-placed");
    });

    // Add ship-placed class
    shipsPlaced.forEach((ship) => {
      const shipElement = document.getElementById(
        `${ship.length}-${ship.variant}`
      );
      shipElement.classList.add("ship-placed");
    });
  }

  toggleSettingsDisplay() {
    const settingsContainer = document.getElementById("settings-container");
    const computerContainer = document.getElementById("computer-container");

    settingsContainer.style.display = "none";
    computerContainer.style.display = "flex";
  }

  updateProbabilityTargets() {
    const probabilityMaps = document.querySelectorAll(".probability-overlay");
    const targets = document.querySelectorAll(".target-img");

    if (this.showProbabilityMap) {
      Array.from(probabilityMaps).forEach((overlay) => {
        overlay.style.display = "block";
      });
    } else {
      Array.from(probabilityMaps).forEach((overlay) => {
        overlay.style.display = "none";
      });
    }

    if (this.showTargets) {
      Array.from(targets).forEach((target) => {
        target.style.display = "block";
      });
    } else {
      Array.from(targets).forEach((target) => {
        target.style.display = "none";
      });
    }
  }

  resetProbabilityTarget() {
    const targets = document.querySelectorAll(".target-img");
    Array.from(targets).forEach((target) => {
      target.style.display = "none";
      target.parentNode.removeChild(target);
    });
  }

  renderProbabilityTarget(selectedCell) {
    const targetImg = document.createElement("img");
    targetImg.classList.add("target-img");
    targetImg.src = `src/assets/images/gameboard/target.png`;
    selectedCell.appendChild(targetImg);
  }

  renderProbabilityMap(bestLoc) {
    this.resetProbabilityTarget();
    const coords = this.gameController.human.gameboard.coordinates;
    const bestProbability = coords[bestLoc[0]][bestLoc[1]].probability;

    let cellIndex = 0;
    coords.forEach((row) =>
      row.forEach((cell) => {
        const probabilityWeight = cell.probability / bestProbability;
        const selectedCell = document.querySelector(
          `#human-board #cell-${cellIndex}`
        );

        // Create and append a new overlay div
        const existingOverlay = selectedCell.querySelector(
          ".probability-overlay"
        );
        if (existingOverlay) existingOverlay.remove();
        const overlay = document.createElement("div");
        overlay.className = "probability-overlay";
        overlay.style.filter = `brightness(${probabilityWeight * 2}) `;
        selectedCell.style.position = "relative";
        selectedCell.appendChild(overlay);

        if (cell.probability === bestProbability) {
          this.renderProbabilityTarget(selectedCell);
        }
        cellIndex++;
      })
    );

    this.updateProbabilityTargets();
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

  updateInvalidHighlightPlacement(cellIndex, length, rotation) {
    if (rotation === "horizontal") {
      for (let i = cellIndex; i < cellIndex + length; i++) {
        if (i !== cellIndex && i % 10 === 0) return;
        const selectedCell = document.querySelector(`#human-board #cell-${i}`);
        selectedCell.classList.add("invalid-cell");
      }
    }

    if (rotation === "vertical") {
      for (let i = 0; i < length; i++) {
        const adjustedIndex = cellIndex + i * this.gameController.length;
        const selectedCell = document.querySelector(
          `#human-board #cell-${adjustedIndex}`
        );
        if (selectedCell) selectedCell.classList.add("invalid-cell");
      }
    }
  }

  updateClearHighlightPlacement(cellIndex, length, rotation) {
    if (rotation === "horizontal") {
      for (let i = cellIndex; i < cellIndex + length; i++) {
        const selectedCell = document.querySelector(`#human-board #cell-${i}`);
        selectedCell.classList.remove("highlighted-cell");
        selectedCell.classList.remove("invalid-cell");
      }
    }

    if (rotation === "vertical") {
      for (let i = 0; i < length; i++) {
        const adjustedIndex = cellIndex + i * this.gameController.length;
        const selectedCell = document.querySelector(
          `#human-board #cell-${adjustedIndex}`
        );
        selectedCell.classList.remove("highlighted-cell");
        selectedCell.classList.remove("invalid-cell");
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
        const checkShipImg = targetCell.querySelector(".ship-img");
        if (checkShipImg) return;

        const shipImg = this.createShipImg(cell, cellIndex, boardId);
        shipImg.classList.add("human-ship");
        targetCell.appendChild(shipImg);
      } else {
        // If the image exists, remove it
        const shipImg = targetCell.querySelector(".ship-img");

        if (shipImg) {
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
      targetImg.style.opacity = 0.05;
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

    shipImg.src = `src/assets/images/ships/${color}/${color}-${length}-${variant}.png`;
    shipImg.id = `${length}-${variant}-board`;
    shipImg.classList.add("ship-img");

    if (boardId === "human-board") {
      shipImg.classList.add("human-ship");
    }
    return shipImg;
  }

  updateCellHit(cell, cellIndex, boardId) {
    if (cell.hasHit) {
      const hitImg = document.createElement("img");
      hitImg.src = "src/assets/images/gameboard/hit.png";
      if (cell.hasShip)
        hitImg.src = "src/assets/images/gameboard/hit-and-ship.png";
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
    const gameboardContainer = document.getElementById(`${player}-container`);
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
    // console.log(eventController.initializeController.selectedShip);
    // console.log(eventController.initializeController.placedShips);
    // console.log(computer.allShips);

    // console.log(human.probabilityAI.adjacentMode)
    console.log(this.gameController.human.gameboard);
  }
}

const eventController = new EventController(10, 10);
eventController.renderHumanBoard();
