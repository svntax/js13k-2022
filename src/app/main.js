import { init, initKeys, initPointer, onPointer, GameLoop, Scene, Sprite, TileEngine, track, Button, randInt } from "./kontra.js";
//import { zzfx, zzfxP } from "./zzfx.js";
//import { zzfxM } from "./zzfxm.min.js";

import { initContract } from "./utils.js";

import { Tile } from "./Tile.js";

import lich from "../img/lich.png";
import tiles from "../img/tiles.png";
import skelebird from "../img/skelebird.png";
import skeleton_sprite from "../img/skeleton.png";
import knight_sprite from "../img/knight.png";
import bird_sprite from "../img/bird.png";
import { Unit, UnitType, UnitState } from "./entities/Unit.js";

// Credits to https://github.com/ezig/strategy-game for the tile-based movement system.

let { canvas } = init();
initKeys();
initPointer({radius: 0.5});

// TODO: zzfxm testing
const song = [];
//let mySongData = zzfxM(...song);
//let myAudioNode = null;

async function testContractMethod(){
    const levels = await window.contract.getLevels();
    console.log(levels);
}

let gameObjects = Scene({
    id: "gameObjects"
});
let player, enemy, skeleton, bird, enemyBird;

let stayBtn = Button({
    x: 236,
    y: 32,
    anchor: {x: 0.5, y: 0.5},
    padX: 4,
    padY: 2,
    text: {
        text: "Stay",
        color: "white",
        font: "12px Arial, sans-serif",
        anchor: {x: 0.5, y: 0.5}
    },

    onUp(){
        if(selectedUnit != null && selectedUnit.state === UnitState.Ready){
            selectedUnit.state = UnitState.Attack;
            clearDraw();
            drawRange(selectedUnit);
        }
    },

    render(){
        if(this.hovered){
            this.textNode.color = "#ff004d";
        }
        else{
            this.textNode.color = "white";
        }
        this.context.lineWidth = 2;
        this.context.strokeStyle = this.textNode.color;
        this.context.strokeRect(0, -1, this.width, this.height);
    }
});
let endBtn = Button({
    x: 236,
    y: 12,
    anchor: {x: 0.5, y: 0.5},
    padX: 4,
    padY: 2,
    text: {
        text: "End",
        color: "white",
        font: "12px Arial, sans-serif",
        anchor: {x: 0.5, y: 0.5}
    },

    onUp(){ // End your turn completely
        for(let i = 0; i < playerUnits.length; i++){
            playerUnits[i].state = UnitState.Finished;
        }
        selectedUnit = null;
        enterState(GameState.EnemyTurn);
    },

    render(){
        if(this.hovered){
            this.textNode.color = "#ff004d";
        }
        else{
            this.textNode.color = "white";
        }
        this.context.lineWidth = 2;
        this.context.strokeStyle = this.textNode.color;
        this.context.strokeRect(0, -1, this.width, this.height);
    }
});

// Array of tile data objects, used to calculate grid-based movement
let grid = [];
// Array of sprites that represent the tiles a selected unit can move to
let drawn = [];

let playerUnits = [];
let enemyUnits = [];
let selectedUnit = null;

const GameState = {PlayerTurn: 0, EnemyTurn: 1};
let gameState = 0;

