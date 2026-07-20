const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendMessage(chatId: number | string, text: string, parseMode: string = 'MarkdownV2') {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.error("TELEGRAM_BOT_TOKEN is missing.");
        return;
    }

    try {
        const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: parseMode
            })
        });

        if (!res.ok) {
            console.error("Telegram API Error:", await res.text());
        }
    } catch (e) {
        console.error("Error sending Telegram message:", e);
    }
}
