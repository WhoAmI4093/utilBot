"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const ansi_colors_1 = __importDefault(require("ansi-colors"));
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('test')
    .setDescription('Replies with pong!');
let execute = async (interaction) => {
    try {
        let string = `\`\`\`ansi\n${ansi_colors_1.default.bold("You unboxed")} ${ansi_colors_1.default.underline.yellow("Yellow color role")}\`\`\``;
        let embed = new discord_js_1.EmbedBuilder()
            .setColor("Green")
            .setTitle("Test")
            .setDescription(string);
        interaction.reply({ embeds: [embed] });
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
