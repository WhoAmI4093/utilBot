import { Case } from "./case"
import { Game } from "./game"
import { ItemInstance } from "./item"
import c from 'ansi-colors'
export class Player {
    id: string
    //                     id       amount

    cases: Map<number, number> = new Map()

    async openCase(id: number) {
        let amount = this.cases.get(id) ?? 0
        if (amount == 0) {
            return c.red(`This is not a case or you don't have it at all.`)
        }
        let caseInstance = Game.Cases.get(id)
        let [items, itemAmount] = await caseInstance?.open() ?? [[ItemInstance.blank], 0]

        const decrementQuery = `
            UPDATE stackableinventory
            SET amount = amount - 1
            WHERE playerid = ? AND itemid = ?;
        `
        Game.db.run(decrementQuery, this.id, id)

        if (items[0].isStackable) {
            const updateQuery = `INSERT INTO stackableinventory (record, playerid, itemid, amount)
            VALUES (
                COALESCE(
                    (SELECT record FROM stackableinventory WHERE playerid=? AND itemid=?),
                    (SELECT seq FROM sqlite_sequence WHERE name="stackableinventory")+1
                ),
                ?,
                ?,
                ?
            )
            ON CONFLICT(record)
            DO UPDATE SET amount = amount + ?;`
            let it = items[0]
            Game.db.run(updateQuery, [this.id, it.itemid, this.id, it.itemid, itemAmount, itemAmount], (err) => {
                if (err) {
                    console.error(err.message);
                }
            });


        } else {
            for (let item of items) {
                item.insertIntoUnstackableInventory(this.id)
            }

        }
        return `Got ${itemAmount} of ${items[0].name} `
        // TODO                      Make this a name
    }
    async updateCases() {
        this.cases = await new Promise<Map<number, number>>((resolve, reject) => {
            let cases: Map<number, number> = new Map()
            Game.db.all("SELECT si.itemid, si.amount FROM stackableinventory si JOIN items it ON si.itemid = it.id WHERE (it.features & 1) = 1 AND si.playerid == ?", this.id, (err, items: any) => {
                if (err) console.log(err)
                for (let i of items) {
                    cases.set(i.itemid, i.amount)
                }
                resolve(cases)
            })
        })
    }
    get stackableInventory() {
        return new Promise<Map<number, number>>((resolve, reject) => {
            let inv: Map<number, number> = new Map()
            Game.db.all("SELECT * FROM stackableinventory WHERE playerid = ?", this.id, (err, items: any) => {
                if (err) console.log(err)
                for (let i of items) {
                    inv.set(i.itemid, i.amount)
                }
                resolve(inv)
            })
        })

    }
    //                       uniqueID instance
    unstackableInventory: Map<number, ItemInstance> = new Map()

    constructor(id: string) {
        this.id = id
    }
}

(async () => {
    await Game.loadItems()
    let player = new Player("531068073172795433")
    await player.updateCases()
    await console.log(await player.openCase(8))
})()