// 1 = floor
// 2 = hole
// 3 = wall

export class Tile {
    constructor(row, col, type, cost){
        this.frame = type;
        this.cost = cost;
        this.row = row;
        this.col = col;
        this.depth = Infinity;
        this.isObstacle = (type === 3);
        this.isGroundObstacle = (type === 2 || type === 3);
    }
}