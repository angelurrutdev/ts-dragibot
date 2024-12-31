import { handleCommands } from '../../handlers/commands'
import { Event } from '../../types/index'

export const event: Event<'ready'> = {
    name: 'ready',
    once: true,

    execute(client) {
        console.log(`[CLIENT] ${client.user.username} se ha iniciado correctamente`)
        handleCommands(client)
    },
}