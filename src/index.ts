import fs from 'fs'
import { ActionRowBuilder, ActivityType, AllowedMentionsTypes, ButtonBuilder, ButtonInteraction, ButtonStyle, Channel, ChannelType, ChatInputCommandInteraction, Client, Collection, CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, Events, GatewayIntentBits, GuildBasedChannel, GuildMember, MembershipScreeningFieldType, OverwriteType, PermissionFlags, PermissionFlagsBits, RESTPostAPIChatInputApplicationCommandsJSONBody, RoleManager, TextBasedChannel, WebhookClient } from 'discord.js'
import path from 'path'
import dotenv from 'dotenv'
import sqlite3 from 'sqlite3'
import { Share } from './util/share'
import { textSpanContainsPosition } from 'typescript'

dotenv.config()

function randomInteger(min: number, max: number) {
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}
function levelByExp(exp: number) {
    return Math.floor(Math.max(0, -5 + Math.sqrt(5 + exp / 5) + 1))
}


let keepAlive = require('./server')



let db = new sqlite3.Database(__dirname + "/../db/members.db")
const punishmentsWebhook = new WebhookClient({ url: process.env.PUNISHMENTSWEBHOOKURL });
const ticketLogsWebhook = new WebhookClient({ url: "https://discord.com/api/webhooks/1165185489700147200/3nIpRuIU2F4AiG4ABnGDbPnKQds0yi_lvaXvBLgsE8BEu8YF-Y-sDDBwDgCzY70_6TEe" })

Share.fields["punishmentswebhook"] = punishmentsWebhook
Share.fields["db"] = db
console.log(__dirname)

function insertMember(member: GuildMember) {
    if (member.user.bot) return
    db.get("SELECT * FROM members WHERE id=?", [member.id], (err, row: any) => {
        if (err) {
            console.log(err)
            return
        }
        if (row == undefined) {
            db.run("INSERT INTO members (id) VALUES (?)", member.id)
        }
    })
}



let commandsData = new Collection<string, RESTPostAPIChatInputApplicationCommandsJSONBody>()
let commandsFunctions = new Collection<string, (i: ChatInputCommandInteraction) => Promise<void>>()

function loadCommandsFrom(dir: string) {
    const commandsPath = path.join(__dirname, dir)
    const files = fs.readdirSync(commandsPath).filter(file => /.[tj]s$/.test(file))
    const dirs = fs.readdirSync(commandsPath).filter(files => !files.match(/\.\w+$/gm))

    for (const file of files) {
        const filePath = path.join(commandsPath, file)
        import(filePath).then(command => {
            commandsData.set(command.data.name, command.data.toJSON())
            commandsFunctions.set(command.data.name, command.execute)
        })
        console.log(`Loaded ${filePath}`)
    }
    for (const directory of dirs) {
        loadCommandsFrom(`${dir}/${directory}`)
    }
}

loadCommandsFrom("commands")

const client = new Client({ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers] });
client.once(Events.ClientReady, async () => {
    let guild = client.guilds.cache.get("885524229733380107");
    (await guild.members.fetch()).forEach((member) => {
        insertMember(member)

        db.get("SELECT * FROM mutes WHERE memberid=?", [member.id], (err, row: any) => {
            if (err) {
                console.log(err)
                return
            }
            if (row != undefined) {
                setTimeout(async () => {
                    await member.roles.remove("885524229741744177")
                    db.run("DELETE FROM mutes WHERE id = ?", [row["id"]])
                }, row["unmuteat"] - Date.now())
            }
        })
    })


    await client.application.commands.set(Array.from(commandsData.values()))
    console.log(`Ready!`);
})

client.on(Events.GuildMemberAdd, async (member) => {
    insertMember(member)
})


client.on(Events.MessageCreate, async (message) => {
    if (message.member.user.bot || message.member.roles.cache.has("885524229733380109")) return
    db.get("SELECT * FROM members  WHERE id=?", [message.member.id], (err, res: any) => {
        if (Date.now() - res.lastMessage < 60 * 1000) return
        let random = randomInteger(15, 25)
        let coinsMulti = 1

        let roles = message.member.roles

        if (roles.cache.has("919336617095864350")) coinsMulti = 2
        if (roles.cache.has("919336784100474930")) coinsMulti = 3
        if (roles.cache.has("919336866426269728")) coinsMulti = 4

        db.run("UPDATE members SET exp = exp + ?, coins = coins + 1 * ? WHERE id=?;", [random, coinsMulti, message.member.id])

        let expBefore = res.exp as number
        let expAfter = expBefore + random



        let nowLVl = levelByExp(expAfter)
        let addedRoleId = null
        if (nowLVl > levelByExp(expBefore)) {
            switch (nowLVl) {
                case 5: {
                    roles.add("885524229733380114")
                    addedRoleId = "885524229733380114"
                    break
                }
                case 10: {
                    roles.remove("885524229733380114")
                    roles.add("885524229733380115")
                    addedRoleId = "885524229733380115"
                    break
                }
                case 20: {
                    roles.remove("885524229733380115")
                    roles.add("885524229733380116")
                    addedRoleId = "885524229733380116"
                    break
                }
            }
            let embed = new EmbedBuilder()
            if (addedRoleId != null) embed.setColor(message.guild.roles.cache.get(addedRoleId).color)
            else embed.setColor("Green")

            embed.setTitle("Level up!")
            embed.setDescription(`<@${message.member.id}> has just leveled up to lvl \`${nowLVl}\``)
            if (addedRoleId != null)
                embed.addFields([{ name: "Added role", value: `<@&${addedRoleId}>` }])

            message.reply({ embeds: [embed] })
        }
    })
})

