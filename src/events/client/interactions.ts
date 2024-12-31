import { Event } from '../../types/index'

export const event: Event<'interactionCreate'> = {
    name: 'interactionCreate',

    async execute(client, interaction) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName)
            if (!command) return 

            if (command.developer && !client.config.developers.includes(interaction.user.id)) return await interaction.reply({ content: 'Este comando slo esta disponible para desarolladores', ephemeral: true  })

                command.execute(client, interaction)
        } 
    }
}