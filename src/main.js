import Player from "./factories/playerFactory.js";

class GameController {
  constructor(height, length, allShips) {
    this.height = height;
    this.length = length;
    this.allShips = allShips;
    this.human = new Player("human", this, this.allShips);
    this.computer = new Player("computer", this, this.allShips);
    this.AIdifficulty;
    this.compChoice;
    this.gameStarted = false;
    this.wonGame;

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
    this.gameStarted = false;
    this.compChoice;
    this.wonGame = undefined;
    this.human.gameboard.resetBoard(this.height, this.length);
    this.computer.gameboard.resetBoard(this.height, this.length);
    this.renderController.deleteRenderBoards();
    this.renderController.toggleExtremeAISettings(false);
    this.renderController.toggleDifficultySelect(true);
    this.renderController.renderBoard("human");
    this.renderController.togglePlacedShipHover(true);
    this.renderController.renderStartBtn("START GAME");
    this.checkCompletePlacedShips();
  }

  initializeGame(difficulty) {
    this.gameStarted = true;
    this.AIdifficulty = difficulty;
    this.wonGame = undefined;
    this.computer.initializeAIBoard();
    this.human.probabilityAI.resetShipLengths();
    this.renderController.toggleDifficultySelect(false);
    this.renderController.togglePlacedShipHover(false);
    this.renderController.renderStartBtn("RESTART GAME");
    this.renderController.updateTextDisplay(
      "Admiral, seek and destroy all the enemy's battleships!"
    );
    if (difficulty === "3") this.renderController.toggleExtremeAISettings(true);
    this.human.probabilityAI.checkAdjacentMode();
    console.log(this.human.gameboard.coordinates);
    this.prepareAttackPlayer();
  }

  checkLose() {
    if (this.computer.gameboard.checkLoseBoard()) this.wonGame = "human";
    if (this.human.gameboard.checkLoseBoard()) this.wonGame = "computer";

    if (this.wonGame) {
      this.renderController.toggleTargets(true);
      this.renderController.toggleProbabilityMap(true);
      this.renderController.updateProbabilityTargets();
    }
    if (this.wonGame === "human") {
      this.renderController.updateTextDisplay(
        "Mission accomplished, admiral. Your fleet reigns supreme across the galaxy..!"
      );
      this.audioController.playAudio("win", 0.9);
    }

    if (this.wonGame === "computer") {
      this.renderController.updateTextDisplay(
        "Tough break, admiral. Your fleet drifts defeated in the cosmic winds..."
      );
      this.audioController.playAudio("lose", 0.9);
      this.renderController.sinkAllShips();
      this.renderController.updateBoard();
    }
  }

  attackComputer(verticalLoc, horizontalLoc) {
    if (this.wonGame) return; // If game ended, then don't do anything

    if (!this.computer.gameboard.validAttack(verticalLoc, horizontalLoc))
      return;
    this.eventController.startListenerTimer(500);
    this.computer.gameboard.receiveAttack(verticalLoc, horizontalLoc);
    this.audioController.playRandomAudio("attack");
    this.checkLose();

    if (this.wonGame) return;
    if (!this.computer.gameboard.successfulAttack(verticalLoc, horizontalLoc))
      setTimeout(() => {
        this.attackPlayer();
      }, 500); // Variable delay
  }

  prepareAttackPlayer() {
    this.compChoice = this.human.decideAI(this.AIdifficulty); // adjustable
    if (this.AIdifficulty === "3")
      this.renderController.renderProbabilityMap(this.compChoice);
  }

  attackPlayer() {
    this.human.gameboard.receiveAttack(this.compChoice[0], this.compChoice[1]);
    this.human.probabilityAI.checkAdjacentMode();
    this.human.probabilityAI.checkSunkShip(this.compChoice);
    this.audioController.playRandomAudio("attack", 0.5);
    this.renderController.updateBoard();
    this.checkLose();

    if (
      this.human.gameboard.successfulAttack(
        this.compChoice[0],
        this.compChoice[1]
      ) &&
      !this.wonGame
    ) {
      this.eventController.startListenerTimer(500);
      setTimeout(() => {
        this.attackPlayer();
      }, 500); // Variable delay
    }
    this.prepareAttackPlayer();
  }

