import fs from 'fs'
import { ActivityType, AllowedMentionsTypes, Channel, ChannelType, ChatInputCommandInteraction, Client, Collection, CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder, Events, GatewayIntentBits, GuildBasedChannel, GuildMember, PermissionFlags, PermissionFlagsBits, RESTPostAPIChatInputApplicationCommandsJSONBody, TextBasedChannel } from 'discord.js'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()
let keepAlive = require('./server')


let commandsData = new Collection<string, RESTPostAPIChatInputApplicationCommandsJSONBody>()
let commandsFunctions = new Collection<string, (i: ChatInputCommandInteraction) => Promise<void>>()

function loadCommandsFrom(dir: string) {
    const commandsPath = path.join(__dirname, dir)
    const files = fs.readdirSync(commandsPath).filter(file => /.[tj]s$/.test(file))
    const dirs = fs.readdirSync(commandsPath).filter(files => !files.match(/\.\w+$/gm))

    for (const file of files) {
        const filePath = path.join(commandsPath, file)
        import(filePath).then(command => {
            commandsData.set(command.data.name, command.data.toJSON())
            commandsFunctions.set(command.data.name, command.execute)
        })
        console.log(`Loaded ${filePath}`)
    }
    for (const directory of dirs) {
        loadCommandsFrom(`${dir}/${directory}`)
    }
}

loadCommandsFrom("commands")

const client = new Client({ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers] });
client.once(Events.ClientReady, async () => {
    client.application.commands.set(Array.from(commandsData.values()))
    console.log(`Ready!`);
})

client.on(Events.InteractionCreate, async Interaction => {
    if (!Interaction.isChatInputCommand()) return

    let commandInteraction = Interaction as ChatInputCommandInteraction

    let command = commandsFunctions.get(commandInteraction.commandName)
    if (!command) {
        console.log(`No command matching ${commandInteraction.commandName}`)
        await Interaction.reply({ content: "<a:error:1161216671256674334> Internal error occured", ephemeral: true })
        return
    }
    command(commandInteraction)
})

const TOKEN = process.env.TOKEN
client.login(TOKEN)
keepAlive()