import Player from "./factories/playerFactory.js";

class GameController {
  constructor() {
    this.human = new Player("human");
    this.computer = new Player("computer");
  }

  restartGame(height, length) {
    this.human.gameboard.resetBoard(height, length);
    this.computer.gameboard.resetBoard(height, length);
  }

  getHumanPlayer() {
    return this.human;
  }

  getComputerPlayer() {
    return this.computer;
  }
}

class EventController {
  constructor() {
    this.restartBtn = document.getElementById("restart-btn");
    this.consoleBtn = document.getElementById("console-btn");

    // Add GameController and RenderController
    this.gameController = new GameController();
    this.renderController = new RenderController(this.gameController);

    // Event listeners
    this.restartBtn.addEventListener("click", () => {
      this.gameController.restartGame(10, 10); // Adjustable height, length
    });

    this.consoleBtn.addEventListener("click", () => {
      this.renderController.consoleLog();
      this.renderController.renderBoard();
    });
  }
}

class RenderController {
  constructor(gameController) {
    this.gameController = gameController;
  }

  renderBoard() {
    // Gameboard
    const gameboardContainer = document.getElementById("gameboard-container");
    const gameboard = document.createElement("div");
    gameboard.className = "gameboard";

    // Cells
    const height = 10; // Adjustable height, length
    const length = 10;
    const totalCells = height * length;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      gameboard.appendChild(cell);
    }

    gameboard.style.gridTemplateColumns = `repeat(${length}, 1fr)`;
    gameboardContainer.appendChild(gameboard);
  }

  consoleLog() {
    const human = this.gameController.getHumanPlayer();
    const computer = this.gameController.getComputerPlayer();
    console.log("Human gameboard:", human.gameboard.coordinates);
    console.log("Computer gameboard:", computer.gameboard.coordinates);
  }
}

const eventController = new EventController();
