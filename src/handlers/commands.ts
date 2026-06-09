import { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import type { Command, GlobClient } from "../types/index";
import { loadFiles } from "../lib/files";

const isDev = __filename.endsWith('.ts')

export async function handleCommands (client: GlobClient): Promise<void> {

    client.commands.clear()
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = []
    const files = await loadFiles('commands')
    files.forEach(file => {
        const { command } = require(file) as { command: Command }
        try {
            client.commands.set(command.data.name, command)
            commands.push(command.data.toJSON())
            console.log(`[COMANDO] ${command.data.name} cargado correctamente`)
        } catch (error) {
            console.log(`[COMANDO] ${command.data.name} no se ha podido cargar`)
        }
    })

    if (isDev) {
        // Dev: registrar por guild (instantáneo)
        const guildId = process.env.GUILD_ID
        if (!guildId) throw new Error('[COMANDOS] GUILD_ID no definido en .env (requerido en modo dev)')
        const guild = await client.guilds.fetch(guildId)
        await guild.commands.set(commands)
        console.log(`[COMANDOS] Registrados en guild ${guild.name} (dev)`)
    } else {
        // Prod: registrar global (puede tardar hasta 1h en propagarse)
        await client.application.commands.set(commands)
        console.log('[COMANDOS] Registrados globalmente (prod)')
    }
}


