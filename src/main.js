import Player from "./factories/playerFactory.js";

class GameController {
  constructor() {
    this.human = new Player("human");
    this.computer = new Player("computer");
  }

  getHumanPlayer() {
    return this.human;
  }

  getComputerPlayer() {
    return this.computer;
  }

  restartGame(height, length) {
    this.human.gameboard.resetBoard(height, length);
    this.computer.gameboard.resetBoard(height, length);
  }

  temporaryInitialize() {
    // FOR DEBUGGING CODE PURPOSES TEMPORARY
    this.computer.gameboard.placeShip([0, 1], 2, "horizontal"); //temp
    this.computer.gameboard.placeShip([2, 3], 3, "vertical"); //temp
    this.computer.gameboard.placeShip([6, 2], 5, "horizontal"); //temp
    this.computer.gameboard.placeShip([2, 8], 3, "vertical"); //temp
    this.computer.gameboard.placeShip([8, 4], 4, "horizontal"); //temp
  }

  attackComputer(verticalLoc, horizontalLoc) {
    this.computer.gameboard.receiveAttack(verticalLoc, horizontalLoc);
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

    this.gameController = new GameController();
    this.renderController = new RenderController(this.gameController);

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.restartBtn.addEventListener("click", () => {
      this.gameController.restartGame(this.height, this.length);
    });

    this.consoleBtn.addEventListener("click", () => {
      this.renderController.consoleLog();
    });

    this.renderBtn.addEventListener("click", () => {
      this.renderController.renderBoard("human");
      this.renderController.renderBoard("computer");
      this.computerCells = document.querySelectorAll("#computer-board .cell");
      this.computerCellsArr = [...this.computerCells];

      this.gameController.restartGame(this.height, this.length);
      this.gameController.temporaryInitialize(); // TEMPORARY
      this.renderController.updateBoard();

      // Set up computer cell listeners after getting computerCells array
      this.setupComputerCellListeners();
    });

    this.updateBtn.addEventListener("click", () => {
      this.renderController.updateBoard();
    });

    this.attackBtn.addEventListener("click", () => {
      this.gameController.attackComputer();
      this.renderController.updateBoard();
    });
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
          this.checkUpdateCell(cell, cellIndex, boardId);
          cellIndex++;
        });
      });
    });
  }

  checkUpdateCell(cell, cellIndex, boardId) {
    if (cell.hasHit) {
      const imgElement = document.createElement("img");
      imgElement.src = "/src/assets/images/gameboard/hit.png";
      if (cell.hasShip)
        imgElement.src = "/src/assets/images/gameboard/hit-and-ship.png";

      const targetCell = document.querySelector(
        `#${boardId} #cell-${cellIndex}`
      );
      targetCell.innerHTML = ""; // Remove all children
      targetCell.classList.add("has-hit");
      targetCell.appendChild(imgElement);
    }
    if (cell.hasShip) {
      const targetCell = document.querySelector(
        `#${boardId} #cell-${cellIndex}`
      );
      targetCell.style.backgroundColor = "gray";
    } // TEMPORARY
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
    console.log("Human gameboard:", human.gameboard.coordinates);
    console.log("Computer gameboard:", computer.gameboard.coordinates);
  }
}

const eventController = new EventController(10, 10);
