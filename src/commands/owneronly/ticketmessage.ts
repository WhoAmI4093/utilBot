import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import fs from 'fs'
export let data: SlashCommandBuilder = new SlashCommandBuilder()
    .setName('ticketmessage')
    .setDescription('Replies with pong!')
export let execute: (i: ChatInputCommandInteraction) => Promise<void> = async (interaction: ChatInputCommandInteraction) => {
    try {
        let embed = new EmbedBuilder()
            .setTitle('Pong')
            .setColor('Green')
            .setDescription("lorem")
        let row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId("openticket")
                    .setEmoji(":incoming_envelope:")
                    .setLabel("Open ticket")
                    .setStyle(ButtonStyle.Success)
            ])
        await interaction.reply({ embeds: [embed], components: [row] })
    } catch (err) {
        if (err) {
            if (interaction.replied) await interaction.followUp({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            else await interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            console.log(err)
        }
    }

}
