const Gameboard = require("./gameboardFactory");

class Player {
  constructor(type, boardHeight, boardLength) {
    this.type = type
    this.gameboard = new Gameboard(boardHeight, boardLength)
  }
}

module.exports = Player;
