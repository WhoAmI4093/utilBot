import { ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js'

export let data: SlashCommandBuilder = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong!')
export let execute: (i: ChatInputCommandInteraction) => Promise<void> = async (interaction: ChatInputCommandInteraction) => {
    try {
        let text = `Ping is \`${interaction.client.ws.ping}ms\``
        let embed = new EmbedBuilder()
            .setTitle('Pong')
            .setColor('Green')
            .setDescription(text)
        await interaction.reply({ embeds: [embed] })
    } catch (err) {
        if (err) {
            if (interaction.replied) interaction.followUp({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            else interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
            console.log(err)
        }
    }

}
