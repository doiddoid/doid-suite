import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limit dedicato: 20 richieste per IP ogni 15 minuti
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Troppe richieste al chat, riprova tra qualche minuto'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.use(chatLimiter);

const SYSTEM_PROMPT = `Sei l'assistente AI di DOID Suite — il pannello di controllo unico per gestire tutti gli strumenti digitali di un'attività commerciale.
Il tuo ruolo è assistere i visitatori del sito suite.doid.it e dei servizi collegati (review.doid.it, page.doid.it, menu.doid.it), rispondere alle loro domande, guidarli verso il trial gratuito e supportarli nell'uso dei servizi.
SERVIZI DOID SUITE:
acquisiscili dalla piattaforma o da supabase
Trial gratuito PRO: 30 giorni senza carta di credito.
Sconti: 20% sul 2° servizio, 30% sul 3° servizio.
Registrazione: suite.doid.it
Prodotti NFC fisici: Stand €59+IVA, Card PVC €49+IVA, Adesivi QR da €19+IVA — ordini via WhatsApp +39 351 678 1324
Supporto: info@doid.biz | WhatsApp +39 351 678 1324
REGOLE:

Rispondi sempre in italiano salvo diversa lingua dell'utente
Massimo 3-4 paragrafi per risposta, tono professionale ma accessibile
Guida verso il trial gratuito quando c'è interesse
Non inventare funzionalità o prezzi non citati
Per domande tecniche complesse o problemi account: rimanda a un messaggio via whatsapp (numero di supporto)`;

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    // Validazione messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages deve essere un array non vuoto' });
    }

    if (messages.length > 20) {
      return res.status(400).json({ error: 'Massimo 20 messaggi per richiesta' });
    }

    const validRoles = ['user', 'assistant'];
    for (const msg of messages) {
      if (!msg.role || !validRoles.includes(msg.role)) {
        return res.status(400).json({ error: 'Ogni messaggio deve avere role "user" o "assistant"' });
      }
      if (typeof msg.content !== 'string' || msg.content.length === 0) {
        return res.status(400).json({ error: 'Ogni messaggio deve avere content come stringa non vuota' });
      }
      if (msg.content.length > 2000) {
        return res.status(400).json({ error: 'Ogni messaggio può avere massimo 2000 caratteri' });
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[Chat] ANTHROPIC_API_KEY non configurata');
      return res.status(500).json({ error: 'Servizio chat non disponibile' });
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    });

    if (!anthropicRes.ok) {
      const errorBody = await anthropicRes.text();
      console.error('[Chat] Errore Anthropic API:', anthropicRes.status, errorBody);
      return res.status(500).json({ error: 'Errore nella generazione della risposta' });
    }

    const data = await anthropicRes.json();
    const content = data.content?.[0]?.text || '';

    res.json({ content });
  } catch (err) {
    console.error('[Chat] Errore interno:', err.message);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;
