"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const Canvas = __importStar(require("canvas"));
const share_1 = require("../../util/share");
const fs_1 = __importDefault(require("fs"));
let sql = share_1.Share.fields["db"];
function levelByExp(exp) {
    return Math.floor(Math.max(0, -5 + Math.sqrt(5 + exp / 5) + 1));
}
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('card')
    .setDescription('Gives the rating card of the specified member. You by default')
    .addUserOption(o => o
    .setName('member')
    .setDescription('whose card to draw')
    .setRequired(false));
let execute = async (interaction) => {
    try {
        let member = (interaction.options.getMember("member") ?? interaction.member);
        let id = member.id;
        console.log(id);
        sql.get("SELECT * FROM members WHERE id=?", id, async (err, res) => {
            sql.get("SELECT COUNT(CASE WHEN exp > ? THEN 1 END) AS bigger FROM members", async (err, bigger) => {
                if (!res) {
                    await interaction.reply({ content: "<a:error:1161216671256674334> Can't find this member in the ranking system", ephemeral: true });
                }
                let level = levelByExp(res.exp);
                let expForThis = 5 * Math.pow(level - 1, 2) + 50 * (level - 1) + 100;
                if (expForThis == 55)
                    expForThis = 0;
                let expForNext = 5 * Math.pow(level, 2) + 50 * (level) + 100;
                let neededExp = expForNext - expForThis;
                let currentExp = res.exp - expForThis;
                if (err)
                    console.log(err);
                const canvas = Canvas.createCanvas(900, 200);
                const context = canvas.getContext("2d");
                let avatar = await Canvas.loadImage(`https://cdn.discordapp.com/avatars/${id}/${member.user.avatar}.png?size=256`);
                //let decoration = await Canvas.loadImage(member.user.avatarDecorationURL())
                let card = await Canvas.loadImage(__dirname + "/../../../img/card.png");
                context.fillStyle = "#5900f4";
                context.fillRect(0, 0, 900, 200);
                context.drawImage(avatar, 20, 20, 160, 160);
                context.fillStyle = "#1fffc9";
                context.fillRect(215, 130, currentExp / neededExp * 649, 50);
                context.drawImage(card, 0, 0, 900, 200);
                context.fillStyle = "#ffffff";
                context.font = "200 48pt Arial";
                context.textBaseline = "bottom";
                context.textAlign = "left";
                context.fillText(member.displayName, 228, 80);
                context.font = "normal 40pt Arial";
                context.fillText(`${level} #${bigger.bigger + 1}`, 292, 128);
                context.font = "normal 24pt Arial";
                context.fillText("LVL", 228, 122);
                context.textAlign = "right";
                context.font = "small-caps 36pt Arial";
                context.fillText(`${currentExp} / ${neededExp} exp`, 851, 129);
                context.font = "normal 36pt Arial";
                context.fillText(`${res.coins} ©`, 850, 75);
                //context.drawImage(decoration, 10, 10, 190, 190)
                const buffer = canvas.toBuffer("image/png");
                fs_1.default.writeFileSync(__dirname + `/../../../temp/card${id}.png`, buffer, { flag: "w" });
                await interaction.reply({ files: [__dirname + `/../../../temp/card${id}.png`] });
                fs_1.default.unlinkSync(__dirname + `/../../../temp/card${id}.png`);
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
