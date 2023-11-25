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
const fs_1 = __importDefault(require("fs"));
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const share_1 = require("./util/share");
dotenv_1.default.config();
function randomInteger(min, max) {
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}
function levelByExp(exp) {
    return Math.floor(Math.max(0, -5 + Math.sqrt(5 + exp / 5) + 1));
}
let keepAlive = require('./server');
let db = new sqlite3_1.default.Database(__dirname + "/../db/members.db");
db.run(`CREATE TABLE IF NOT EXISTS "mutes" (
	"id"	INTEGER,
	"memberid"	TEXT,
	"unmuteat"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT)
);`);
db.run(`CREATE TABLE IF NOT EXISTS "members" (
	"id"	TEXT UNIQUE,
	"lastmessage"	INTEGER DEFAULT 0,
	"exp"	INTEGER,
	PRIMARY KEY("id")
);`);
db.run(`CREATE TABLE IF NOT EXISTS "warnings" (
	"id"	INTEGER,
	"memberid"	TEXT NOT NULL,
	"reason"	TEXT NOT NULL,
	"moderatorid"	TEXT NOT NULL,
	"timestamp"	INTEGER NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);`);
const punishmentswebhook = new discord_js_1.WebhookClient({ url: process.env.PUNISHMENTSWEBHOOKURL });
const ticketlogswebhook = new discord_js_1.WebhookClient({ url: "https://discord.com/api/webhooks/1165185489700147200/3nIpRuIU2F4AiG4ABnGDbPnKQds0yi_lvaXvBLgsE8BEu8YF-Y-sDDBwDgCzY70_6TEe" });
share_1.Share.fields["punishmentswebhook"] = punishmentswebhook;
share_1.Share.fields["db"] = db;
console.log(__dirname);
function insertMember(member) {
    if (member.user.bot)
        return;
    db.get("SELECT * FROM members WHERE id=?", [member.id], (err, row) => {
        if (err) {
            console.log(err);
            return;
        }
        if (row == undefined) {
            db.run("INSERT INTO members (id) VALUES (?)", member.id);
        }
    });
}
let commandsData = new discord_js_1.Collection();
let commandsFunctions = new discord_js_1.Collection();
function loadCommandsFrom(dir) {
    const commandsPath = path_1.default.join(__dirname, dir);
    const files = fs_1.default.readdirSync(commandsPath).filter(file => /.[tj]s$/.test(file));
    const dirs = fs_1.default.readdirSync(commandsPath).filter(files => !files.match(/\.\w+$/gm));
    for (const file of files) {
        const filePath = path_1.default.join(commandsPath, file);
        Promise.resolve(`${filePath}`).then(s => __importStar(require(s))).then(command => {
            commandsData.set(command.data.name, command.data.toJSON());
            commandsFunctions.set(command.data.name, command.execute);
        });
        console.log(`Loaded ${filePath}`);
    }
    for (const directory of dirs) {
        loadCommandsFrom(`${dir}/${directory}`);
    }
}
loadCommandsFrom("commands");
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.MessageContent, discord_js_1.GatewayIntentBits.GuildVoiceStates, discord_js_1.GatewayIntentBits.GuildMembers] });
client.once(discord_js_1.Events.ClientReady, async () => {
    let guild = client.guilds.cache.get("885524229733380107");
    await (await guild.members.fetch()).forEach(async (member) => {
        insertMember(member);
        db.get("SELECT * FROM mutes WHERE memberid=?", [member.id], (err, row) => {
            if (err) {
                console.log(err);
                return;
            }
            if (row != undefined) {
                setTimeout(async () => {
                    await member.roles.remove("885524229741744177");
                    db.run("DELETE FROM mutes WHERE id = ?", [row["id"]]);
                }, row["unmuteat"] - Date.now());
            }
        });
    });
    client.application.commands.set(Array.from(commandsData.values()));
    console.log(`Ready!`);
});
client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
    insertMember(member);
});
client.on(discord_js_1.Events.MessageCreate, async (message) => {
    if (message.member.user.bot || message.member.roles.cache.has("885524229733380109"))
        return;
    db.get("SELECT * FROM members  WHERE id=?", [message.member.id], (err, res) => {
        if (Date.now() - res.lastmessage < 60 * 1000)
            return;
        let random = randomInteger(15, 25);
        let coinsMulti = 1;
        let roles = message.member.roles;
        if (roles.cache.has("919336617095864350"))
            coinsMulti = 2;
        if (roles.cache.has("919336784100474930"))
            coinsMulti = 3;
        if (roles.cache.has("919336866426269728"))
            coinsMulti = 4;
        db.run("UPDATE members SET exp = exp + ?, coins = coins + 1 * ? WHERE id=?;", [random, coinsMulti, message.member.id]);
        let expBefore = res.exp;
        let expAfter = expBefore + random;
        let nowLVl = levelByExp(expAfter);
        let addedRoleId = null;
        if (nowLVl > levelByExp(expBefore)) {
            switch (nowLVl) {
                case 5: {
                    roles.add("885524229733380114");
                    addedRoleId = "885524229733380114";
                    break;
                }
                case 10: {
                    roles.remove("885524229733380114");
                    roles.add("885524229733380115");
                    addedRoleId = "885524229733380115";
                    break;
                }
                case 20: {
                    roles.remove("885524229733380115");
                    roles.add("885524229733380116");
                    addedRoleId = "885524229733380116";
                    break;
                }
            }
            let embed = new discord_js_1.EmbedBuilder();
            if (addedRoleId != null)
                embed.setColor(message.guild.roles.cache.get(addedRoleId).color);
            else
                embed.setColor("Green");
            embed.setTitle("Level up!");
            embed.setDescription(`<@${message.member.id}> has just leveled up to lvl \`${nowLVl}\``);
            if (addedRoleId != null)
                embed.addFields([{ name: "Added role", value: `<@&${addedRoleId}>` }]);
            message.reply({ embeds: [embed] });
        }
    });
});
client.on(discord_js_1.Events.InteractionCreate, async (Interaction) => {
    if (Interaction.isButton()) {
        let buttonInteraction = Interaction;
        let member = Interaction.member;
        if (buttonInteraction.customId == "openticket") {
            buttonInteraction.guild.channels.create({
                type: discord_js_1.ChannelType.GuildText,
                name: `${member.displayName}'s ticket`, permissionOverwrites: [
                    { type: discord_js_1.OverwriteType.Role, id: buttonInteraction.guild.roles.everyone, deny: discord_js_1.PermissionFlagsBits.ViewChannel },
                    { type: discord_js_1.OverwriteType.Member, id: buttonInteraction.member.user.id, allow: discord_js_1.PermissionFlagsBits.ViewChannel + discord_js_1.PermissionFlagsBits.AttachFiles + discord_js_1.PermissionFlagsBits.SendMessages },
                    { type: discord_js_1.OverwriteType.Role, id: "1021718865287336007", allow: discord_js_1.PermissionFlagsBits.ViewChannel },
                    { type: discord_js_1.OverwriteType.Role, id: "885524229750153289", allow: discord_js_1.PermissionFlagsBits.ViewChannel },
                    { type: discord_js_1.OverwriteType.Role, id: "1065750077047578655", allow: discord_js_1.PermissionFlagsBits.ViewChannel }
                ]
            }).then(async (channel) => {
                let embed = new discord_js_1.EmbedBuilder()
                    .setTitle(`${member.displayName}'s ticket`)
                    .setColor("Green")
                    .setDescription("Lorem ipsum dolor sit amet");
                let row = new discord_js_1.ActionRowBuilder()
                    .addComponents([
                    new discord_js_1.ButtonBuilder()
                        .setCustomId("closeticket1")
                        .setEmoji("🔒")
                        .setLabel("Close ticket")
                        .setStyle(discord_js_1.ButtonStyle.Danger)
                ]);
                await channel.send({ content: `<@${member.id}>`, embeds: [embed], components: [row] });
                let response = new discord_js_1.EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`Success`)
                    .setDescription(`Your ticket has been created: <#${channel.id}>`);
                await Interaction.reply({ embeds: [response], ephemeral: true });
            });
        }
        if (buttonInteraction.customId == "closeticket1") {
            Interaction.channel.edit({
                permissionOverwrites: [
                    { type: discord_js_1.OverwriteType.Role, id: buttonInteraction.guild.roles.everyone, deny: discord_js_1.PermissionFlagsBits.ViewChannel },
                    { type: discord_js_1.OverwriteType.Member, id: buttonInteraction.member.user.id, deny: discord_js_1.PermissionFlagsBits.ViewChannel },
                    { type: discord_js_1.OverwriteType.Role, id: "1021718865287336007", allow: discord_js_1.PermissionFlagsBits.ViewChannel },
                    { type: discord_js_1.OverwriteType.Role, id: "885524229750153289", allow: discord_js_1.PermissionFlagsBits.ViewChannel },
                    { type: discord_js_1.OverwriteType.Role, id: "1065750077047578655", allow: discord_js_1.PermissionFlagsBits.ViewChannel }
                ]
            });
            let embed = new discord_js_1.EmbedBuilder()
                .setColor("Red")
                .setTitle(`Confirmation`)
                .setDescription(`The ticket has been closed by <@${member.id}>\nModerator input required`);
            let row = new discord_js_1.ActionRowBuilder()
                .addComponents([
                new discord_js_1.ButtonBuilder()
                    .setCustomId("closeticket2")
                    .setEmoji("📩")
                    .setLabel("Close and save")
                    .setStyle(discord_js_1.ButtonStyle.Primary)
            ]);
            await Interaction.reply({ embeds: [embed], components: [row] });
        }
        if (buttonInteraction.customId == "closeticket2") {
            await Interaction.deferUpdate();
            Interaction.channel.messages.fetch().then(async (messages) => {
                let array = Array.from(messages.values()).reverse();
                let creator = "";
                let text = "";
                array.forEach(message => {
                    if (creator == "") {
                        creator = message.content;
                    }
                    if (message.content != "") {
                        text += `${message.author.displayName} (${message.author.id}): ${message.content}\n`;
                    }
                });
                let date = Date.now();
                fs_1.default.writeFileSync(__dirname + `/../temp/ticket${date}.txt`, text);
                ticketlogswebhook.send({ content: creator, files: [__dirname + `/../temp/ticket${date}.txt`] });
                fs_1.default.unlinkSync(__dirname + `/../temp/ticket${date}.txt`);
                Interaction.channel.delete();
            });
        }
    }
    if (!Interaction.isChatInputCommand())
        return;
    let commandInteraction = Interaction;
    let command = commandsFunctions.get(commandInteraction.commandName);
    if (!command) {
        console.log(`No command matching ${commandInteraction.commandName}`);
        await Interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true });
        return;
    }
    command(commandInteraction);
});
const TOKEN = process.env.TOKEN;
if (process.env.RUN == "1") {
    client.login(TOKEN);
}
keepAlive();
