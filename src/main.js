import Player from "./factories/playerFactory.js";

class GameController {
  constructor(height, length) {
    this.height = height;
    this.length = length;
    this.human = new Player("human", this);
    this.computer = new Player("computer", this);

    // renderController
    this.renderController;
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

  temporaryInitialize() {
    // FOR DEBUGGING CODE PURPOSES TEMPORARY
    this.computer.gameboard.placeShip([0, 1], 2, "horizontal"); //temp
    this.computer.gameboard.placeShip([2, 3], 3, "vertical"); //temp
    this.computer.gameboard.placeShip([6, 2], 5, "horizontal"); //temp
    this.computer.gameboard.placeShip([2, 8], 3, "vertical"); //temp
    this.computer.gameboard.placeShip([8, 4], 4, "horizontal"); //temp

    this.human.gameboard.placeShip([2, 1], 2, "vertical"); //temp
    this.human.gameboard.placeShip([2, 5], 3, "vertical"); //temp
    this.human.gameboard.placeShip([7, 0], 5, "horizontal"); //temp
    this.human.gameboard.placeShip([4, 8], 4, "vertical"); //temp
    this.human.gameboard.placeShip([9, 4], 3, "horizontal"); //temp

    // this.human.gameboard.placeShip([0, 0], 5, "horizontal"); //temp
    // this.human.gameboard.placeShip([5, 0], 2, "horizontal"); //temp
    this.human.extremeAI.resetShipLengths();
  }

  attackComputer(verticalLoc, horizontalLoc) {
    if (!this.computer.gameboard.validAttack(verticalLoc, horizontalLoc))
      return;
    this.computer.gameboard.receiveAttack(verticalLoc, horizontalLoc);
    if (!this.computer.gameboard.successfulAttack(verticalLoc, horizontalLoc))
      this.attackPlayer();
  }

  attackPlayer() {
    const compChoice = this.human.decideAI("extreme"); // adjustable
    this.human.gameboard.receiveAttack(compChoice[0], compChoice[1]);
    this.human.adjacentAI.checkAdjacentMode(compChoice);
    this.human.extremeAI.checkSunkShip(compChoice);
    this.renderController.updateBoard();

    if (this.human.gameboard.successfulAttack(compChoice[0], compChoice[1])) {
      setTimeout(() => {
        console.log("Timeout fired, attacking again");
        this.attackPlayer();
      }, 200); // Variable delay
    }
  }
}

class InitializeController {
  constructor() {
    this.totalShips = [];
    this.placedShips = [];
    this.rotatationMode = "vertical";
    this.selectedShip = null;
  }

  toggleRotate() {
    if (this.rotatationMode === "vertical") this.rotatationMode = "horizontal";
    else this.rotatationMode = "vertical";
  }

  toggleSelectedShip(ship) {
    this.selectedShip(ship);
  }
}

class EventController {
  constructor(height, length) {
    this.height = height;
    this.length = length;
    this.restartBtn = document.getElementById("restart-btn");
    this.consoleBtn = document.getElementById("console-btn");
    this.renderBtn = document.getElementById("render-btn");
    this.updateBtn = document.getElementById("update-btn");
    this.attackBtn = document.getElementById("attack-btn");
    this.startBtn = document.getElementById("start-btn");
    this.rotateBtn = document.getElementById("rotate-btn");
    this.shipSettingsBtn = document.querySelectorAll(
      ".ship-size-container img"
    );
    this.settings = document.getElementById("settings");

    this.gameController = new GameController(height, length);
    this.renderController = new RenderController(this.gameController);
    this.initializeController = new InitializeController(this.renderController);
    this.gameController.renderController = this.renderController;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.restartBtn.addEventListener("click", () => {
      this.gameController.restartGame();
    });

    this.consoleBtn.addEventListener("click", () => {
      this.renderController.consoleLog();
    });

    this.renderBtn.addEventListener("click", () => {
      this.renderHumanBoard();
    });

    this.startBtn.addEventListener("click", () => {
      this.renderController.renderBoard("computer");
      this.computerCells = document.querySelectorAll("#computer-board .cell");
      this.computerCellsArr = [...this.computerCells];

      this.gameController.temporaryInitialize(); // TEMPORARY
      this.gameController.human.extremeAI.resetShipLengths();
      this.renderController.updateBoard();
      this.settings.style.display = "none";

      // Set up computer cell listeners after getting computerCells array
      this.setupComputerCellListeners();
    });

    this.rotateBtn.addEventListener("click", () => {
      this.initializeController.toggleRotate();
    });

    Array.from(this.shipSettingsBtn).forEach((shipSetting) => {
      shipSetting.addEventListener("click", () => {
        this.initializeController.toggleSelectedShip(shipSetting);
      });
    });
  }

  renderHumanBoard() {
    this.gameController.restartGame(this.height, this.length);
    this.renderController.renderBoard("human");
  }

  setupComputerCellListeners() {
    this.computerCellsArr.forEach((cell) => {
      cell.addEventListener("click", () => {
        const cellIndex = parseInt(cell.id.substring(5));
        const verticalLoc = Math.floor(cellIndex / this.length);
        const horizontalLoc = cellIndex % this.length;
        this.gameController.attackComputer(verticalLoc, horizontalLoc);
        this.renderController.updateBoard();
      });
    });
  }
}

class RenderController {
  constructor(gameController) {
    this.gameController = gameController;
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
      shipImg.classList.add("sunk-img");

      const targetCell = document.querySelector(
        `#${boardId} #cell-${cellIndex}`
      );

      targetCell.appendChild(shipImg);
    }
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
    // console.log("Human gameboard:", human.gameboard.coordinates);
    // console.log("Computer gameboard:", computer.gameboard.coordinates);
    console.log("Human:", human.gameboard.coordinates);
    console.log("Computer:", computer.gameboard.coordinates);
  }
}

const eventController = new EventController(10, 10);
eventController.renderHumanBoard();
