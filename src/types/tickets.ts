export interface TicketConfig {
    guildId: string;
    categoryId: string;       // categoría donde se crean los canales
    logChannelId: string;     // canal de logs/transcripts
    supportRoleIds: string[]; // roles que ven y gestionan tickets
    panelChannelId?: string;  // canal donde está el panel
    panelMessageId?: string;  // mensaje del panel (para editarlo)
    ticketCount: number;      // contador para numeración
}

export interface TicketData {
    channelId: string;
    guildId: string;
    userId: string;
    username: string;
    subject: string;
    description: string;
    claimedBy?: string;       // ID del staff que reclamó el ticket
    createdAt: number;        // timestamp
    number: number;
}
