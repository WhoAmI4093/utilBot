"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const share_1 = require("../util/share");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mutes the member')
    .addUserOption(o => o
    .setName("member")
    .setDescription("Mute target"))
    .addStringOption(o => o
    .setName("duration")
    .setDescription("Example: 1h 10m, 1mo 2w 4d, spaces are required"));
let execute = async (interaction) => {
    try {
        let sql = share_1.Share.fields["mutesdb"];
        let wordToTime = [
            [["s", "sec", "second"], 1000],
            [["m", "min", "minute"], 60 * 1000],
            [["h", "hr", "hour"], 60 * 60 * 1000],
            [["d", "day"], 24 * 60 * 60 * 60],
            [["w", "week"], 7 * 24 * 60 * 60 * 60]
        ];
        let caster = interaction.member;
        let target = interaction.options.getMember("member");
        let allowedRoles = ["1021718865287336007", "885524229750153289", "1065750077047578655"];
        if (Array.from(caster.roles.cache.keys()).filter(i => allowedRoles.includes(i)).length == 0) {
            await interaction.reply({ content: "<a:error:1161216671256674334> You are not allowed to use this command", ephemeral: true });
            return;
        }
        if (caster.roles.highest.position <= target.roles.highest.position) {
            await interaction.reply({ content: "<a:error:1161216671256674334> Can't mute a member as high as you", ephemeral: true });
            return;
        }
        if (caster.roles.cache.has("885524229741744177")) {
            await interaction.reply({ content: "<a:error:1161216671256674334> This member is already muted", ephemeral: true });
            return;
        }
        let time = interaction.options.getString("duration").split(" ").reduce((prev, cur) => {
            let num = Number(cur.match(/\d+/));
            let lit = cur.match(/[A-z]+/);
            let find = wordToTime.find(e => e[0].includes(lit[0]) || e[0].includes(lit[0] + "s"));
            if (!find) {
                throw new Error("Parsing");
            }
            return prev + find[1] * num;
        }, 0);
        sql.run("INSERT INTO mutes (memberid, unmuteat) VALUES (?, ?)", [target.id, Date.now() + time]);
        await target.roles.add("885524229741744177");
        await interaction.reply(`Succesfully muted ${target}`);
        setTimeout(() => {
            target.roles.remove("885524229741744177");
        }, time);
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
