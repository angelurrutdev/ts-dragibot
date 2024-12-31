import { loadFiles } from "../lib/files";
import type { Event, GlobClient } from "../types/index";

export async function handleevents(client: GlobClient): Promise<void> {
    client.events.clear()
    const files = await loadFiles('events')
    files.forEach(file => {
        const { event} = require(file) as { event: Event<any> }
        try{
            const execute = (...args: any[]) => event.execute(client, ...args)
            client.events.set(event.name, execute)
            if (event.rest) {
                if (event.once) client.rest.once(event.name, execute)
                    else client.rest.once(event.name, execute)
                } else {
                if (event.once) client.once(event.name, execute)
                    else client.on(event.name, execute)
            }
            console.log(`[EVENT] ${event.name} cargado correctamente`)
        } catch (error) {
            console.log(`[EVENT] ${event.name} no se ha podido cargar`)
        }
    })

}
