/**
 * Genera uno slug da una stringa
 * Es: "Ristorante La Bella" -> "ristorante-la-bella"
 */
export function generateSlug(name) {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Rimuovi accenti e caratteri speciali
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Sostituisci caratteri non alfanumerici con trattini
    .replace(/[^a-z0-9]+/g, '-')
    // Rimuovi trattini all'inizio e alla fine
    .replace(/^-+|-+$/g, '')
    // Rimuovi trattini multipli
    .replace(/-+/g, '-');
}

/**
 * Assicura che lo slug sia unico
 * Se esiste già, aggiunge -1, -2, ecc.
 *
 * @param {string} baseSlug - Lo slug base da verificare
 * @param {Function} checkFn - Funzione async che verifica se slug esiste (ritorna true se esiste)
 * @returns {Promise<string>} - Slug unico
 */
export async function ensureUniqueSlug(baseSlug, checkFn) {
  let slug = baseSlug;
  let counter = 1;

  while (await checkFn(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety check per evitare loop infiniti
    if (counter > 1000) {
      throw new Error('Impossibile generare slug unico');
    }
  }

  return slug;
}

export default { generateSlug, ensureUniqueSlug };
