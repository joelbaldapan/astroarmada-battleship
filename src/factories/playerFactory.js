import Gameboard from "./gameboardFactory";

class Player {
  constructor(type) {
    this.type = type
    this.gameboard = new Gameboard()
  }
}

export default Player;