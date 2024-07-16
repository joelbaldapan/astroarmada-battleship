import Gameboard from "./gameboardFactory.js";

class Player {
  constructor(type) {
    this.type = type
    this.gameboard = new Gameboard()
  }
}

export default Player;