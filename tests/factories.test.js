import Ship from "../src/factories/shipFactory.js";
import Gameboard from "../src/factories/gameboardFactory.js";
import Player from "../src/factories/playerFactory.js";

describe("Ship Class", () => {
  let ship;
  beforeEach(() => {
    ship = new Ship(3);
  });

  it("should have a defined length, hits, and sunk property", () => {
    expect(ship).toHaveProperty("length");
    expect(ship).toHaveProperty("hits");
    expect(ship).toHaveProperty("sunk");
  });

  it("should initially have zero hits", () => {
    expect(ship.length).toBe(3);
    expect(ship.hits).toBe(0);
  });

  it("should initially have a false sunk property", () => {
    expect(ship.length).toBe(3);
    expect(ship.sunk).toBe(false);
  });

  it("should have the hit method", () => {
    expect(ship).toHaveProperty("hit");
    expect(typeof ship.hit).toBe("function");
  });

  it("should have the isSunk method", () => {
    expect(ship).toHaveProperty("isSunk");
    expect(typeof ship.isSunk).toBe("function");
  });

  it("should call the hit() method to increment hits", () => {
    ship.hit();
    ship.hit();
    expect(ship.hits).toBe(2);
  });

  it("should call the isSunk() method to check if ship has not sunk", () => {
    ship.hit();
    ship.hit();
    ship.isSunk();
    expect(ship.sunk).toBe(false);
  });

  it("should call the isSunk() method to check if ship has already sunk", () => {
    ship.hit();
    ship.hit();
    ship.hit();
    ship.isSunk();
    expect(ship.sunk).toBe(true);
  });
});

describe("Gameboard Class", () => {
  let board;
  beforeEach(() => {
    board = new Gameboard();
    board.resetBoard(3, 3);
  });

  it("should create intialize a gameboard with isShip and isHit properties", () => {
    expect(board.coordinates).toEqual([
      [
        { hasHit: false, hasShip: null, probability: 0 },
        { hasHit: false, hasShip: null, probability: 0 },
        { hasHit: false, hasShip: null, probability: 0 },
      ],
      [
        { hasHit: false, hasShip: null, probability: 0 },
        { hasHit: false, hasShip: null, probability: 0 },
        { hasHit: false, hasShip: null, probability: 0 },
      ],
      [
        { hasHit: false, hasShip: null, probability: 0 },
        { hasHit: false, hasShip: null, probability: 0 },
        { hasHit: false, hasShip: null, probability: 0 },
      ],
    ]);
  });

  it("should place ships correctly, horizontally", () => {
    board.placeShip([1, 0], 2, "horizontal"); // Location, Length, Rotation

    const expectedShip = new Ship(2); // Replica ship

    expect(board.coordinates[1][0].hasShip).toEqual(expectedShip);
    expect(board.coordinates[1][1].hasShip).toEqual(expectedShip);
  });

  it("should place ships correctly, vertically", () => {
    board.placeShip([0, 2], 3, "vertical"); // Location, Length, Rotation

    const expectedShip = new Ship(3); // Replica ship
    expect(board.coordinates[0][2].hasShip).toEqual(expectedShip);
    expect(board.coordinates[1][2].hasShip).toEqual(expectedShip);
    expect(board.coordinates[2][2].hasShip).toEqual(expectedShip);
  });

  it("should have validPlacement() method to check if ship is placed on another ship", () => {
    board.placeShip([1, 0], 3, "horizontal");

    expect(board.validPlacement([1, 0], 3, "vertical")).toBe(false);
  });

  it("should have validPlacement() method to check if ship is placed out of bounds", () => {
    expect(board.validPlacement([3, 3], 3, "vertical")).toBe(false);
  });

  it("should have receiveAttack() that takes coordinates, then records the shot", () => {
    board.receiveAttack(1, 2);
    expect(board.coordinates[1][2].hasHit).toBe(true);
  });

  it("should have receiveAttack() that calls the 'hit()' function of a ship if it's hit", () => {
    board.placeShip([1, 0], 3, "horizontal");

    board.receiveAttack(1, 0);
    board.receiveAttack(1, 2);
    expect(board.coordinates[1][2].hasShip.hits).toBe(2);
  });

  it("should have checkFinish() method to check if all ships have not sunk", () => {
    board.placeShip([1, 0], 1, "horizontal");
    board.placeShip([0, 2], 2, "vertical");

    expect(board.checkFinish()).toBe(false);
  });

  it("should have checkFinish() method to check if all ships have sunk", () => {
    board.placeShip([1, 0], 1, "horizontal");
    board.placeShip([0, 2], 2, "vertical");

    board.receiveAttack(1, 0);
    board.receiveAttack(0, 2);
    board.receiveAttack(1, 2);

    expect(board.checkFinish()).toBe(true);
  });
});

describe("Player Class", () => {
  it("should have two types of players: human and computer", () => {
    const human = new Player("human");
    const computer = new Player("computer");

    expect(human.type).toBe("human");
    expect(computer.type).toBe("computer");
  });

  it("should have its own gameboard", () => {
    const player = new Player("human");
    player.gameboard.resetBoard(2, 2);

    const gameboardCopy = new Gameboard();
    gameboardCopy.resetBoard(2, 2);

    expect(player.gameboard).toEqual(gameboardCopy);
  });
});
