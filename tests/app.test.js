const Ship = require("../src/app");

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

describe("Gameboard", () => {
  let board;
  beforeEach(() => {
    const board = new board(3, 3);
  });

  it("should create intialize a gameboard with isShip and isHit properties", () => {
    const board = new gameboard(2, 2); // Two by two grid
    expect(board.coordinates).toBe([
      [
        { hasHit: false, hasShip: false },
        { hasHit: false, hasShip: false },
      ],
      [
        { hasHit: false, hasShip: false },
        { hasHit: false, hasShip: false },
      ],
    ]);
  });

  it("should place ships correctly, horizontally", () => {
    board.placeShip([1, 0], 2, "horizontal"); // Location, Length, Rotation
    expect(board.coordinates[1][0].hasShip).toBe(ship);
    expect(board.coordinates[1][1].hasShip).toBe(ship);
  });

  it("should place ships correctly, vertically", () => {
    board.placeShip([0, 2], 3, "vertical"); // Location, Length, Rotation
    expect(board.coordinates[0][2].hasShip).toBe(ship);
    expect(board.coordinates[1][2].hasShip).toBe(ship);
    expect(board.coordinates[2][2].hasShip).toBe(ship);
  });

  it("should have receiveAttack() that takes coordinates, then records the shot", () => {
    board.receiveAttack([1, 2]);
    expect(board.coordinates[1][2].hasHit).toBe(true);
  });

  it("should have receiveAttack() that calls the 'hit()' function of a ship if it's hit", () => {
    board.receiveAttack([1, 2]);
    expect(board.coordinates[1][2]).toBe("X");
  });

  it("should have checkFinish() method to check if all ships have not sunk", () => {
    board.placeShip([1, 0], 1, "horizontal");
    board.placeShip([0, 3], 2, "vertical");

    expect(board.checkFinish()).toBe(false);
  });

  it("should have checkFinish() method to check if all ships have sunk", () => {
    board.placeShip([1, 0], 1, "horizontal");
    board.placeShip([0, 3], 2, "vertical");

    board.receiveAttack([1, 0]);
    board.receiveAttack([0, 3]);
    board.receiveAttack([1, 3]);

    expect(board.checkFinish()).toBe(true);
  });
});
