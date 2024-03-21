import { color } from "./func/colorfromrarity"
import { getRandomFloat, getRandomInt } from "./func/random"
import { Game } from "./game"
export class ItemTemplate {
    static empty: ItemTemplate
    id: number
    name: string = ""
    description: string = ""
    features: number = 0

    rarity: number = 0
    get isStackable(): boolean {
        return this.properties.length == 0
    }

    properties: Array<Property> = []

    async generate(): Promise<ItemInstance> {
        let item = new ItemInstance(this.id)
        let promise = this.properties.map(async prop => await prop.generateRandom())
        item.properties = await Promise.all(promise)
        item.rarity = this.rarity
        item.name = color(this.rarity)(this.name)
        return item
    }
}
let empty = new ItemTemplate()
empty.id = 0
ItemTemplate.empty = empty
export class Property {
    id: number
    name: string
    isInt: boolean = false
    minValue: number = 0
    maxValue: number = 1

    async generateRandom(): Promise<PropertyInstance> {
        let instance = new PropertyInstance()
        instance.propertyid = this.id

        if (this.isInt) {
            instance.value = await getRandomInt(this.minValue, this.maxValue)
        } else instance.value = await getRandomFloat(this.minValue, this.maxValue)
        return instance
    }
}

export class ItemInstance {
    static blank: ItemInstance = new ItemInstance(0)
    name: string
    rarity: number = 0
    itemid: number
    properties: Array<PropertyInstance>
    get isStackable(): boolean {
        return this.properties.length == 0
    }

    constructor(id: number, props: Array<PropertyInstance> = []) {
        this.itemid = id
        this.properties = props
    }

    async insertIntoUnstackableInventory(playerId: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const db = Game.db

            // Insert into unstackableinventory table
            const insertQuery = `
                INSERT INTO unstackableinventory (playerid, itemid)
                VALUES (?, ?);
            `;
            const props = this.properties
            db.run(insertQuery, [playerId, this.itemid], function (err) {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }

                const uniqueId = this.lastID;

                // Insert into propertiesInstances table for each property
                const propertyInsertQuery = `
                    INSERT INTO propertiesInstances(uniqueid, propertyid, value)
                    VALUES (?, ?, ?);
                `;

                const propertyInsertPromises = props.map((property) => {
                    return new Promise<void>((resolveProp, rejectProp) => {
                        db.run(propertyInsertQuery, [uniqueId, property.propertyid, property.value], (errProp) => {
                            if (errProp) {
                                rejectProp(errProp);
                                return;
                            }
                            resolveProp();
                        });
                    });
                });

                // Wait for all property inserts to complete
                Promise.all(propertyInsertPromises)
                    .then(() => {
                        resolve();
                    })
                    .catch((errProp) => {
                        reject(errProp);
                    });
            });
        });
    }
}

(async () => {
    let item = new ItemInstance(1, [{ propertyid: 2, value: 10 }])
})()

class PropertyInstance {
    propertyid: number
    value: number
}