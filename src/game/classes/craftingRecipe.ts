import { Game } from "./game";
import { ItemTemplate } from "./item";


export class CraftingRecipe {
    static empty: CraftingRecipe = new CraftingRecipe([], [], 0)
    id: number
    //               itemId amount
    materials: Array<[number, number]> = []
    //             itemid  amount
    output: Array<[number, number]> = []
    // TODO:    make array nuber number a class or smth
    constructor (m: Array<[number, number]>, o: Array<[number, number]>, id:number) {
        this.materials = m
        this.output = o
        this.id = id
    }
}