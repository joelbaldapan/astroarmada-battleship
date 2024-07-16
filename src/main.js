import Player from "./factories/playerFactory.js";

const human = new Player("human");
const computer = new Player("computer");

human.gameboard.resetBoard(10, 10);
computer.gameboard.resetBoard(10, 10);

console.log(human.gameboard.coordinates);
