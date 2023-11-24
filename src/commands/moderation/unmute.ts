import { ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, GuildMember, MembershipScreeningFieldType, SlashCommandBuilder, WebhookClient } from 'discord.js'
import fs from 'fs'
import { Share } from '../../util/share'
import { Database } from 'sqlite3'
let sql = Share.fields["mutesdb"] as Database
let webhook = Share.fields["punishmentswebhook"] as WebhookClient
export let data = new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmutes the member')
    .addUserOption(o => o
        .setName("member")
        .setDescription("Who to unmute?")
        .setRequired(true))
export let execute: (i: ChatInputCommandInteraction) => Promise<void> = async (interaction: ChatInputCommandInteraction) => {
    try {
        let caster = interaction.member as GuildMember
        let target = interaction.options.getMember("member") as GuildMember

        let allowedRoles = ["1021718865287336007", "885524229750153289", "1065750077047578655"]
        if (Array.from(caster.roles.cache.keys()).filter(i => allowedRoles.includes(i)).length == 0) {
            await interaction.reply({ content: "<a:error:1161216671256674334> You are not allowed to use this command", ephemeral: true })
            return
        }
        if (caster.roles.highest.position <= target.roles.highest.position) {
            await interaction.reply({ content: "<a:error:1161216671256674334> Can't unmute a member as high as you", ephemeral: true })
            return
        }
        if (!caster.roles.cache.has("885524229741744177")) {
            await interaction.reply({ content: "<a:error:1161216671256674334> This member is not muted", ephemeral: true })
            return
        }
        try {
            target.user.createDM().then(dm => {
                let notification = new EmbedBuilder()
                    .setColor("Green")
                    .setDescription("You were unmuted from `Liminal` ahead of time ")
                dm.send({ embeds: [notification] })
            })
            let globalNotification = new EmbedBuilder()
                .setColor("Green")
                .setTitle("Unmute")
                .setDescription(`<@${target.id}> was unmuted ahead of time`)
            await interaction.reply({ embeds: [globalNotification] })

        } catch (err) {
            let notification = new EmbedBuilder()
                .setColor("Green")
                .setTitle("Unute")
                .setDescription(`<@${target.id}> was unmuted ahead of time`)
            await interaction.reply({ content: `<@${target.id}>`, embeds: [notification] })
        }


        target.roles.remove("885524229741744177")
        sql.run("DELETE FROM mutes WHERE memberid = ?", [target.id])

        webhook.send({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("Unmute")
                    .setDescription(`<@${target.id}> \`(${target.user.username}, ${target.id})\` was unmuted`)
                    .addFields(
                        { name: "Moderator", value: `<@${caster.id}> \`(${caster.user.username}, ${caster.id})\`` }
                    )
            ]
        })
    } catch (err: any) {
        if (err) {
            if (interaction.replied) await interaction.followUp({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            else await interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            console.log(err)
        }
    }

}
