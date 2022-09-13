import { Sprite, SpriteSheet, track } from "../kontra.js";

export const UnitType = {Ground: 0, Flying: 1}
export const UnitState = {Ready: 0, Finished: 1, Attack: 2}

export class Unit {
    constructor(scene, grid, data){
        this.row = data.row;
        this.col = data.col;
        this.moves = data.moves;
        this.range = data.range;
        this.team = data.team;
        this.unitType = data.unitType;
        this.damageRange = data.damage;
        this.state = UnitState.Ready;

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
        //this.speed = .6;
        let unitObject = this;
        let unitImage = new Image();
        unitImage.src = data.imagePath;
        unitImage.onload = function(){
            let spriteSheet = SpriteSheet({
                image: unitImage,
                frameWidth: 16,
                frameHeight: 16,
                animations: {
                    idle: {
                        frames: data.frames,
                        frameRate: 4
                    }
                }
            });
            let sprite = unitObject.unitSprite = Sprite({
                x: data.col * 16 + 8,
                y: data.row * 16 + 8,
                anchor: {x: 0.5, y: 0.5},
                animations: spriteSheet.animations,
                update: function(){
                    this.dx = 0;
                    this.dy = 0;
                    this.advance();
                }
            });
            sprite.addChild(unitObject.healthBar);
            scene.add(sprite);
            if(data.team === "player"){
                grid[data.row][data.col].containsPlayer = true;
                // Enemies come from the right, so make the unit face right
                sprite.scaleX = -1;
            }
            else{
                grid[data.row][data.col].containsEnemy = true;
            }
            track(sprite);
            sprite.unit = unitObject;
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
            // TODO: dead
            this.health = 0;
        }
        // Update healthbar
        this.healthBar.width = 12 * (this.health / 12);
    }
}