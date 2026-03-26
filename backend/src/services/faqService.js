import { supabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';

class FaqService {
  // GET pubbliche: FAQ pubblicate, raggruppate per servizio
  async getPublishedFaqs(serviceCode = null) {
    let query = supabaseAdmin
      .from('faqs')
      .select('id, service_code, question, answer, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (serviceCode) {
      query = query.eq('service_code', serviceCode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching FAQs:', error);
      throw Errors.Internal('Errore nel recupero delle FAQ');
    }

    return data;
  }

  // ADMIN: tutte le FAQ (anche non pubblicate)
  async getAllFaqs(serviceCode = null) {
    let query = supabaseAdmin
      .from('faqs')
      .select('*')
      .order('service_code', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (serviceCode) {
      query = query.eq('service_code', serviceCode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all FAQs:', error);
      throw Errors.Internal('Errore nel recupero delle FAQ');
    }

    return data;
  }

  // ADMIN: crea FAQ
  async createFaq({ service_code, question, answer, sort_order = 0, is_published = true }) {
    if (!service_code || !question || !answer) {
      throw Errors.Validation('Servizio, domanda e risposta sono obbligatori');
    }

    const { data, error } = await supabaseAdmin
      .from('faqs')
      .insert({ service_code, question, answer, sort_order, is_published })
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ:', error);
      throw Errors.Internal('Errore nella creazione della FAQ');
    }

    return data;
  }

  // ADMIN: aggiorna FAQ
  async updateFaq(id, updates) {
    const allowed = ['service_code', 'question', 'answer', 'sort_order', 'is_published'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }

    if (Object.keys(filtered).length === 0) {
      throw Errors.Validation('Nessun campo da aggiornare');
    }

    const { data, error } = await supabaseAdmin
      .from('faqs')
      .update(filtered)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating FAQ:', error);
      throw Errors.Internal('Errore nell\'aggiornamento della FAQ');
    }

    if (!data) {
      throw Errors.NotFound('FAQ non trovata');
    }

    return data;
  }

  // ADMIN: elimina FAQ
  async deleteFaq(id) {
    const { error } = await supabaseAdmin
      .from('faqs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting FAQ:', error);
      throw Errors.Internal('Errore nell\'eliminazione della FAQ');
    }

    return true;
  }

  // ADMIN: riordina FAQ di un servizio
  async reorderFaqs(serviceCode, orderedIds) {
    const updates = orderedIds.map((id, index) =>
      supabaseAdmin
        .from('faqs')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('service_code', serviceCode)
    );

    await Promise.all(updates);
    return true;
  }
}

export default new FaqService();
