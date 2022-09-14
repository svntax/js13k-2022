import { Sprite } from "../kontra.js";

export const BonesType = {Skeleton: 0, Bird: 1}
const IMG_SOURCES = ["img/bones.png", "img/bones2.png"];

export class Bones {
    constructor(scene, grid, data){
        this.row = data.row;
        this.col = data.col;
        this.type = data.type;
        
        this.scene = scene;
        this.grid = grid;
        let obj = this;
        let img = new Image();
        img.src = IMG_SOURCES[data.type];
        img.onload = function(){
            let sprite = obj.sprite = Sprite({
                x: data.col * 16 + 2,
                y: data.row * 16 + 2,
                image: img
            });
            scene.add(sprite);
            grid[data.row][data.col].bonesObj = obj;
        };
    }
}