// Source: https://dev.to/codesphere/pathfinding-with-javascript-the-a-algorithm-3jlb

let cols = 16;
let rows = 9;

let grid = new Array(cols); // Array of all the grid points

let openSet = []; // Array containing unevaluated grid points
let closedSet = []; // Array containing completely evaluated grid points

let start; // Starting grid point
let end; // Ending grid point (goal)
let path = [];

// Manhattan distance
function heuristic(p1, p2) {
    return Math.abs(p1.row - p2.row) + Math.abs(p1.col - p2.col);
}

// Constructor function to create all the grid points as objects containing the data for the points
function GridPoint(row, col) {
  this.row = row;
  this.col = col;
  this.f = 0; // Total cost function
  this.g = 0; // Cost function from start to the current grid point
  this.h = 0; // Heuristic estimated cost function from current grid point to the goal
  this.neighbors = []; // Neighbors of the current grid point
  this.parent = undefined; // Immediate source of the current grid point
  this.walkable = true;

  // Update neighbors array for a given grid point
  this.updateNeighbors = function (grid) {
    let i = this.row;
    let j = this.col;
    if (i < rows - 1 && grid[i+1][j].walkable) {
      this.neighbors.push(grid[i + 1][j]);
    }
    if (i > 0 && grid[i-1][j].walkable) {
      this.neighbors.push(grid[i - 1][j]);
    }
    if (j < cols - 1 && grid[i][j+1].walkable) {
      this.neighbors.push(grid[i][j + 1]);
    }
    if (j > 0 && grid[i][j-1].walkable) {
      this.neighbors.push(grid[i][j - 1]);
    }
  };
}

// Initializing the grid
function init(maze, startPos, endPos, unit) {
  // 2D array setup
  for (let i = 0; i < rows; i++) {
    grid[i] = new Array(rows);
  }

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      grid[i][j] = new GridPoint(i, j);
      //if(maze[i][j] === 1){ // Normal/original, number-based check
      if(!unit.canOccupyTile(maze[i][j]) || (unit.team === "enemy" && maze[i][j].containsPlayer)){ // Check specific to this game
        grid[i][j].walkable = false;
      }
    }
  }
  grid[endPos.row][endPos.col].walkable = true; // Set true to handle edge case where target position is in a tile that the unit can't occupy, but can attack

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++){
        if(grid[i][j].walkable){
            grid[i][j].updateNeighbors(grid);
        }
    }
  }

  start = grid[startPos.row][startPos.col];
  end = grid[endPos.row][endPos.col];

  openSet.push(start);
}

// A* search implementation
// Repurposed for this specific game
export function astar(maze, startPos, endPos, unit) {
  init(maze, startPos, endPos, unit);
  while (openSet.length > 0) {
    // Assumption lowest index is the first one to begin with
    let lowestIndex = 0;
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIndex].f) {
        lowestIndex = i;
      }
    }
    let current = openSet[lowestIndex];

    if (current === end) {
      let temp = current;
      //path.push(temp);
      path.push({row: temp.row, col: temp.col});
      while (temp.parent) {
        //path.push(temp.parent);
        path.push({row: temp.parent.row, col: temp.parent.col});
        temp = temp.parent;
      }
      //console.log("DONE!");
      // Return the traced path
      return path.reverse();
    }

    // Remove current from openSet
    openSet.splice(lowestIndex, 1);
    // Add current to closedSet
    closedSet.push(current);

    let neighbors = current.neighbors;

    for (let i = 0; i < neighbors.length; i++) {
      let neighbor = neighbors[i];

      if (!closedSet.includes(neighbor)) {
        let possibleG = current.g + 1;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (possibleG >= neighbor.g) {
          continue;
        }

        neighbor.g = possibleG;
        neighbor.h = heuristic(neighbor, end);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
      }
    }
  }

  // No solution by default
  return [];
}