function escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

let msg = `👤 *Lista dei Compagni Mister registrati al PCUS* 👤\n\n`;
msg += `ID di Partito: *1* \\- ${escapeMarkdown("FC Ranocchia")}\n`;
console.log(msg);
