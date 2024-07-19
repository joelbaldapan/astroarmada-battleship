import Ship from "./shipFactory.js";

class Gameboard {
  constructor() {
    this.coordinates;
  }

  resetBoard(height, length) {
    this.coordinates = [];
    for (let h = 0; h < height; h++) {
      this.coordinates.push([]);
      for (let l = 0; l < length; l++) {
        this.coordinates[h].push({ hasHit: false, hasShip: null });
      }
    }
  }

  placeShip(location, length, rotation) {
    const ship = new Ship(length);

    const yLoc = location[0];
    const xLoc = location[1];

    if (rotation === "horizontal") {
      if (!this.validPlacement(location, length, rotation)) return;
      for (let x = xLoc; x < xLoc + length; x++) {
        this.coordinates[yLoc][x].hasShip = ship;
      }
    }

    if (rotation === "vertical") {
      if (!this.validPlacement(location, length, rotation)) return;
      for (let y = yLoc; y < yLoc + length; y++) {
        this.coordinates[y][xLoc].hasShip = ship;
      }
    }
  }

  validPlacement(location, length, rotation) {
    const yLoc = location[0];
    const xLoc = location[1];

    if (rotation === "horizontal") {
      for (let x = xLoc; x < xLoc + length; x++) {
        if (this.coordinates[yLoc]?.[x]?.hasShip !== null) return false;
      }
    }

    if (rotation === "vertical") {
      for (let y = yLoc; y < yLoc + length; y++) {
        if (this.coordinates[y]?.[xLoc]?.hasShip !== null) return false;
      }
    }
    return true;
  }

  validAttack(vertical, horizontal) {
    // Check if undefined
    if (this.coordinates[vertical]?.[horizontal]?.hasHit === undefined)
      return false;

    if (this.coordinates[vertical][horizontal].hasHit) return false;
    return true;
  }

  receiveAttack(vertical, horizontal) {
    const cell = this.coordinates[vertical][horizontal];
    if (cell.hasHit) return;
    cell.hasHit = true;
    if (cell.hasShip) cell.hasShip.hit();
  }

  checkFinish() {
    return !this.coordinates.some((row) =>
      row.some((cell) => cell.hasShip !== null && !cell.hasShip.sunk)
    );
  }
}

export default Gameboard;
