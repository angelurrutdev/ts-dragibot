"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleevents = handleevents;
const files_1 = require("../lib/files");
async function handleevents(client) {
    client.events.clear();
    const files = await (0, files_1.loadFiles)('events');
    files.forEach(file => {
        const { event } = require(file);
        try {
            const execute = (...args) => event.execute(client, ...args);
            client.events.set(event.name, execute);
            if (event.rest) {
                if (event.once)
                    client.rest.once(event.name, execute);
                else
                    client.rest.on(event.name, execute);
            }
            else {
                if (event.once)
                    client.once(event.name, execute);
                else
                    client.on(event.name, execute);
            }
            console.log(`[EVENT] ${event.name} cargado correctamente`);
        }
        catch (error) {
            console.log(`[EVENT] ${event.name} no se ha podido cargar`);
        }
    });
}
