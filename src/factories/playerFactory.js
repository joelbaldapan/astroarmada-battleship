import Gameboard from "./gameboardFactory.js";

class Player {
  constructor(type, gameController, allShips) {
    this.type = type;
    this.allShips = allShips;
    this.gameboard = new Gameboard(this.allShips);
    this.gameController = gameController;

    // AI decisions
    this.probabilityAI = new probabilityAI(this);
  }

  // For AI
  decideAI(difficulty) {
    // Random AI (BABY) -- Random | No adjacent mode

    if (difficulty === "easy") {
      return this.randomDecide();
    }

    if (this.probabilityAI.adjacentMode) {
      return this.probabilityAI.probabilityDecide("adjacent");
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
      return this.probabilityAI.probabilityDecide("extreme");
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

class probabilityAI {
  constructor(player) {
    this.player = player;
    this.shipLengths;
    this.directions = ["horizontal", "vertical"];
    this.adjacentMode;
  }

  resetShipLengths() {
    this.shipLengths = Array.from(
      this.player.gameboard.shipsPlaced.map((ship) => ship.length)
    );
  }

  probabilityDecide(type) {
    this.resetProbabilityMap();
    this.updateProbabilityMap(type);
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

  checkAdjacentMode() {
    const length = this.player.gameboard.length;
    const height = this.player.gameboard.height;
    const gameboard = this.player.gameboard;
    let stillDecide = true;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < length; x++) {
        const currentShip = this.player.gameboard.coordinates[y]?.[x]?.hasShip;
        if (stillDecide)
          if (!currentShip?.sunk && currentShip?.hits) {
            this.adjacentMode = true;
            stillDecide = false;
          } else {
            this.adjacentMode = false;
          }
      }
    }
  }

  updateProbabilityMap(type) {
    const coords = this.player.gameboard.coordinates;
    const length = this.player.gameboard.length;
    const height = this.player.gameboard.height;
    const gameboard = this.player.gameboard;

    this.shipLengths.forEach((shipLength) => {
      this.directions.forEach((direction) => {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < length; x++) {
            if (type === "extreme") {
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
            } else if (type === "adjacent") {
              const choice = gameboard.validAdjacent(
                [y, x],
                shipLength,
                direction
              );
              if (choice) {
                for (let i = 0; i < shipLength; i++) {
                  if (direction === "horizontal") {
                    if (coords[y]?.[x + i])
                      if (!coords[y][x + i].hasHit)
                        coords[y][x + i].probability += choice;
                  }
                  if (direction === "vertical") {
                    if (coords[y + i]?.[x])
                      if (!coords[y + i][x].hasHit)
                        coords[y + i][x].probability += choice;
                  }
                }
              }
            }
          }
        }
      });
    });
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
    console.log(coords);
    console.log(bestMove.location);
    return bestMove.location;
  }

  resetProbabilityMap() {
    this.highestProbability = 0;
    this.player.gameboard.coordinates.forEach((row) =>
      row.forEach((cell) => (cell.probability = 0))
    );
  }
}

export default Player;
