import { sendMessage } from '../telegram-utils';

export async function handleRule(chatId: number) {
    let msg = `📜 *Direttive del Partito sui Comandi del Bot* 📜\n\n`;
    msg += `Il Comitato Centrale ha approvato i seguenti strumenti per il popolo:\n\n`;
    msg += `* /best\\_team \\[ID\\_Mister\\]* \\- Richiedi al Soviet Supremo la migliore formazione calcolata scientificamente per massimizzare la produzione del tuo collettivo\\.\n`;
    msg += `* /consigli \\[Nome o ID Mister\\]* \\- Richiedi un dossier segreto con i migliori lavoratori liberi sul mercato calcolati in base alle esigenze e fondi del tuo reparto\\.\n`;
    msg += `* /exchange \\[ID1\\] \\[Gioc1\\] \\[ID2\\] \\[Gioc2\\]* \\- Invia una richiesta al Ministero del Commercio per valutare se uno scambio rispetta i principi di equità proletaria\\.\n`;
    msg += `* /mister* \\- Consulta gli archivi del KGB per ottenere l'ID di Partito di tutti i compagni fantallenatori\\.\n`;
    msg += `* /rule* \\- Consulta questo manifesto dei comandi di Partito\\.\n`;
    msg += `* /info* \\- Richiedi il dossier dettagliato sul funzionamento dell'algoritmo di Stato \\(API\\)\\.\n`;
    
    await sendMessage(chatId, msg);
}

export async function handleInfo(chatId: number) {
    let msg = `⚙️ *Dossier Tecnico: L'Infrastruttura di Stato \\(API\\)* ⚙️\n\n`;
    msg += `L'applicazione centrale \\(API\\) funziona come l'apparato burocratico perfetto, distribuendo le risorse secondo le necessità di ogni compagno, senza favoritismi borghesi\\.\n\n`;
    msg += `*1\\. Raccolta Dati \\(Web Scraping\\)*\nI nostri ispettori statali prelevano quotidianamente i dati dalle fonti ufficiali, espropriando le statistiche dei lavoratori del pallone per inserirle nei nostri archivi centrali\\.\n\n`;
    msg += `*2\\. Modello Matematico di Valutazione*\nIl calcolatore centrale di Mosca analizza le prestazioni\\. Nessun voto è lasciato al caso o all'interpretazione borghese\\. Si assegna un "Expected Base Rating" \\(Voto di Stato\\) e un "Expected Value" \\(Fanta\\-Valore\\), aggiungendo bonus per i lavoratori specializzati in calci piazzati e rigori\\.\n\n`;
    msg += `*3\\. Pianificazione Formazione \\(Lineup\\)*\nIl sistema utilizza la programmazione lineare per schierare i compagni più produttivi\\. Non puoi scegliere la formazione: è lo Stato che sceglie la formazione migliore per te, rispettando i limiti strutturali \\(il modulo\\)\\.\n\n`;
    msg += `*4\\. Gestione delle Transazioni*\nOgni acquisto o scambio è registrato nel registro centrale \\(Database Relazionale\\)\\. Qualsiasi tentativo di accumulare crediti in modo illecito viene bloccato dal KGB\\.\n\n`;
    msg += `Gloria all'algoritmo\\!`;
    
    await sendMessage(chatId, msg);
}
