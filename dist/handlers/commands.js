"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCommands = handleCommands;
const files_1 = require("../lib/files");
const isDev = __filename.endsWith('.ts');
async function handleCommands(client) {
    client.commands.clear();
    const commands = [];
    const files = await (0, files_1.loadFiles)('commands');
    files.forEach(file => {
        const { command } = require(file);
        try {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`[COMANDO] ${command.data.name} cargado correctamente`);
        }
        catch (error) {
            console.log(`[COMANDO] ${command.data.name} no se ha podido cargar`);
        }
    });
    if (isDev) {
        // Dev: registrar por guild (instantáneo)
        const guildId = process.env.GUILD_ID;
        if (!guildId)
            throw new Error('[COMANDOS] GUILD_ID no definido en .env (requerido en modo dev)');
        const guild = await client.guilds.fetch(guildId);
        await guild.commands.set(commands);
        console.log(`[COMANDOS] Registrados en guild ${guild.name} (dev)`);
    }
    else {
        // Prod: registrar global (puede tardar hasta 1h en propagarse)
        await client.application.commands.set(commands);
        console.log('[COMANDOS] Registrados globalmente (prod)');
    }
}
