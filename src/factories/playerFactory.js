import Gameboard from "./gameboardFactory.js";

class Player {
  constructor(type, gameController) {
    this.type = type;
    this.gameboard = new Gameboard();
    this.gameController = gameController;
  }

  // For AI
  decideAI(difficulty) {
    // Random AI (BABY) -- Random | No adjacent mode

    if ((difficulty = "easy")) {
      return this.randomDecide();
    }

    // Choose Adjacent AI (NORMAL) -- Random | Has adjacent mode
    if ((difficulty = "medium")) {
      const y = this.getRandomNumber(this.gameController.height);
      const x = this.getRandomNumber(this.gameController.length);
      console.log(this.gameController.human.gameboard.validAttack(y, x));
      if (!this.gameController.human.gameboard.validAttack(y, x))
        return this.decideAI("easy");
      return [y, x];
    }

    // Checkerboard AI (HARD) -- Checkerboard | Has adjacent mode

    // Probability Map AI (EXTREME) -- Calculate proba map | Has adjacent mode
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
