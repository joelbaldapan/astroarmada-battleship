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