// Tilemap setup
let tileMap = Scene({
    id: "tileMap"
});
let tileset = new Image();
tileset.src = "../img/tiles.png";
tileset.onload = function(){
    let tileEngine = TileEngine({
        tilewidth: 16,
        tileheight: 16,
        width: 16,
        height: 9,
        tilesets: [{
            firstgid: 1,
            image: tileset
        }],
        layers: [{
            name: "main",
            data: [ 3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,
                    3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,
                    3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,
                    3,1,1,1,1,1,1,1,1,1,1,3,3,1,1,3,
                    3,1,1,1,1,1,1,1,1,1,1,1,3,1,1,3,
                    3,1,1,1,1,1,1,2,2,1,1,3,3,1,1,3,
                    3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,
                    3,1,1,1,1,1,1,2,2,1,1,1,1,1,1,3,
                    3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,
                    ]
        }]
    });
    tileMap.add(tileEngine);

    // Set up tile data objects
    for(let i = 0; i < tileEngine.height; i++){
        grid[i] = [];
    }
    for(let i = 0; i < tileEngine.layers[0].data.length; i++){
        const tileType = tileEngine.layers[0].data[i];
        const row = Math.floor(i / tileEngine.width);
        const col = i % tileEngine.width;
        grid[row][col] = new Tile(row, col, tileType, 1);
    }

    // Add units
    player = new Unit(gameObjects, grid, {
        moves: 2, range: 1, maxHealth: 10, team: "player", damage: [1, 2],
        row: 3, col: 5,
        unitType: UnitType.Ground, imagePath: "../img/lich.png", frames: [0,1]
    });
    playerUnits.push(player);

    // TODO: temporary, units should spawn from dead enemies
    bird = new Unit(gameObjects, grid, {
        moves: 2, range: 1, maxHealth: 5, team: "player", damage: [1, 2],
        row: 5, col: 4,
        unitType: UnitType.Flying, imagePath: "../img/skelebird.png", frames: [0,1]
    });
    playerUnits.push(bird);

    skeleton = new Unit(gameObjects, grid, {
        moves: 2, range: 1, maxHealth: 10, team: "player", damage: [2, 3],
        row: 5, col: 2,
        unitType: UnitType.Ground, imagePath: "../img/skeleton.png", frames: [0,1]
    });
    playerUnits.push(skeleton);

    enemy = new Unit(gameObjects, grid, {
        moves: 2, range: 1, maxHealth: 10, team: "enemy", damage: [2, 3],
        row: 6, col: 11,
        unitType: UnitType.Ground, imagePath: "../img/knight.png", frames: [0,1]
    });
    enemyUnits.push(enemy);

    enemyBird = new Unit(gameObjects, grid, {
        moves: 2, range: 1, maxHealth: 5,
        row: 4, col: 11,
        team: "enemy", unitType: UnitType.Flying, imagePath: "../img/bird.png", frames: [0,1]
    });
    enemyUnits.push(enemyBird);
};

function getNeighbors(tile){
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let neighbors = [];
    for(let i = 0; i < dirs.length; i++){
        let col = tile.col + dirs[i][0];
        let row = tile.row + dirs[i][1];
        if(row >= 0 && row <= grid.length - 1 && col >= 0 && col <= grid[0].length - 1){
            neighbors.push(grid[row][col]);
        }
    }
    return neighbors;
}

// Calculate all tiles the given unit can move to.
function getRange(unit){
    let visited = [];
    let frontier = [];
    const attacking = unit.state === UnitState.Attack;

    // Reset the grid first
    for(let i = 0; i < grid.length; i++) {
        for(let j = 0; j < grid[0].length; j++) {
            grid[i][j].depth = Infinity;
        }
    }

    let tile = grid[unit.row][unit.col];
    tile.depth = 0;

    frontier.push(tile);
    if(unit.state === UnitState.Finished) return frontier; // Don't calculate if unit is done this turn
    visited.push(tile);

    while(frontier.length != 0){
        let current = frontier.shift();
        // If attacking, don't consider obstacles in the search.
        if(visited.indexOf(current) == -1 && ((!attacking && unit.canOccupyTile(current)) || attacking)){
            visited.push(current);
        }

        let neighbors = getNeighbors(current);
        for(let i = 0; i < neighbors.length; i++){
            if(attacking){ // Consider all tiles as having a cost of 1 (Note: walls could block ranged projectiles here if desired)
                let nd = current.depth + 1;
                if(nd > unit.range){
                    continue;
                }
                if(nd < neighbors[i].depth){
                    neighbors[i].depth = nd;
                    neighbors[i].cameFrom = current;
                    frontier.push(neighbors[i]);
                }
            }
            else{
                let nextDepth = current.depth + Math.max(neighbors[i].cost, current.cost);
                // Units of the opposing team count as blocking a tile
                const unitIsBlockingTile = (selectedUnit.team === "player" && neighbors[i].containsEnemy) || (selectedUnit.team === "enemy" && neighbors[i].containsPlayer);
                if(!unit.canOccupyTile(neighbors[i]) || unitIsBlockingTile || nextDepth > unit.moves){
                    nextDepth = Math.max(current.depth + 1, unit.moves + 1);
                    if(nextDepth > unit.moves + unit.range){
                        continue;
                    }
                }

                if(nextDepth < neighbors[i].depth){
                    neighbors[i].depth = nextDepth;
                    neighbors[i].cameFrom = current;
                    frontier.push(neighbors[i]);
                }
            }
        }
    }

    return visited;
}