  checkCompletePlacedShips() {
    const shipsPlaced = this.human.gameboard.shipsPlaced;
    const startBtn = document.getElementById("start-btn");
    if (shipsPlaced.length === this.allShips.length) {
      startBtn.disabled = false;
      startBtn.classList.remove("disabled-btn");
      this.renderController.updateTextDisplay(
        "Astro armada, ready and positioned..! Press START to engage your offenses."
      );
    } else {
      startBtn.disabled = true;
      startBtn.classList.add("disabled-btn");
      this.renderController.updateTextDisplay(
        "Admiral, deploy your stellar fleets for battle."
      );
    }
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
      this.gameController.checkCompletePlacedShips();
      this.renderController.updateBoard();
      this.audioController.playAudio("deploy", 1);
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
      this.rotatationMode = shipHeadCell.shipHead.rotation;
      this.toggleRotate();
      this.toggleRotate();

      const shipImg = document.getElementById(`${length}-${variant}-board`);
      this.toggleSelectedShip(shipImg);

      // Update the board visually
      this.renderController.updateBoard();
      this.renderController.updateShipSettings();

      // Play a sound effect if needed
      this.audioController.playAudio("select", 0.7);
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
    this.difficultySelect = document.getElementById("difficulty-select");
    this.detailsAccordion = document.querySelectorAll(".details");

    this.recentlyPlacedShip = false;

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

    // Initialize
    this.gameController.restartGame(this.height, this.length);
    this.initializeListeners();
    this.setupEventListeners();
  }

