const Gameboard = require("./gameboardFactory");

class Player {
  constructor(type) {
    this.type = type
    this.gameboard = new Gameboard()
  }
}

module.exports = Player;
