import { supabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';

class GuideService {
  async getPublishedGuides(serviceCode = null) {
    let query = supabaseAdmin
      .from('guides')
      .select('id, service_code, title, subtitle, sections, faq, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (serviceCode) {
      query = query.eq('service_code', serviceCode);
    }

    const { data, error } = await query;
    if (error) throw Errors.Internal('Errore nel recupero delle guide');
    return data;
  }

  async getAllGuides(serviceCode = null) {
    let query = supabaseAdmin
      .from('guides')
      .select('*')
      .order('service_code', { ascending: true })
      .order('sort_order', { ascending: true });

    if (serviceCode) {
      query = query.eq('service_code', serviceCode);
    }

    const { data, error } = await query;
    if (error) throw Errors.Internal('Errore nel recupero delle guide');
    return data;
  }

  async createGuide({ service_code, title, subtitle, sections, faq, sort_order }) {
    const { data, error } = await supabaseAdmin
      .from('guides')
      .insert({
        service_code,
        title,
        subtitle: subtitle || '',
        sections: sections || [],
        faq: faq || [],
        sort_order: sort_order || 0,
        is_published: true
      })
      .select()
      .single();

    if (error) throw Errors.Internal('Errore nella creazione della guida');
    return data;
  }

  async updateGuide(id, updates) {
    const allowed = ['title', 'subtitle', 'service_code', 'sections', 'faq', 'sort_order', 'is_published'];
    const updateData = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) updateData[key] = updates[key];
    }

    const { data, error } = await supabaseAdmin
      .from('guides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw Errors.Internal('Errore nell\'aggiornamento della guida');
    return data;
  }

  async deleteGuide(id) {
    const { error } = await supabaseAdmin
      .from('guides')
      .delete()
      .eq('id', id);

    if (error) throw Errors.Internal('Errore nell\'eliminazione della guida');
  }
}

export default new GuideService();
