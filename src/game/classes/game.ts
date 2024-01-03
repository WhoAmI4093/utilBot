import { ItemTemplate, Property } from "./item";
import sqlite3 from 'sqlite3'
import { Player } from "./player";
import { Case, Category } from "./case";

let db = new sqlite3.Database(__dirname + "/../../../db/game.db")

export class Game {
    static Items: Map<number, ItemTemplate> = new Map()
    static Cases: Map<number, Case> = new Map()
    static db = db
    static async loadItems() {
        return new Promise<void>((resolve, reject) => {
            db.all("SELECT * FROM items", async (err, items: any) => {

                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }

                for (const item of items) {
                    let template = new ItemTemplate()
                    template.id = Number(item.id)
                    template.name = item.name
                    template.description = item.description
                    template.features = item.features
                    template.rarity = Number(item.rarity)
                    if (template.features & 0b1) {
                        let caseTemplate = new Case()
                        const groups = await new Promise<any[]>((resolveGroups, rejectGroups) => {
                            db.all("SELECT * FROM cases WHERE caseid=?", template.id, (err, grs: any) => {
                                if (err) {
                                    console.log(err)
                                    rejectGroups(err)
                                } else {
                                    resolveGroups(grs)
                                }
                            })
                        })
                        let categories: Array<Category> = []
                        groups.forEach(async (group: any) => {
                            let its = await new Promise<any[]>((resolveItems, rejectItems) => {
                                db.all("SELECT * FROM groups WHERE groupid=?", group.groupid, (err, its) => {
                                    if (err) {
                                        console.log(err);
                                        rejectItems(err);
                                    } else {
                                        resolveItems(its);
                                    }
                                });
                            });
                            let itemsArray: Array<[number, [number, number]]> = [];
                            its.forEach((it: any) => {
                                itemsArray.push([it.itemid, [it.amountMin, it.amountMax]]);
                            });
                            categories.push({ items: itemsArray, probability: group.probability });
                        })
                        caseTemplate.categories = categories
                        Game.Cases.set(template.id, caseTemplate)
                    }

                    const propertyids = await new Promise<any[]>((resolveProps, rejectProps) => {
                        db.all("SELECT * FROM propertyassignments WHERE itemId = ?", item.id, (err, props: any) => {
                            if (err) {
                                console.log(err);
                                rejectProps(err);
                            } else {
                                resolveProps(props);
                            }
                        })
                    });

                    for (let id of propertyids) {
                        const property = await new Promise<any>((resolveProperty, rejectProperty) => {
                            db.get("SELECT * FROM properties WHERE propertyId = ?", id.propertyId, (err, pr: any) => {
                                if (err) {
                                    console.log(err)
                                    rejectProperty(err)
                                } else {
                                    resolveProperty(pr)
                                }
                            })
                        })

                        let prop = new Property()
                        prop.id = Number(property.propertyId)
                        prop.isInt = Boolean(property.isInt)
                        prop.minValue = Number(id.minValue)
                        prop.maxValue = Number(id.maxValue)
                        prop.name = property.name
                        template.properties.push(prop)
                    }

                    Game.Items.set(template.id, template)
                }
                resolve()
            })
        });
    }
}

// Use async/await to wait for the asynchronous operation to complete
