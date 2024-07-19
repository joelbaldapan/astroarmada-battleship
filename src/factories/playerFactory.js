import Gameboard from "./gameboardFactory.js";

class Player {
  constructor(type, gameController) {
    this.type = type;
    this.gameboard = new Gameboard();
    this.gameController = gameController;

    // AI decisions
    this.adjacentMode = false;
    this.checkHorizontal = null;
    this.checkPositive = null;

    this.originalPosition = null;
    this.currentPosition = null;
    this.tries = 0;
  }

  // For AI
  decideAI(difficulty) {
    // Random AI (BABY) -- Random | No adjacent mode

    if (difficulty === "easy") {
      return this.randomDecide();
    }

    if (this.adjacentMode) {
      return this.adjacentDecide();
    }

    // Choose Adjacent AI (NORMAL) -- Random | Has adjacent mode
    if (difficulty === "medium") {
      return this.randomDecide();
    }

    // Checkerboard AI (HARD) -- Checkerboard | Has adjacent mode

    // Probability Map AI (EXTREME) -- Calculate proba map | Has adjacent mode
  }

  adjacentDecide() {
    let index;
    if (this.checkHorizontal) index = 1; // 0 = Horizontal
    else index = 0; // 1 = Vertical

    if (this.checkPositive) this.currentPosition[index]++;
    else this.currentPosition[index]--;

    // Check if the adjacent space is invalid
    if (
      !this.gameController.human.gameboard.validAttack(
        this.currentPosition[0],
        this.currentPosition[1]
      )
    ) {
      this.adjacentMiss();
      return this.adjacentDecide();
    }

    return this.currentPosition;
  }

  initalizeAdjacentDecide(currentLocation) {
    // 50% chance of start checking horizontal/vertical
    this.checkHorizontal = this.randomBoolean();

    // 50% chance to start (positive) left-right, up-down | vice versa
    this.checkPositive = this.randomBoolean();

    console.log("initialized.");
    this.adjacentMode = true;
    this.originalPosition = Array.from(currentLocation);
    this.currentPosition = Array.from(currentLocation);
    this.tries = 4;
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
      this.gameboard.coordinates[location[0]][location[1]].hasHit &&
      this.gameboard.coordinates[location[0]][location[1]].hasShip
    ) {
      console.log("adjacentMode!");
      // Hit a ship. Initalize/keep adjacentMode
      if (!this.adjacentMode) this.initalizeAdjacentDecide(location);
      return;
    } else {
      // Missed, so evaluate what to do
      console.log("Missed.");
      this.adjacentMiss();
    }
  }

  adjacentMiss() {
    if (!this.tries) return this.resetAdjacentMode();

    // After checking to the twice from both directions, then switch axis
    if (this.tries === 2) {
      this.checkHorizontal = !this.checkHorizontal;
    } else {
      this.checkPositive = !this.checkPositive;
    }

    this.tries--;
    this.currentPosition = Array.from(this.originalPosition);
  }

  randomBoolean(choice) {
    return this.getRandomNumber(2) === 1;
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

export default Player;
