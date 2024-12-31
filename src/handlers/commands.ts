import { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import type { Command, GlobClient } from "../types/index";
import { loadFiles } from "../lib/files";

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

        client.application.commands.set(commands)
        console.log('[COMANDOS] Cargados correctamente')
    }