  processAllShips(shipArray) {
    const result = [];

    shipArray.forEach((ship) => {
      const cleanData = {
        length: Number(ship.id.charAt(0)),
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

    this.detailsAccordion.forEach((item) => {
      item.addEventListener("click", () => {
        item.classList.toggle("active");
      });
    });

    this.probabilityBtn.addEventListener("click", () => {
      if (this.gameController.wonGame) return;
      this.renderController.toggleProbabilityMap();
      this.renderController.updateProbabilityTargets();
    });

    this.targetsBtn.addEventListener("click", () => {
      if (this.gameController.wonGame) return;
      this.renderController.toggleTargets();
      this.renderController.updateProbabilityTargets();
    });

    this.startBtn.addEventListener("click", () => {
      if (this.listenerTimerActive) return;
      if (!this.gameController.gameStarted) {
        this.renderController.renderBoard("computer");
        this.computerCells = document.querySelectorAll("#computer-board .cell");
        this.computerCellsArr = [...this.computerCells];
        this.setupComputerCellListeners();

        this.gameController.initializeGame(this.difficultySelect.value);
        this.initializeController.toggleSelectedShip(null);
        this.renderController.toggleSettingsDisplay(true);
        this.renderController.updateBoard();
        this.audioController.playAudio("startgame", 1);
      } else {
        // RESTART GAME
        this.gameController.restartGame(this.height, this.length);
        this.initializeListeners();
        this.initializeController.toggleSelectedShip(null);
        this.renderController.updateShipSettings();
        this.renderController.toggleSettingsDisplay(false);
        this.audioController.playAudio("resetgame", 1);
      }
    });

    this.rotateBtn.addEventListener("click", () => {
      this.initializeController.toggleRotate();
      this.audioController.playAudio("click", 0.7);
    });

    this.shipSettingsBtnsArr.forEach((shipSetting) => {
      shipSetting.addEventListener("click", () => {
        this.initializeController.toggleSelectedShip(shipSetting);
        this.audioController.playAudio("select", 0.6);
      });

      shipSetting.addEventListener("mouseenter", () => {
        this.audioController.playAudio("click", 0.7);
      });
    });

    this.musicBtn.addEventListener("click", () => {
      this.audioController.toggleBGMusic(this.bgMusic, this.musicBtn);
    });
  }

  initializeListeners() {
    this.humanCells = document.querySelectorAll("#human-board .cell");
    this.humanCellsArr = [...this.humanCells];
    this.setupHumanCellListeners();
    this.setupPlacedShipListeners();
  }

  setupPlacedShipListeners() {
    const humanBoard = document.getElementById("human-board");

    humanBoard.addEventListener("click", (event) => {
      if (this.gameController.gameStarted) return;

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
        if (this.listenerTimerActive) return;
        const cellIndex = parseInt(cell.id.substring(5));
        const verticalLoc = Math.floor(cellIndex / this.length);
        const horizontalLoc = cellIndex % this.length;
        this.gameController.attackComputer(verticalLoc, horizontalLoc);
        this.renderController.updateBoard();
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

  playRandomAudio(name, volume = 1) {
    const sound = new Audio();
    const number = this.getRandomNumber(4);
    sound.src = `src/assets/audio/${name}/${name}-${number}.mp3`;
    sound.volume = volume;
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
    this.showProbabilityMap = false;
    this.showTargets = false;
  }

  deleteRenderBoards() {
    const humanBoard = document.getElementById("human-board");
    const computerBoard = document.getElementById("computer-board");

    if (humanBoard) humanBoard.remove();
    if (computerBoard) computerBoard.remove();
  }

  renderStartBtn(text) {
    const startBtn = document.getElementById("start-btn");
    startBtn.textContent = text;
  }

  updateTextDisplay(text) {
    const textDisplay = document.getElementById("text-display");
    textDisplay.textContent = text;
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

  toggleExtremeAISettings(toggleOn) {
    const probabilityToggle = document.getElementById("toggle-probability");
    const targetsToggle = document.getElementById("toggle-targets");

    if (toggleOn) {
      probabilityToggle.style.display = "block";
      targetsToggle.style.display = "block";
    } else {
      probabilityToggle.style.display = "none";
      targetsToggle.style.display = "none";
    }
  }

  toggleDifficultySelect(toggleOn) {
    const settingsContainer = document.getElementById("difficulty-select");

    if (toggleOn) {
      settingsContainer.style.display = "flex";
    } else {
      settingsContainer.style.display = "none";
    }
  }

  toggleSettingsDisplay(toggleOn) {
    const settingsContainer = document.getElementById("settings-container");
    const computerContainer = document.getElementById("computer-container");

    if (toggleOn) {
      settingsContainer.style.display = "none";
      computerContainer.style.display = "flex";
    } else {
      settingsContainer.style.display = "flex";
      computerContainer.style.display = "none";
    }
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

  toggleTargets(forceOff = false) {
    const targetsBtn = document.getElementById("toggle-targets");
    if (this.showTargets || forceOff) {
      this.showTargets = false;
      targetsBtn.textContent = "TARGETS: OFF";
    } else {
      this.showTargets = true;
      targetsBtn.textContent = "TARGETS: ON";
    }
  }

  toggleProbabilityMap(forceOff = false) {
    const probabilityBtn = document.getElementById("toggle-probability");
    if (this.showProbabilityMap || forceOff) {
      this.showProbabilityMap = false;
      probabilityBtn.textContent = "PROBABILITY MAP: OFF";
    } else {
      this.showProbabilityMap = true;
      probabilityBtn.textContent = "PROBABILITY MAP: ON";
    }
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
        if (selectedCell) selectedCell.classList.remove("highlighted-cell");
        if (selectedCell) selectedCell.classList.remove("invalid-cell");
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

  sinkAllShips() {
    this.gameController.computer.gameboard.coordinates.forEach((row) => {
      row.forEach((cell) => {
        if (cell.hasShip) {
          cell.hasHit = true;
          cell.hasShip.sunk = true;
        }
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
  }
}

// LOGO
const logo = document.getElementById("logo");
// Flag to track if animation has been reset
let animationReset = false;

// Function to check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Function to handle scroll event
function handleScroll() {
  if (isInViewport(logo) && !animationReset) {
    logo.src = logo.src; // Reset the src attribute to replay the GIF animation
    animationReset = true; // Set flag to true once animation is reset
  } else if (!isInViewport(logo)) {
    animationReset = false; // Reset flag if element goes out of view
  }
}

// Add scroll event listener to window
window.addEventListener("scroll", handleScroll);
document.addEventListener("DOMContentLoaded", handleScroll);

const eventController = new EventController(10, 10);
