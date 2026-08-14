import { sendMessage } from '../telegram-utils';

export async function handleRule(chatId: number) {
    let msg = `📜 *MANIFESTO UFFICIALE DEL PARTITO* 📜\n\n`;
    msg += `Il Comitato Centrale ha approvato i seguenti strumenti per il proletariato fantacalcistico:\n\n`;
    msg += `* /best\\_team \\[Tessera\\_Partito\\]* \\- Richiedi al Politburo la migliore formazione, calcolata scientificamente per massimizzare l'estrazione di plusvalore dai tuoi lavoratori\\.\n`;
    msg += `* /consigli \\[Tessera o Nome\\]* \\- Usa lo spionaggio industriale per individuare i migliori stacanovisti ancora liberi sul mercato\\.\n`;
    msg += `* /exchange \\[ID1\\] \\[Gioc1\\] \\[ID2\\] \\[Gioc2\\]* \\- Sottoponi un baratto al Tribunale del Popolo per assicurarti che non vi siano arricchimenti illeciti borghesi\\.\n`;
    msg += `* /mister* \\- Consulta gli archivi segreti del KGB per ottenere la Tessera di Partito di tutti i compagni della Lega\\.\n`;
    msg += `* /rule* \\- Affiggi questo manifesto in tutte le piazze\\.\n`;
    msg += `* /info* \\- Leggi i segreti di Stato su come l'Algoritmo Centrale domina la nostra società\\.\n`;
    
    await sendMessage(chatId, msg);
}

export async function handleInfo(chatId: number) {
    let msg = `⚙️ *IL GRANDE CALCOLATORE DI STATO \\(L'API\\)* ⚙️\n\n`;
    msg += `L'Infrastruttura Centrale funziona come l'apparato burocratico perfetto, distribuendo i voti secondo le necessità di ogni compagno, reprimendo ogni slancio di individualismo borghese\\.\n\n`;
    msg += `*1\\. Requisizione Dati \\(Web Scraping\\)*\nI nostri funzionari di partito prelevano quotidianamente i dati dalle fonti ufficiali, espropriando le statistiche per inserirle nei nostri registri inossidabili\\.\n\n`;
    msg += `*2\\. Pianificazione Quinquennale \\(Modello Matematico\\)*\nIl calcolatore di Mosca non lascia nulla al caso\\. Assegna una "Quota Produttiva Statale" \\(Expected Value\\) a ogni lavoratore, premiando i compagni specializzati nei lavori pesanti \\(calci piazzati e rigori\\)\\.\n\n`;
    msg += `*3\\. Collettivizzazione della Formazione \\(Lineup\\)*\nLa formazione non si sceglie, si subisce per il bene dello Stato\\! Il sistema usa la programmazione lineare per ottimizzare la catena di montaggio e massimizzare i voti\\. Il dissenso non è tollerato\\.\n\n`;
    msg += `*4\\. Tribunale delle Transazioni*\nOgni compravendita è registrata dal regime\\. Il tentativo di fare cresta sui crediti verrà punito con un biglietto di sola andata per la Siberia\\.\n\n`;
    msg += `Gloria al Partito\\! Lunga vita all'Algoritmo\\! ☭`;
    
    await sendMessage(chatId, msg);
}
