import Ship from "./shipFactory.js";

class Gameboard {
  constructor(allShips) {
    this.coordinates;
    this.length;
    this.height;
    this.shipsPlaced = [];
    this.allShips = allShips;
  }

  resetBoard(height, length) {
    this.length = length;
    this.height = height;
    this.shipsPlaced = [];

    this.coordinates = [];
    for (let h = 0; h < height; h++) {
      this.coordinates.push([]);
      for (let l = 0; l < length; l++) {
        this.coordinates[h].push({
          hasHit: false,
          hasShip: null,
          probability: 0,
          shipHead: false,
        });
      }
    }
  }

  placeShip(location, length, rotation, variant) {
    const ship = new Ship(length);

    const yLoc = location[0];
    const xLoc = location[1];

    if (!this.validPlacement(location, length, rotation)) return;

    this.checkVariants(length, variant);
    this.shipsPlaced.push({ length: ship.length, variant: variant });

    // Mark head of the ship
    this.coordinates[yLoc][xLoc].shipHead = {
      length: length,
      rotation: rotation,
      variant: variant,
    };

    if (rotation === "horizontal") {
      for (let x = xLoc; x < xLoc + length; x++) {
        this.coordinates[yLoc][x].hasShip = ship;
      }
    }

    if (rotation === "vertical") {
      for (let y = yLoc; y < yLoc + length; y++) {
        this.coordinates[y][xLoc].hasShip = ship;
      }
    }
  }

  checkVariants(length, variant) {
    console.log(this.shipsPlaced);
    console.log(length, variant);

    const index = this.shipsPlaced.findIndex(
      (ship) => ship.length === length && ship.variant === variant
    );

    if (index !== -1) {
      console.log("Exists!");
      // Found existing ship
      return this.deleteShip(length, variant)
    }
    console.log("DNE!");
    // Ship was not found
  }

  deleteShip(length, variant) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.length; x++) {
        const cell = this.coordinates[y][x];
        if (
          cell.shipHead &&
          cell.shipHead.length === length &&
          cell.shipHead.variant === variant
        ) {
          // Found the ship head, now delete the ship
          const rotation = cell.shipHead.rotation;

          if (rotation === "horizontal") {
            for (let i = x; i < x + length; i++) {
              if (i < this.length) {
                this.coordinates[y][i].hasShip = null;
                this.coordinates[y][i].shipHead = false;
              }
            }
          } else if (rotation === "vertical") {
            for (let i = y; i < y + length; i++) {
              if (i < this.height) {
                this.coordinates[i][x].hasShip = null;
                this.coordinates[i][x].shipHead = false;
              }
            }
          }
          return true; // Ship found and deleted
        }
      }
    }
    return false; // Ship not found
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

  validHitPlacement(location, length, rotation) {
    const yLoc = location[0];
    const xLoc = location[1];

    if (rotation === "horizontal") {
      for (let x = xLoc; x < xLoc + length; x++) {
        if (this.coordinates[yLoc]?.[x]?.hasHit === undefined) return false;
        if (this.coordinates[yLoc]?.[x]?.hasHit) return false;
      }
    }

    if (rotation === "vertical") {
      for (let y = yLoc; y < yLoc + length; y++) {
        if (this.coordinates[y]?.[xLoc]?.hasHit === undefined) return false;
        if (this.coordinates[y]?.[xLoc]?.hasHit) return false;
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

  successfulAttack(vertical, horizontal) {
    const cell = this.coordinates[vertical][horizontal];
    if (cell.hasShip) return true;
  }

  checkFinish() {
    return !this.coordinates.some((row) =>
      row.some((cell) => cell.hasShip !== null && !cell.hasShip.sunk)
    );
  }
}

export default Gameboard;
