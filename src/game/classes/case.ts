import { getRandomInt } from "./func/random";
import { Game } from "./game";
import { ItemInstance, ItemTemplate } from "./item";

export class Case {
    categories: Array<Category>


    async open(): Promise<[ItemInstance[], number]> {
        let sum = this.categories.reduce((prev, cur) => {
            return prev + cur.probability
        }, 0)
        let int = 1;
        if (sum != 1)
            int = await getRandomInt(1, sum)
        let item: ItemInstance = ItemInstance.blank;
        let amount: number = 1
        let ItemInstanceArray: Array<ItemInstance> = []
        for (let category of this.categories) {
            if (int > category.probability) {
                int -= category.probability
                continue
            }
            let index = 0
            if (category.items.length > 1)
                index = await getRandomInt(0, category.items.length - 1)
            let id = category.items[index][0]

            let amountMinMax = category.items[index][1]

            if (amountMinMax[0] == amountMinMax[1]) {
                amount = amountMinMax[0]
            } else amount = await getRandomInt(...category.items[index][1])

            let itemT = Game.Items.get(id)
            if (itemT?.isStackable) {
                ItemInstanceArray = [await itemT?.generate() ?? ItemInstance.blank]
                return [ItemInstanceArray, amount]
            } else {
                for (let i = 0; i < amount; i++) {
                    ItemInstanceArray.push(await itemT?.generate() ?? ItemInstance.blank)
                }
                return [ItemInstanceArray, amount]
            }
        }
        return [ItemInstanceArray, amount]
    }
}

export interface Category {
    //           id        min     max
    items: Array<[number, [number, number]]>
    probability: number
}

