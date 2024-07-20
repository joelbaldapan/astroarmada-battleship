import Gameboard from "./gameboardFactory.js";

class Player {
  constructor(type, gameController) {
    this.type = type;
    this.gameboard = new Gameboard();
    this.gameController = gameController;

    // AI decisions
    this.adjacentAI = new AdjacentAI(this);
    this.extremeAI = new ExtremeAI(this);
  }

  // For AI
  decideAI(difficulty) {
    // Random AI (BABY) -- Random | No adjacent mode

    if (difficulty === "easy") {
      return this.randomDecide();
    }

    if (this.adjacentAI.adjacentMode) {
      return this.adjacentAI.adjacentDecide();
    }

    // Choose Adjacent AI (NORMAL) -- Random | Has adjacent mode
    if (difficulty === "medium") {
      return this.randomDecide();
    }

    // Checkerboard AI (HARD) -- Checkerboard | Has adjacent mode
    if (difficulty === "hard") {
      const location = this.randomDecide();
      // If even, then it is valid
      if ((location[0] + location[1]) % 2 === 0) return location;
      return this.decideAI("hard");
    }

    // Probability Map AI (EXTREME) -- Calculate proba map | Has adjacent mode
    if (difficulty === "extreme") {
      return this.extremeAI.extremeDecide();
    }
  }

  randomDecide() {
    const y = this.getRandomNumber(this.gameController.height);
    const x = this.getRandomNumber(this.gameController.length);
    if (!this.gameController.human.gameboard.validAttack(y, x))
      return this.randomDecide();
    return [y, x];
  }

  getRandomNumber(max) {
    return Math.floor(Math.random() * max);
  }
}

class ExtremeAI {
  constructor(player) {
    this.player = player;
    this.shipLengths;
    this.directions = ["horizontal", "vertical"];
  }

  resetShipLengths() {
    this.shipLengths = Array.from(this.player.gameboard.shipsPlaced);
  }

  extremeDecide() {
    this.resetProbabilityMap();
    this.updateProbabilityMap();
    return this.getBestProbability();
  }

  checkSunkShip(location) {
    const currentShip =
      this.player.gameboard.coordinates[location[0]][location[1]].hasShip;

    // Remove sunk ship in shipLengths
    if (currentShip && currentShip.sunk) {
      const index = this.shipLengths.indexOf(currentShip.length);
      if (index !== -1) this.shipLengths.splice(index, 1);
    }
  }

  updateProbabilityMap() {
    const coords = this.player.gameboard.coordinates;
    const length = this.player.gameboard.length;
    const height = this.player.gameboard.height;
    const gameboard = this.player.gameboard;

    this.shipLengths.forEach((shipLength) => {
      this.directions.forEach((direction) => {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < length; x++) {
            if (gameboard.validHitPlacement([y, x], shipLength, direction)) {
              for (let i = 0; i < shipLength; i++) {
                if (direction === "horizontal") {
                  coords[y][x + i].probability++;
                }
                if (direction === "vertical") {
                  coords[y + i][x].probability++;
                }
              }
            }
          }
        }
      });
    });
    console.log(coords);
  }

  getBestProbability() {
    const coords = this.player.gameboard.coordinates;
    const length = this.player.gameboard.length;
    const height = this.player.gameboard.height;
    let bestMove = { location, probability: 0 };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < length; x++) {
        if (coords[y][x].probability === bestMove.probability) {
          // If equal probability, then choose 50/50
          if (this.player.getRandomNumber(2)) {
            bestMove.probability = coords[y][x].probability;
            bestMove.location = [y, x];
          }
        }
        if (coords[y][x].probability > bestMove.probability) {
          // If more than probability, then replace bestMove
          bestMove.probability = coords[y][x].probability;
          bestMove.location = [y, x];
        }
      }
    }

    return bestMove.location;
  }

  resetProbabilityMap() {
    this.highestProbability = 0;
    this.player.gameboard.coordinates.forEach((row) =>
      row.forEach((cell) => (cell.probability = 0))
    );
  }
}

class AdjacentAI {
  constructor(player) {
    this.player = player;

    this.adjacentMode = false;
    this.checkHorizontal = null;
    this.checkPositive = null;

    this.originalPosition = null;
    this.currentPosition = null;
    this.tries = 0;
  }

  adjacentDecide() {
    let index;
    if (this.checkHorizontal) index = 1; // 0 = Horizontal
    else index = 0; // 1 = Vertical

    if (this.checkPositive) this.currentPosition[index]++;
    else this.currentPosition[index]--;

    // Check if the adjacent space is invalid
    if (
      !this.player.gameController.human.gameboard.validAttack(
        this.currentPosition[0],
        this.currentPosition[1]
      )
    ) {
      this.adjacentMiss();
      return this.player.decideAI("medium");
    }

    return this.currentPosition;
  }

  initalizeAdjacentDecide(currentLocation) {
    // 50% chance of start checking horizontal/vertical
    this.checkHorizontal = this.randomBoolean();

    // 50% chance to start (positive) left-right, up-down | vice versa
    this.checkPositive = this.randomBoolean();

    this.adjacentMode = true;
    this.originalPosition = Array.from(currentLocation);
    this.currentPosition = Array.from(currentLocation);
    this.tries = 5;
  }

  resetAdjacentMode() {
    this.adjacentMode = false;
    this.checkHorizontal = null;
    this.checkPositive = null;

    this.originalPosition = null;
    this.currentPosition = null;
    this.tries = 0;
  }

  checkAdjacentMode(location) {
    if (
      this.player.gameboard.coordinates[location[0]][location[1]].hasHit &&
      this.player.gameboard.coordinates[location[0]][location[1]].hasShip
    ) {
      // Hit a ship. Initalize/keep adjacentMode
      if (!this.adjacentMode) return this.initalizeAdjacentDecide(location);

      // Found the direction on first try
      if (this.tries >= 4) {
        this.tries = 1;
      }
    } else {
      // Missed, so evaluate what to do
      this.adjacentMiss();
    }
  }

  adjacentMiss() {
    if (!this.tries) return this.resetAdjacentMode();

    // After checking to the twice from both directions, then switch axis
    if (this.tries === 3) {
      this.checkHorizontal = !this.checkHorizontal;
    } else {
      this.checkPositive = !this.checkPositive;
    }

    this.tries--;
    this.currentPosition = Array.from(this.originalPosition);
  }

  randomBoolean() {
    return this.player.getRandomNumber(2) === 1;
  }
}

export default Player;
