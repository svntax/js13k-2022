import { Sprite, SpriteSheet, track } from "../kontra.js";
import { Bones, BonesType } from "./Bones.js";
import { astar } from "../Pathfinding.js";

export const UnitType = {Ground: 0, Flying: 1}
export const UnitState = {Ready: 0, Finished: 1, Attack: 2}

export class Unit {
    constructor(scene, grid, data, row, col){
        this.row = row;
        this.col = col;
        this.moves = data.moves;
        this.range = data.range;
        this.team = data.team;
        this.unitType = data.unitType;
        this.damageRange = data.damage;
        this.state = UnitState.Ready;
        this.name = data.name;

        this.health = data.maxHealth;
        this.maxHealth = data.maxHealth;
        this.healthBar = Sprite({
            x: 0,
            y: -9,
            anchor: {x: 0.5, y: 0.5},
            width: 12,
            height: 2,
            color: "#00e436"
        });
        
        this.scene = scene;
        this.grid = grid;
        let unitObj = this;
        let img = new Image();
        img.src = data.imagePath;
        img.onload = function(){
            let spriteSheet = SpriteSheet({
                image: img,
                frameWidth: 16,
                frameHeight: 16,
                animations: {
                    idle: {
                        frames: data.frames,
                        frameRate: 4
                    }
                }
            });
            let sprite = unitObj.unitSprite = Sprite({
                x: col * 16 + 8,
                y: row * 16 + 8,
                anchor: {x: 0.5, y: 0.5},
                animations: spriteSheet.animations,
                update: function(){
                    this.dx = 0;
                    this.dy = 0;
                    this.advance();
                }
            });
            sprite.addChild(unitObj.healthBar);
            scene.add(sprite);
            if(data.team === "player"){
                grid[row][col].containsPlayer = true;
                // Enemies come from the right, so make the unit face right
                sprite.scaleX = -1;
            }
            else{
                grid[row][col].containsEnemy = true;
            }
            track(sprite);
            sprite.unit = unitObj;
        };
    }

    move(targetTile){
        const newRow = targetTile.row;
        const newCol = targetTile.col;

        // Update the grid tile status
        if(this.team === "player"){
            this.grid[newRow][newCol].containsPlayer = true;
            this.grid[this.row][this.col].containsPlayer = false;
        }
        else{
            this.grid[newRow][newCol].containsEnemy = true;
            this.grid[this.row][this.col].containsEnemy = false;
        }

        // TODO: animate walking to the target tile

        if(newCol > this.col){
            this.unitSprite.scaleX = -1;
        }
        else if(newCol < this.col){
            this.unitSprite.scaleX = 1;
        }

        this.row = newRow;
        this.col = newCol;
        this.unitSprite.x = newCol * 16 + 8;
        this.unitSprite.y = newRow * 16 + 8;
        this.state = UnitState.Attack;
    }

    canOccupyTile(tile){
        if(tile.isObstacle) return false;
        if(this.unitType === UnitType.Ground && tile.isGroundObstacle) return false;
        return true;
    }

    damage(amount){
        this.health -= amount;
        if(this.health <= 0){
            this.health = 0;

            if((this.name === "Bird" || this.name === "Knight") && this.grid[this.row][this.col].bonesObj == null){
                let bt = BonesType.Skeleton;
                if(this.name === "Bird"){
                    bt = BonesType.Bird;
                }
                new Bones(this.scene.bonesList, this.grid, {row: this.row, col: this.col, type: bt});
            }

            // Remove this unit's sprite from the scene
            let i = this.scene.objects.indexOf(this.unitSprite);
            if(i > -1) this.scene.objects.splice(i, 1);
            // Update the contains flag for the tile this unit is on
            if(this.team === "player"){
                this.grid[this.row][this.col].containsPlayer = false;
            }
            else{
                this.grid[this.row][this.col].containsEnemy = false;
            }
        }
        // Update healthbar
        this.healthBar.width = 12 * (this.health / 12);
    }

    // Manhattan distance
    distanceTo(unit){
        return Math.abs(this.row - unit.row) + Math.abs(this.col - unit.col);
    }

    // Finds a player unit to target
    findTarget(units){
        if(units.length > 0){
            // Find all units within this unit's range
            let targets = []; 
            for(let i = 0; i < units.length; i++){
                if(this.distanceTo(units[i]) <= Math.round(this.moves + this.range)){
                    targets.push(units[i]);
                }
            }
            // There are reachable units
            if(targets.length > 0){
                // Sort units by ascending health and return the weakest one
                targets.sort(function(u1, u2) { return u1.health - u2.health; });
                return targets[0];
            }
            // There are no reachable units
            else{
                // Target closest unit
                let minDist = Infinity;
                let closest = units[0];
                for(let i = 0; i < units.length; i++){
                    let d = this.distanceTo(units[i]);
                    if(d < minDist){
                        minDist = d;
                        closest = units[i];
                    }
                }
                return closest;
            }
        }
        return null;
    }

    calculatePathTo(target){
        const start = {row: this.row, col: this.col};
        const end = {row: target.row, col: target.col};
        return astar(this.grid, start, end, this);
    }
}