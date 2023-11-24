"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const share_1 = require("../../util/share");
let sql = share_1.Share.fields["db"];
let webhook = share_1.Share.fields["punishmentswebhook"];
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('remwarn')
    .setDescription('Removes warning by case number')
    .addIntegerOption(o => o
    .setName("case")
    .setDescription("Specify the case number")
    .setMinValue(1)
    .setRequired(true));
let execute = async (interaction) => {
    try {
        let caster = interaction.member;
        let casenumber = interaction.options.getInteger("case");
        let allowedRoles = ["1021718865287336007", "885524229750153289", "1065750077047578655"];
        if (Array.from(caster.roles.cache.keys()).filter(i => allowedRoles.includes(i)).length == 0) {
            await interaction.reply({ content: "<a:error:1161216671256674334> You are not allowed to use this command", ephemeral: true });
            return;
        }
        sql.get("SELECT * FROM warnings WHERE id = (?)", [casenumber], async (err, res) => {
            if (!res) {
                await interaction.reply({ content: "<a:error:1161216671256674334> No warning with that case number", ephemeral: true });
                return;
            }
            let target = interaction.guild.members.cache.get(res.memberid);
            sql.run("UPDATE warnings SET disabled = 1 WHERE id = ?", casenumber);
            sql.get("SELECT COUNT(*) FROM warnings WHERE (memberid, disabled) = (?, 0)", [target.id], async (err, row) => {
                let count = row["COUNT(*)"];
                try {
                    target.user.createDM().then(dm => {
                        let notification = new discord_js_1.EmbedBuilder()
                            .setColor("Green")
                            .setTitle("Warning removed")
                            .setDescription("One warning has been removed from you.")
                            .addFields({ name: "Warning count", value: `\`${count}/4\``, inline: true });
                        dm.send({ embeds: [notification] });
                    });
                    let globalNotification = new discord_js_1.EmbedBuilder()
                        .setColor("Green")
                        .setTitle("Warning removed")
                        .setDescription(`One warning has been removed from <@${target.id}>`)
                        .setFooter({ text: "Member was notified in their DMs" });
                    await interaction.reply({ embeds: [globalNotification] });
                }
                catch (err) {
                    let notification = new discord_js_1.EmbedBuilder()
                        .setColor("Green")
                        .setTitle("Warning removed")
                        .setDescription(`One warning has been removed from <@${target.id}>`)
                        .addFields({ name: "Warning count", value: `\`${count}/4\``, inline: true });
                    await interaction.reply({ content: `<@${target.id}>`, embeds: [notification] });
                }
                webhook.send({
                    embeds: [
                        new discord_js_1.EmbedBuilder()
                            .setColor("Green")
                            .setTitle("Warning removed")
                            .setDescription(`One warning has been removed from <@${target.id}>`)
                            .addFields({ name: "Moderator", value: `<@${caster.id}> \`(${caster.user.username}, ${caster.id})\``, inline: true }, { name: "Warning count", value: `\`${count}/4\``, inline: true }, { name: "Case", value: `\`${casenumber}\``, inline: true })
                    ]
                });
            });
        });
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
