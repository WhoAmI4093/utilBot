import { ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder } from 'discord.js'
import * as Canvas from 'canvas'
import { Share } from '../../util/share'
import { Database } from 'sqlite3'
import fs from 'fs'
let sql = Share.fields["db"] as Database

function levelByExp(exp: number) {
    return Math.floor(Math.max(0, -5 + Math.sqrt(5 + exp / 5) + 1))
}

export let data = new SlashCommandBuilder()
    .setName('card')
    .setDescription('Gives the rating card of the specified member. You by default')
    .addUserOption(o => o
        .setName('member')
        .setDescription('whose card to draw')
        .setRequired(false))
export let execute: (i: ChatInputCommandInteraction) => Promise<void> = async (interaction: ChatInputCommandInteraction) => {
    try {
        let member = (interaction.options.getMember("member") ?? interaction.member) as GuildMember
        let id = member.id

        console.log(id)

        sql.get("SELECT * FROM members WHERE id=?", id, async (err, res: any) => {
            sql.get("SELECT COUNT(CASE WHEN exp > ? THEN 1 END) AS bigger FROM members", async (err, bigger: any) => {
                if (!res) {
                    await interaction.reply({ content: "<a:error:1161216671256674334> Can't find this member in the ranking system", ephemeral: true })
                }

                let level = levelByExp(res.exp as number)
                let expForThis = 5 * Math.pow(level - 1, 2) + 50 * (level - 1) + 100
                if (expForThis == 55) expForThis = 0;
                let expForNext = 5 * Math.pow(level, 2) + 50 * (level) + 100

                let neededExp = expForNext - expForThis
                let currentExp = (res.exp as number) - expForThis


                if (err) console.log(err)

                const canvas = Canvas.createCanvas(900, 200)
                const context = canvas.getContext("2d")
                let avatar = await Canvas.loadImage(`https://cdn.discordapp.com/avatars/${id}/${member.user.avatar}.png?size=256`)
                //let decoration = await Canvas.loadImage(member.user.avatarDecorationURL())
                let card = await Canvas.loadImage(__dirname + "\\..\\..\\..\\img\\card.png")

                context.fillStyle = "#5900f4"
                context.fillRect(0, 0, 900, 200)

                context.drawImage(avatar, 20, 20, 160, 160)

                context.fillStyle = "#1fffc9"
                context.fillRect(215, 130, currentExp / neededExp * 649, 50)

                context.drawImage(card, 0, 0, 900, 200)


                context.fillStyle = "#ffffff"
                context.font = "200 48pt Arial"
                context.textBaseline = "bottom"
                context.textAlign = "left"
                context.fillText(member.displayName, 228, 80)
                context.font = "normal 40pt Arial"
                context.fillText(`${level} #${bigger.bigger + 1}`, 292, 128)
                context.font = "normal 24pt Arial"
                context.fillText("LVL", 228, 122)
                context.textAlign = "right"
                context.font = "small-caps 36pt Arial"
                context.fillText(`${currentExp} / ${neededExp} exp`, 851, 129)
                context.font = "normal 36pt Arial"
                context.fillText(`${res.coins} ©`, 850, 75)

                //context.drawImage(decoration, 10, 10, 190, 190)
                const buffer = canvas.toBuffer("image/png")
                fs.writeFileSync(__dirname + `\\..\\..\\..\\temp\\card${id}.png`, buffer, { flag: "w" })

                await interaction.reply({ files: [__dirname + `\\..\\..\\..\\temp\\card${interaction.user.id}.png`] })

                fs.unlinkSync(__dirname + `\\..\\..\\..\\temp\\card${id}.png`)
            })

        })

    } catch (err) {
        if (err) {
            if (interaction.replied) await interaction.followUp({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            else await interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            console.log(err)
        }
    }

}
