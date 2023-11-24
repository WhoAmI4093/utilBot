import { ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder, WebhookClient } from 'discord.js'
import { Share } from '../../util/share'
import { Database } from 'sqlite3'
let sql = Share.fields["db"] as Database
let webhook = Share.fields["punishmentswebhook"] as WebhookClient
export let data = new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warns the member')
    .addUserOption(o => o
        .setName("member")
        .setDescription("Warn target")
        .setRequired(true))
    .addStringOption(o => o
        .setName("reason")
        .setDescription("Specify why this warning was given")
        .setRequired(true))

export let execute: (i: ChatInputCommandInteraction) => Promise<void> = async (interaction: ChatInputCommandInteraction) => {
    try {
        let caster = interaction.member as GuildMember
        let target = interaction.options.getMember("member") as GuildMember
        let reason = interaction.options.getString("reason")

        let allowedRoles = ["1021718865287336007", "885524229750153289", "1065750077047578655"]
        if (Array.from(caster.roles.cache.keys()).filter(i => allowedRoles.includes(i)).length == 0) {
            await interaction.reply({ content: "<a:error:1161216671256674334> You are not allowed to use this command", ephemeral: true })
            return
        }
        if (caster.roles.highest.position <= target.roles.highest.position) {
            await interaction.reply({ content: "<a:error:1161216671256674334> Can't warn a member as high as you", ephemeral: true })
            return
        }


        sql.run("INSERT INTO warnings (memberid, reason, moderatorid, timestamp) VALUES (?,?,?,?)", [target.id, reason, caster.id, Date.now()])
        sql.get("SELECT last_insert_rowid() FROM warnings", async (err, caseNumber: any) => {
            if (err) {
                console.log(err)
                return
            }
            let casenumber = caseNumber['last_insert_rowid()']
            sql.get("SELECT COUNT(*) FROM warnings WHERE (memberid, disabled) = (?, 0)", [target.id], async (err, row: any) => {
                if (err) {
                    console.log(err)
                    return
                }
                let count: number = row["COUNT(*)"]
                try {
                    target.user.createDM().then(dm => {
                        if (count == 4) {
                            let notification = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("You were warned")
                                .setDescription(`You received a warning on \`Liminal\`\nAnd were banned for reaching the limit`)
                                .addFields(
                                    { name: "Reason", value: reason, inline: true },
                                    { name: "Warning count", value: `\`${count}/4\``, inline: true },
                                    { name: "Appeal", value: "If you believe this is a mistake, contact `@goose532`", inline: false }
                                )
                            dm.send({ embeds: [notification] })
                        } else {
                            let notification = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle("You were warned")
                                .setDescription(`You received a warning on \`Liminal\``)
                                .addFields(
                                    { name: "Reason", value: reason, inline: true },
                                    { name: "Warning count", value: `\`${count}/4\``, inline: true },
                                    { name: "Appeal", value: "If you believe this is a mistake, create a ticket", inline: false }
                                )
                            dm.send({ embeds: [notification] })
                        }
                    })
                    let globalNotification = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("Warning")
                        .setDescription(`<@${target.id}> was given a warning${count == 4 ? "\nAnd were banned for reaching the limit" : ""}`)
                        .addFields(
                            { name: "Reason", value: reason, inline: true },
                            { name: "Warning count", value: `\`${count}/4\``, inline: true }
                        )
                        .setFooter({ text: "Member was notified in their DMs" })
                    await interaction.reply({ embeds: [globalNotification] })

                } catch (err) {
                    if (count == 4) {
                        let notification = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("Warning")
                            .setDescription(`<@${target.id}> was given a warning №${count}/4\nAnd were banned for reaching the limit`)
                            .addFields(
                                { name: "Reason", value: reason, inline: true },
                                { name: "Warning count", value: `\`${count}/4\``, inline: true }
                            )
                            .setFooter({ text: "Could not notify user in their DMs" })
                        await interaction.reply({ embeds: [notification] })
                    } else {
                        let notification = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("Warning")
                            .setDescription(`<@${target.id}> was given a warning №${count}/4`)
                            .addFields(
                                { name: "Reason", value: reason, inline: true },
                                { name: "Appeal", value: "If you believe this is a mistake, create a ticket" }
                            )
                        await interaction.reply({ content: `<@${target.id}>`, embeds: [notification] })
                    }
                }
                if (count == 4) {
                    await target.ban({ reason: `Warnings limit reached. (${reason})` })
                }
                webhook.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setTitle("Warning")
                            .setDescription(`<@${target.id}> \`(${target.user.username}, ${target.id})\` was warned${count == 4 ? "\nAnd were banned for reaching the limit" : ""}`)
                            .addFields(
                                { name: "Moderator", value: `<@${caster.id}> \`(${caster.user.username}, ${caster.id})\``, inline: true },
                                { name: "Reason", value: reason, inline: true },
                                { name: "Warning count", value: `\`${count}/4\``, inline: true },
                                { name: "Case", value: `\`${casenumber}\``, inline: true }
                            )
                    ]
                })
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
