import 'dotenv/config'

import { Client, Collection } from 'discord.js'
import { GlobClient } from './types/index'
import { handleevents } from './handlers/events'
import { CONFIG } from './consts'

const client = new Client({
    intents: ['Guilds','GuildMessages','MessageContent', 'GuildMembers' ]
}) as GlobClient

client.config = CONFIG
client.events = new Collection()
client.commands = new Collection()

handleevents(client)

client.login(process.env.DISCORD_TOKEN)