function clearDraw(){
    drawn = [];
}

function drawRange(unit){
    clearDraw();
    let range = getRange(unit);
    for(let i = 0; i < range.length; i++){
        if(unit.state !== UnitState.Finished && range[i].row === unit.row && range[i].col === unit.col) continue;
        // Blue = tiles the unit can move to
        // Red = for outside those bounds
        let tile = Sprite({
            x: range[i].col * 16,
            y: range[i].row * 16,
            width: 16, height: 16,
            color: selectedUnit.team === "player" ? "#ff000077" : "#ff000055"
        });
        tile.dataObj = range[i];
        if(unit.state === UnitState.Attack){
            if(range[i].depth <= unit.range && selectedUnit.team === "player" && range[i].containsEnemy){
                // Only attack tiles with an enemy occupying one should listen for input
                track(tile);
            }
            tile.isTile = true;
        }
        else{
            if(range[i].depth <= unit.moves){
                tile.color = selectedUnit.team === "player" ? "#0000ff77" : "#0000ff33";
                // Unoccupied tiles within range should listen for input since the unit can move to any of them.
                if(selectedUnit.team === "player" && !range[i].containsPlayer){
                    track(tile);
                }
                tile.isTile = true;
            }
        }
        
        if(unit.state === UnitState.Finished){
            tile.color = "#23232344";
        }
        
        tile.row = range[i].row;
        tile.col = range[i].col;
        drawn.push(tile);
    }
}

function unitAttack(u1, u2){
    const dmg = randInt(u1.damageRange[0], u1.damageRange[1]);
    // TODO: show damage number?
    console.log(dmg);
    u2.damage(dmg);
    u1.state = UnitState.Finished;
}

function enterState(newState){
    gameState = newState;
    // TODO turns system
    if(newState === GameState.PlayerTurn){
        // Reset the state of each unit
        for(let i = 0; i < playerUnits.length; i++){
            playerUnits[i].state = UnitState.Ready;
        }
    }
    else if(newState === GameState.EnemyTurn){
        // TEMP
        enterState(GameState.PlayerTurn);
    }
}

onPointer("down", function(e, obj){
    //if(myAudioNode == null){
        //myAudioNode = zzfxP(...mySongData);
    //}

    if(gameState === GameState.PlayerTurn){
        if(obj && obj.unit){ // Clicked on a unit
            let unit = obj.unit;
    
            if(selectedUnit == unit){
                // Deselect unit if clicked on a 2nd time
                selectedUnit = null;
                clearDraw();
            }
            else{
                selectedUnit = unit;
                drawRange(unit);
            }
        }
        else{
            if(obj == null){
                selectedUnit = null;
                clearDraw();
            }
            else if(obj.isTile && selectedUnit.team === "player"){
                if(selectedUnit.state === UnitState.Ready){
                    selectedUnit.move(obj);
                    clearDraw();
                    selectedUnit = null;
                }
                else if(selectedUnit.state === UnitState.Attack){
                    let u2;
                    for(let i = 0; i < enemyUnits.length; i++){
                        if(enemyUnits[i].row === obj.dataObj.row && enemyUnits[i].col === obj.dataObj.col){
                            u2 = enemyUnits[i];
                            break;
                        }
                    }
                    unitAttack(selectedUnit, u2);
                    clearDraw();
                    selectedUnit = null;
                }
            }
        }
    }
    else{

    }
});

let loop = GameLoop({
    update: function(){
        tileMap.update();
        gameObjects.update();
    },
    render: function(){
        tileMap.render();
        gameObjects.render();
        for(let i = 0; i < drawn.length; i++){
            drawn[i].render();
        }
        if(gameState === GameState.PlayerTurn){
            if(selectedUnit && selectedUnit.team === "player" && selectedUnit.state === UnitState.Ready){
                stayBtn.render();
            }
            endBtn.render();
        }
    }
});

loop.start();

function signedOutFlow(){
    // todo
}

function signedInFlow(){
    console.log("Signed in:", window.accountId);
    //console.log("Contract:", window.contract.contractId);
}

window.nearInitPromise = initContract().then(() => {
    if (window.walletConnection.isSignedIn()) signedInFlow()
    else signedOutFlow()
}).catch(console.error);

