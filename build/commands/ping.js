"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong!');
let execute = async (interaction) => {
    try {
        let text = `Ping is \`${interaction.client.ws.ping}ms\``;
        let embed = new discord_js_1.EmbedBuilder()
            .setTitle('Pong')
            .setColor('Green')
            .setDescription(text);
        await interaction.reply({ embeds: [embed] });
    }
    catch (err) {
        if (err) {
            if (interaction.replied)
                interaction.followUp({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true });
            else
                interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true });
            console.log(err);
        }
    }
};
exports.execute = execute;
