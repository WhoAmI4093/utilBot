import { ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import fs from 'fs'
import c from 'ansi-colors'
export let data: SlashCommandBuilder = new SlashCommandBuilder()
    .setName('test')
    .setDescription('Replies with pong!')
export let execute: (i: ChatInputCommandInteraction) => Promise<void> = async (interaction: ChatInputCommandInteraction) => {
    try {
        let string = `\`\`\`ansi\n${c.bold("You unboxed")} ${c.underline.yellow("Yellow color role")}\`\`\``
        let embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("Test")
            .setDescription(string)
        interaction.reply({ embeds: [embed] })
    } catch (err) {
        if (err) {
            if (interaction.replied) await interaction.followUp({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            else await interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            console.log(err)
        }
    }

}
