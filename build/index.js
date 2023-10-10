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
dotenv_1.default.config();
let keepAlive = require('./server');
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
    client.application.commands.set(Array.from(commandsData.values()));
    console.log(`Ready!`);
});
client.on(discord_js_1.Events.InteractionCreate, async (Interaction) => {
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
client.login(TOKEN);
keepAlive();
