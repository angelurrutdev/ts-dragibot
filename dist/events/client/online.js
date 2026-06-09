"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
const commands_1 = require("../../handlers/commands");
exports.event = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`[CLIENT] ${client.user.username} se ha iniciado correctamente`);
        (0, commands_1.handleCommands)(client);
    },
};
