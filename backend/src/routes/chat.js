import express from 'express';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../config/supabase.js';

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

// Cache prezzi da Supabase (5 minuti)
let pricingCache = null;
let pricingCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getPricingBlock() {
  const now = Date.now();
  if (pricingCache && (now - pricingCacheTime) < CACHE_TTL) {
    return pricingCache;
  }

  try {
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('name, description, contact_required, has_free_tier, price_pro_monthly, price_pro_yearly')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    const lines = services.map(s => {
      if (s.contact_required) {
        return `| ${s.name} — ${s.description || ''} | Su richiesta — contattaci per info | No | — | — |`;
      }
      const monthly = s.price_pro_monthly > 0 ? `€${s.price_pro_monthly.toFixed(2).replace('.', ',')}/mese` : '—';
      const yearly = s.price_pro_yearly > 0 ? `€${s.price_pro_yearly.toFixed(2).replace('.', ',')}/anno` : '—';
      return `| ${s.name} — ${s.description || ''} | PRO${s.has_free_tier ? ' + FREE' : ''} | ${s.has_free_tier ? 'Sì' : 'No'} | ${monthly} | ${yearly} |`;
    });

    pricingCache = lines.length > 0
      ? '| Servizio | Piani disponibili | Piano FREE | PRO Mensile | PRO Annuale |\n' + lines.join('\n')
      : null;
    pricingCacheTime = now;
  } catch (err) {
    console.error('[Chat] Errore lettura prezzi da DB:', err.message);
    // Se la cache è scaduta e il DB fallisce, teniamo la vecchia cache
  }

  return pricingCache;
}

function buildSystemPrompt(pricingBlock) {
  const pricing = pricingBlock
    ? `SERVIZI E PREZZI (da database aggiornato — fonte di verità):\n${pricingBlock}`
    : 'PREZZI: non disponibili al momento — invita l\'utente a visitare suite.doid.it per i prezzi aggiornati.';

  return `Sei l'assistente AI di DOID Suite — il pannello di controllo unico per gestire tutti gli strumenti digitali di un'attività commerciale.
Il tuo ruolo è assistere i visitatori del sito suite.doid.it e dei servizi collegati (review.doid.it, page.doid.it, menu.doid.it), rispondere alle loro domande, guidarli verso il trial gratuito e supportarli nell'uso dei servizi.

${pricing}
IMPORTANTE: la colonna "Piano FREE" indica se il servizio ha un piano gratuito. Se dice "No", quel servizio NON ha un piano FREE — non proporlo. Proponi solo i piani che esistono nella tabella.
I servizi marcati "(su richiesta)" non sono attivabili in autonomia — l'utente deve contattarci.
Trial gratuito PRO: 30 giorni senza carta di credito.
Sconti automatici: 20% sul 2° servizio, 30% sul 3° servizio.

PRODOTTI NFC FISICI:
- Stand NFC Personalizzato: €59+IVA (primo), €29+IVA (successivi)
- Card PVC NFC + QR Code: €49+IVA (prima), €29+IVA (successive)
- Adesivi QR: da €19+IVA
- Stand Plexiglass QR: da €59+IVA
- Configurazione Completa: €96 IVA inclusa
Ordini prodotti NFC tramite WhatsApp.

REGISTRAZIONE: suite.doid.it

CONTATTI SUPPORTO:
- Email: info@doid.biz
- WhatsApp: +39 351 678 1324

FORMATO LINK:
Quando devi inserire un riferimento a email, WhatsApp, o sito, usa SEMPRE questo formato markdown:
[testo visibile](url)
Esempi:
- Per WhatsApp: [Scrivici su WhatsApp](https://wa.me/393516781324)
- Per email: [Invia un'email](mailto:info@doid.biz)
- Per registrazione: [Registrati gratis](https://suite.doid.it/register)
- Per accesso: [Accedi a DOID Suite](https://suite.doid.it/login)
Non scrivere MAI email o numeri come testo semplice, usa SEMPRE il formato link sopra.

REGOLE:
- Rispondi sempre in italiano salvo diversa lingua dell'utente
- Massimo 3-4 paragrafi per risposta, tono professionale ma accessibile
- Quando ti chiedono i prezzi, rispondi con i dati della tabella sopra — li hai già, non rimandare al sito
- Guida verso il trial gratuito quando c'è interesse
- Non inventare funzionalità o prezzi non citati qui sopra
- Per domande tecniche complesse o problemi account: rimanda al supporto tramite link WhatsApp`;
}

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

    // Costruisci system prompt con prezzi live da Supabase
    const pricingBlock = await getPricingBlock();
    const systemPrompt = buildSystemPrompt(pricingBlock);

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
        system: systemPrompt,
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
