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
    this.computer.gameboard.placeShip([0, 1], 3, "horizontal"); //temp
    this.computer.gameboard.placeShip([1, 3], 5, "vertical"); //temp
    this.computer.gameboard.placeShip([6, 2], 5, "horizontal"); //temp
    this.computer.gameboard.placeShip([2, 8], 3, "vertical"); //temp

    this.computer.gameboard.receiveAttack(0, 1); //temp
    this.computer.gameboard.receiveAttack(4, 3); //temp
    this.computer.gameboard.receiveAttack(9, 5); //temp
  }

  attackComputer() {}
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

      this.gameController.restartGame(10, 10);
      this.gameController.temporaryInitialize(); // TEMPORARY
      this.renderController.updateBoard();
    });

    this.updateBtn.addEventListener("click", () => {
      this.renderController.updateBoard();
    });

    this.attackBtn.addEventListener("click", () => {
      this.gameController.attackComputer();
      this.renderController.updateBoard();
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

      if (boardId === "human") {
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
