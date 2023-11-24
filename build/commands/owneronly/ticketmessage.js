"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('ticketmessage')
    .setDescription('Replies with pong!');
let execute = async (interaction) => {
    try {
        let embed = new discord_js_1.EmbedBuilder()
            .setTitle('Pong')
            .setColor('Green')
            .setDescription("lorem");
        let row = new discord_js_1.ActionRowBuilder()
            .addComponents([
            new discord_js_1.ButtonBuilder()
                .setCustomId("openticket")
                .setEmoji(":incoming_envelope:")
                .setLabel("Open ticket")
                .setStyle(discord_js_1.ButtonStyle.Success)
        ]);
        await interaction.reply({ embeds: [embed], components: [row] });
    }
    catch (err) {
        if (err) {
            if (interaction.replied)
                await interaction.followUp({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true });
            else
                await interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true });
            console.log(err);
        }
    }
};
exports.execute = execute;
