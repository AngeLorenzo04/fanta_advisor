# 🧮 Modelli Matematici e Regole in Fanta-Advisor

Questo documento descrive formalmente tutte le regole matematiche implementate nel sistema **Fanta-Advisor**, utilizzate dal motore centrale e dal Bot Telegram per prendere decisioni strategiche.

---

## 1. Punteggio Atteso di Giornata (`Expected Match Score`)

L'algoritmo calcola quanti punti ci si aspetta che un giocatore porti in una specifica giornata, considerando la sua forza base e la difficoltà del match.

### Variabili in Gioco
* **`EV` (Expected Value)**: Il fanta-voto atteso di base del giocatore (es. $6.5$).
* **`OS` (Opponent Strength)**: La forza della squadra avversaria, misurata da $1$ (debolissima) a $5$ (fortissima).
* **`Ruolo`**: Ruolo del giocatore ($P, D, C, A$).
* **`starterChance`**: Probabilità di giocare titolare (attualmente assunta a $1.0$).

### Algoritmo di Calcolo

1. **Calcolo del Modificatore Base Avversario (`M_base`)**:
   * $OS = 5 \implies M_{base} = -0.5$
   * $OS = 4 \implies M_{base} = -0.2$
   * $OS = 3 \implies M_{base} = 0.0$
   * $OS = 2 \implies M_{base} = +0.2$
   * $OS = 1 \implies M_{base} = +0.5$

2. **Adeguamento Modificatore in base al Ruolo (`M_finale`)**:
   Il peso della partita cambia in base al ruolo (es. un portiere subisce molto di più l'impatto di un avversario forte).
   * **Portiere ($P$)**: $M_{finale} = M_{base} \times 1.5$
   * **Attaccante ($A$)**: $M_{finale} = M_{base} \times 0.8$
   * **Difensori/Centrocampisti ($D, C$)**: $M_{finale} = M_{base} \times 1.0$

3. **Calcolo Punteggio**:
   $$Score = EV + M_{finale}$$

4. **Penalità Titolarità (se applicabile in futuro)**:
   Se `starterChance` $< 1.0$, il punteggio viene ridotto per riflettere il rischio di non prendere voto:
   $$Score_{adj} = Score \times (0.5 + starterChance \times 0.5)$$

*Il risultato finale viene limitato a un valore non negativo e arrotondato al secondo decimale.*

---

## 2. Calcolo del Prezzo Suggerito all'Asta (`Suggested Price`)

Questo algoritmo stima quanto pagare (in crediti, su base 500) un giocatore, utilizzato specificamente nel comando Telegram `/consigli`.

### Variabili in Gioco
* **`EV` (Expected Value)**: Stima di rendimento stagionale.
* **`Ruolo`**: Impatta il budget che un fantallenatore è solitamente disposto a spendere per quella posizione.

### Algoritmo di Calcolo

1. Se $EV < 5.8$, il giocatore è considerato uno scarto e il prezzo è ancorato a **$1$ credito**.
2. Altrimenti, la crescita del prezzo è **esponenziale**, basata sull'eccesso di prestazione rispetto a una baseline di $5.5$:
   $$Valore = 8 \times (EV - 5.5)^{2.5}$$
3. **Moltiplicatori di Ruolo** (Per adattare il valore alle dinamiche d'asta standard):
   * **Portieri ($P$)**: $Valore = Valore \times 0.5$
   * **Difensori ($D$)**: $Valore = Valore \times 0.7$
   * **Centrocampisti ($C$)**: $Valore = Valore \times 1.1$
   * **Attaccanti ($A$)**: $Valore = Valore \times 1.4$

*Il risultato viene vincolato matematicamente a un range tra $1$ e $450$ crediti, arrotondato all'intero più vicino.*

---

## 3. Valutazione Scambi ("Equità Proletaria")

L'algoritmo valuta se uno scambio 1-a-1 è equo, avvantaggia uno dei partecipanti, o rischia di alterare le dinamiche strutturali della squadra.

### Variabili in Gioco
* **`Val_1`, `Val_2`**: Quotazione Attuale (o Iniziale) dei due calciatori scambiati.
* **`Ruolo_1`, `Ruolo_2`**: Ruoli dei calciatori.

### Algoritmo di Calcolo
1. **Verifica Strutturale**: Se $Ruolo_1 \neq Ruolo_2$, il sistema lancia un "Warning", poiché sbilancia la struttura del collettivo.
2. **Delta Economico**:
   $$\Delta = Val_2 - Val_1$$
3. Se $\Delta = 0$, lo scambio è valutato come **perfettamente equo**.
4. Se $\Delta \neq 0$, il sistema calcola esattamente chi guadagna crediti di rendimento e quantifica il profitto del "capitalista".

---

## 4. Ottimizzazione della Formazione (`Optimal Lineup`)

È un algoritmo di tipo *Combinatorial / Greedy* che cerca la disposizione migliore per massimizzare l'`Expected Match Score` totale della squadra in base ai moduli consentiti.

### Variabili in Gioco
* Lista di tutti i giocatori in squadra, con relativo **Expected Match Score** (già calcolato).
* I **$7$ Moduli Consentiti**: $3-4-3$, $4-3-3$, $3-5-2$, $4-4-2$, $5-3-2$, $4-5-1$, $5-4-1$.

### Algoritmo di Calcolo
1. I giocatori della rosa vengono ordinati per punteggio atteso in ordine **decrescente**.
2. Il sistema itera su tutti i moduli disponibili (es. per il $3-4-3$ cerca $1$ P, $3$ D, $4$ C, $3$ A).
3. Per ogni modulo:
   * Verifica se ci sono giocatori a sufficienza nei rispettivi ruoli.
   * Se sì, "pesca" i migliori giocatori (`slice(0, quota)`) necessari a riempire gli slot.
   * Somma gli `Expected Match Score` dell'Undici Titolare.
4. L'algoritmo tiene in memoria il **Massimo Punteggio Totale (`maxScore`)**. Il modulo e i giocatori che generano il valore più alto diventano l'undici consigliato, e i rimanenti vengono designati come Riserve.
