"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const share_1 = require("../../util/share");
let sql = share_1.Share.fields["db"];
let webhook = share_1.Share.fields["punishmentswebhook"];
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mutes the member')
    .addUserOption(o => o
    .setName("member")
    .setDescription("Mute target")
    .setRequired(true))
    .addStringOption(o => o
    .setName("duration")
    .setDescription("Example: 1h 10m, 1mo 2w 4d, spaces are required")
    .setRequired(true))
    .addStringOption(o => o
    .setName("reason")
    .setDescription("Specify why this mute was given")
    .setRequired(true));
let execute = async (interaction) => {
    try {
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
        let duration = interaction.options.getString("duration");
        let time = duration.split(" ").reduce((prev, cur) => {
            let num = Number(cur.match(/\d+/));
            let lit = cur.match(/[A-z]+/);
            let find = wordToTime.find(e => e[0].includes(lit[0]) || e[0].includes(lit[0] + "s"));
            if (!find) {
                throw new Error("Parsing");
            }
            return prev + find[1] * num;
        }, 0);
        sql.run("INSERT INTO mutes (memberid, unmuteat) VALUES (?, ?)", [target.id, Date.now() + time]);
        let reason = interaction.options.getString("reason");
        try {
            target.user.createDM().then(dm => {
                let notification = new discord_js_1.EmbedBuilder()
                    .setColor("Red")
                    .setTitle("You were muted")
                    .setDescription("You were muted from `Liminal`")
                    .addFields({ name: "Reason", value: reason, inline: true }, { name: "Expires at", value: `<t:${Math.round((Date.now() + time) / 1000)}>`, inline: true }, { name: "Appeal", value: "If you believe this is a mistake, create a ticket", inline: false });
                dm.send({ embeds: [notification] });
            });
            let globalNotification = new discord_js_1.EmbedBuilder()
                .setColor("Red")
                .setTitle("Mute")
                .setDescription(`<@${target.id}> was muted`)
                .addFields({ name: "Reason", value: reason, inline: true }, { name: "Expires at", value: `<t:${Math.round((Date.now() + time) / 1000)}>`, inline: true })
                .setFooter({ text: "Member was notified in their DMs" });
            await interaction.reply({ embeds: [globalNotification] });
        }
        catch (err) {
            let notification = new discord_js_1.EmbedBuilder()
                .setColor("Red")
                .setTitle("Mute")
                .setDescription(`<@${target.id}> was muted`)
                .addFields({ name: "Reason", value: reason, inline: true }, { name: "Expires at", value: `<t:${Math.round((Date.now() + time) / 1000)}>`, inline: true }, { name: "Appeal", value: "If you believe this is a mistake, create a ticket" });
            await interaction.reply({ content: `<@${target.id}>`, embeds: [notification] });
        }
        setTimeout(() => {
            target.roles.remove("885524229741744177");
            sql.run("DELETE FROM mutes WHERE memberid = ?", [target.id]);
        }, time);
        webhook.send({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor("Red")
                    .setTitle("Mute")
                    .setDescription(`<@${target.id}> \`(${target.user.username}, ${target.id})\` was muted`)
                    .addFields({ name: "Reason", value: reason, inline: true }, { name: "Expires at", value: `<t:${Math.round((Date.now() + time) / 1000)}>`, inline: true }, { name: "Moderator", value: `<@${caster.id}> \`(${caster.user.username}, ${caster.id})\`` })
            ]
        });
        await target.roles.add("885524229741744177");
    }
    catch (err) {
        if (err) {
            if (err.message == "Parsing") {
                await interaction.reply({ content: "<a:error:1161216671256674334> Wrong time format", ephemeral: true });
                return;
            }
            if (interaction.replied)
                await interaction.followUp({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true });
            else
                await interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true });
            console.log(err);
        }
    }
};
exports.execute = execute;