client.on(Events.InteractionCreate, async Interaction => {
    if (Interaction.isButton()) {
        let buttonInteraction = Interaction as ButtonInteraction
        let member = Interaction.member as GuildMember
        if (buttonInteraction.customId == "openticket") {
            buttonInteraction.guild.channels.create({
                type: ChannelType.GuildText,
                name: `${member.displayName}'s ticket`, permissionOverwrites: [
                    { type: OverwriteType.Role, id: buttonInteraction.guild.roles.everyone, deny: PermissionFlagsBits.ViewChannel },
                    { type: OverwriteType.Member, id: buttonInteraction.member.user.id, allow: PermissionFlagsBits.ViewChannel + PermissionFlagsBits.AttachFiles + PermissionFlagsBits.SendMessages },
                    { type: OverwriteType.Role, id: "1021718865287336007", allow: PermissionFlagsBits.ViewChannel },
                    { type: OverwriteType.Role, id: "885524229750153289", allow: PermissionFlagsBits.ViewChannel },
                    { type: OverwriteType.Role, id: "1065750077047578655", allow: PermissionFlagsBits.ViewChannel }
                ]
            }).then(async channel => {
                let embed = new EmbedBuilder()
                    .setTitle(`${member.displayName}'s ticket`)
                    .setColor("Green")
                    .setDescription("Lorem ipsum dolor sit amet")
                let row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId("closeticket1")
                            .setEmoji("🔒")
                            .setLabel("Close ticket")
                            .setStyle(ButtonStyle.Danger)
                    ])
                await channel.send({ content: `<@${member.id}>`, embeds: [embed], components: [row] })

                let response = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`Success`)
                    .setDescription(`Your ticket has been created: <#${channel.id}>`)
                await Interaction.reply({ embeds: [response], ephemeral: true })
            })
        }
        if (buttonInteraction.customId == "closeticket1") {
            Interaction.channel.edit({
                permissionOverwrites: [
                    { type: OverwriteType.Role, id: buttonInteraction.guild.roles.everyone, deny: PermissionFlagsBits.ViewChannel },
                    { type: OverwriteType.Member, id: buttonInteraction.member.user.id, deny: PermissionFlagsBits.ViewChannel },
                    { type: OverwriteType.Role, id: "1021718865287336007", allow: PermissionFlagsBits.ViewChannel },
                    { type: OverwriteType.Role, id: "885524229750153289", allow: PermissionFlagsBits.ViewChannel },
                    { type: OverwriteType.Role, id: "1065750077047578655", allow: PermissionFlagsBits.ViewChannel }
                ]
            })

            let embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle(`Confirmation`)
                .setDescription(`The ticket has been closed by <@${member.id}>\nModerator input required`)
            let row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents([
                    new ButtonBuilder()
                        .setCustomId("closeticket2")
                        .setEmoji("📩")
                        .setLabel("Close and save")
                        .setStyle(ButtonStyle.Primary)
                ])
            await Interaction.reply({ embeds: [embed], components: [row] })
        }
        if (buttonInteraction.customId == "closeticket2") {
            await Interaction.deferUpdate()
            Interaction.channel.messages.fetch().then(async messages => {
                let array = Array.from(messages.values()).reverse()
                let creator = ""
                let text = ""
                array.forEach(message => {
                    if (creator == "") {
                        creator = message.content
                    }
                    if (message.content != "") {
                        text += `${message.author.displayName} (${message.author.id}): ${message.content}\n`
                    }
                })
                let date = Date.now()
                fs.writeFileSync(__dirname + `/../temp/ticket${date}.txt`, text)
                ticketLogsWebhook.send({ content: creator, files: [__dirname + `/../temp/ticket${date}.txt`] })
                fs.unlinkSync(__dirname + `/../temp/ticket${date}.txt`)

                Interaction.channel.delete()
            })
        }
    }
    if (!Interaction.isChatInputCommand()) return


    let commandInteraction = Interaction as ChatInputCommandInteraction

    let command = commandsFunctions.get(commandInteraction.commandName)
    if (!command) {
        console.log(`No command matching ${commandInteraction.commandName}`)
        await Interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
        return
    }
    command(commandInteraction)
})

const TOKEN = process.env.TOKEN
if (process.env.RUN == "1") {
    client.login(TOKEN)
}
keepAlive()
