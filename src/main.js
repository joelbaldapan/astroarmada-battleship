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

  attack(board) {
    let player;
    if (board === "human") player = this.human;
    else player = this.computer;

    player.gameboard.placeShip([0, 1], 2, "horizontal");
    player.gameboard.receiveAttack(0, 1); //temp
    player.gameboard.receiveAttack(4, 3); //temp
    player.gameboard.receiveAttack(10, 3); //temp
  }
}

class EventController {
  constructor() {
    this.restartBtn = document.getElementById("restart-btn");
    this.consoleBtn = document.getElementById("console-btn");
    this.renderBtn = document.getElementById("render-btn");
    this.updateBtn = document.getElementById("update-btn");
    this.attackBtn = document.getElementById("attack-btn");

    // Add GameController and RenderController
    this.gameController = new GameController();
    this.renderController = new RenderController(this.gameController);

    // Event listeners
    this.restartBtn.addEventListener("click", () => {
      this.gameController.restartGame(10, 10); // Adjustable height, length
    });

    this.consoleBtn.addEventListener("click", () => {
      this.renderController.consoleLog();
    });

    this.renderBtn.addEventListener("click", () => {
      this.renderController.renderBoard("human");
      this.renderController.renderBoard("computer");
    });

    this.updateBtn.addEventListener("click", () => {
      this.renderController.updateBoard();
    });

    this.attackBtn.addEventListener("click", () => {
      this.gameController.attack("computer");
      this.renderController.updateBoard("");
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
      if (board.id === "human") {
        player = this.gameController.getHumanPlayer();
      } else {
        player = this.gameController.getComputerPlayer();
      }

      let cellIndex = 0;
      player.gameboard.coordinates.forEach((row) => {
        row.forEach((cell) => {
          this.checkUpdateCell(cell, cellIndex);
          cellIndex++;
        });
      });
    });
  }

  checkUpdateCell(cell, cellIndex) {
    if (cell.hasHit) {
      const imgElement = document.createElement("img");
      imgElement.src = "/src/assets/images/gameboard/hit.png";
      if (cell.hasShip)
        imgElement.src = "/src/assets/images/gameboard/hit-and-ship.png";

      const targetCell = document.getElementById(`cell-${cellIndex}`);
      targetCell.innerHTML = ""; // Remove all children
      targetCell.appendChild(imgElement);
    }
  }

  renderBoard(player) {
    // Gameboard
    const gameboardContainer = document.getElementById("gameboard-container");
    const gameboard = document.createElement("div");
    gameboard.className = "gameboard";
    gameboard.id = player;

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

const eventController = new EventController();
