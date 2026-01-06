/**
 * Webhooks Routes
 *
 * Endpoint per ricevere webhook da sistemi esterni (GHL, Stripe, etc.)
 * Questi endpoint NON richiedono autenticazione utente, ma verificano
 * la signature del webhook per sicurezza.
 */

import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import subscriptionService from '../services/subscriptionService.js';
import webhookService from '../services/webhookService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================

/**
 * Verifica signature webhook GHL
 */
function verifyGHLSignature(payload, signature) {
  const secret = process.env.GHL_WEBHOOK_RECEIVE_SECRET;
  if (!secret) {
    console.warn('[WEBHOOK] GHL_WEBHOOK_RECEIVE_SECRET not configured, skipping verification');
    return true;
  }
  return signature === secret;
}

/**
 * Trova utente e attività per email
 */
async function findUserByEmail(email) {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error('[WEBHOOK] Error listing users:', error);
    return null;
  }

  const user = users.users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
  if (!user) return null;

  // Trova attività dell'utente
  const { data: activityUsers } = await supabaseAdmin
    .from('activity_users')
    .select(`
      activity_id,
      role,
      activity:activities (id, name, status)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const activeActivities = activityUsers?.filter(au => au.activity?.status === 'active') || [];

  return {
    user,
    activities: activeActivities,
    primaryActivity: activeActivities[0]?.activity || null
  };
}

/**
 * Determina il servizio dal nome prodotto GHL
 */
function parseServiceFromProduct(productName) {
  const name = (productName || '').toLowerCase();

  if (name.includes('smart review') || name.includes('smartreview')) {
    return 'smart_review';
  }
  if (name.includes('smart page') || name.includes('smartpage') || name.includes('vcard')) {
    return 'smart_page';
  }
  if (name.includes('menu') || name.includes('menù')) {
    return 'menu_digitale';
  }
  if (name.includes('display')) {
    return 'display_suite';
  }

  return null;
}

/**
 * Determina billing cycle dal prezzo
 */
function parseBillingCycle(amount, serviceCode) {
  const monthlyPrices = {
    smart_review: 9.90,
    smart_page: 6.90,
    menu_digitale: 9.90,
    display_suite: 14.90
  };

  const monthlyPrice = monthlyPrices[serviceCode] || 10;
  // Se il prezzo è > 3x il mensile, è annuale
  return parseFloat(amount) > (monthlyPrice * 3) ? 'yearly' : 'monthly';
}

// ==================== GHL PAYMENT WEBHOOK ====================

/**
 * POST /api/webhooks/ghl/payment
 *
 * Riceve webhook da GHL quando un pagamento è completato.
 * GHL Workflow: Payment Received → Custom Webhook
 *
 * Payload atteso (configurare in GHL):
 * {
 *   "event": "payment.received",
 *   "email": "{{contact.email}}",
 *   "contactId": "{{contact.id}}",
 *   "firstName": "{{contact.first_name}}",
 *   "lastName": "{{contact.last_name}}",
 *   "transactionId": "{{payment.transaction_id}}",
 *   "amount": "{{payment.total_amount}}",
 *   "currency": "{{payment.currency_code}}",
 *   "status": "{{payment.payment_status}}",
 *   "productName": "{{payment.product_name}}",
 *   "subscriptionId": "{{payment.subscription_id}}"
 * }
 */
router.post('/ghl/payment',
  express.json(),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    console.log('[GHL-WEBHOOK] Received payment webhook');

    // Verifica signature
    const signature = req.headers['x-ghl-signature'] || req.headers['x-webhook-secret'];
    if (!verifyGHLSignature(req.body, signature)) {
      console.error('[GHL-WEBHOOK] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const {
      event,
      email,
      contactId,
      firstName,
      lastName,
      transactionId,
      amount,
      currency = 'EUR',
      status,
      productName,
      subscriptionId,
      // Campi opzionali aggiuntivi
      invoiceId,
      paymentMethod
    } = req.body;

    console.log(`[GHL-WEBHOOK] Event: ${event}, Email: ${email}, Product: ${productName}, Amount: ${amount}`);

    // Verifica che sia un pagamento completato
    const validStatuses = ['succeeded', 'paid', 'completed', 'success'];
    if (!validStatuses.includes(status?.toLowerCase())) {
      console.log(`[GHL-WEBHOOK] Payment not completed, status: ${status}`);
      return res.json({
        received: true,
        processed: false,
        reason: `Payment status: ${status}`
      });
    }

    // Verifica email presente
    if (!email) {
      console.error('[GHL-WEBHOOK] Missing email in payload');
      return res.status(400).json({ error: 'Missing email' });
    }

    // Trova utente per email
    const userData = await findUserByEmail(email);

    if (!userData) {
      console.error(`[GHL-WEBHOOK] User not found for email: ${email}`);

      // Log transazione comunque (per review manuale)
      await supabaseAdmin.from('payment_transactions').insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Placeholder
        service_code: parseServiceFromProduct(productName) || 'unknown',
        transaction_id: transactionId,
        amount: parseFloat(amount) || 0,
        currency,
        status: 'pending_review',
        source: 'gohighlevel',
        customer_email: email,
        customer_name: `${firstName || ''} ${lastName || ''}`.trim(),
        raw_payload: req.body,
        error_message: 'User not found in DOID Suite'
      });

      return res.status(404).json({
        error: 'User not found',
        email,
        message: 'Transaction logged for manual review'
      });
    }

    const { user, primaryActivity } = userData;

    // Determina servizio dal nome prodotto
    const serviceCode = parseServiceFromProduct(productName);

    if (!serviceCode) {
      console.error(`[GHL-WEBHOOK] Cannot determine service from product: ${productName}`);

      await supabaseAdmin.from('payment_transactions').insert({
        activity_id: primaryActivity?.id,
        user_id: user.id,
        service_code: 'unknown',
        transaction_id: transactionId,
        amount: parseFloat(amount) || 0,
        currency,
        status: 'pending_review',
        source: 'gohighlevel',
        customer_email: email,
        customer_name: `${firstName || ''} ${lastName || ''}`.trim(),
        raw_payload: req.body,
        error_message: `Cannot determine service from product: ${productName}`
      });

      return res.status(400).json({
        error: 'Cannot determine service',
        productName,
        message: 'Transaction logged for manual review'
      });
    }

    // Verifica attività disponibile
    if (!primaryActivity) {
      console.error(`[GHL-WEBHOOK] No activity found for user: ${email}`);

      await supabaseAdmin.from('payment_transactions').insert({
        user_id: user.id,
        service_code: serviceCode,
        transaction_id: transactionId,
        amount: parseFloat(amount) || 0,
        currency,
        status: 'pending_review',
        source: 'gohighlevel',
        customer_email: email,
        customer_name: `${firstName || ''} ${lastName || ''}`.trim(),
        raw_payload: req.body,
        error_message: 'No active activity found for user'
      });

      return res.status(400).json({
        error: 'No activity found',
        email,
        message: 'Transaction logged for manual review'
      });
    }

    // Determina billing cycle
    const billingCycle = parseBillingCycle(amount, serviceCode);

    try {
      // Attiva abbonamento
      const subscription = await subscriptionService.activateFromPayment({
        activityId: primaryActivity.id,
        serviceCode,
        planCode: 'pro',
        billingCycle,
        externalSubscriptionId: subscriptionId,
        transactionId,
        paidAmount: parseFloat(amount)
      });

      // Log transazione completata
      await supabaseAdmin.from('payment_transactions').insert({
        activity_id: primaryActivity.id,
        user_id: user.id,
        service_code: serviceCode,
        transaction_id: transactionId,
        external_subscription_id: subscriptionId,
        amount: parseFloat(amount) || 0,
        currency,
        status: 'completed',
        source: 'gohighlevel',
        payment_method: paymentMethod,
        billing_cycle: billingCycle,
        customer_email: email,
        customer_name: `${firstName || ''} ${lastName || ''}`.trim(),
        raw_payload: req.body,
        completed_at: new Date().toISOString()
      });

      // Invia webhook a GHL per conferma attivazione
      await webhookService.sendSubscriptionActivated({
        email: user.email,
        fullName: user.user_metadata?.full_name || `${firstName} ${lastName}`,
        userId: user.id,
        activityId: primaryActivity.id,
        activityName: primaryActivity.name,
        service: serviceCode,
        serviceName: webhookService.getServiceLabel(serviceCode),
        plan: 'pro',
        planName: 'PRO',
        billingCycle,
        price: amount,
        nextBillingDate: subscription.currentPeriodEnd
      });

      const elapsed = Date.now() - startTime;
      console.log(`[GHL-WEBHOOK] ✓ Subscription activated for ${email}/${serviceCode} in ${elapsed}ms`);

      res.json({
        received: true,
        processed: true,
        subscription: {
          id: subscription.id,
          activityId: primaryActivity.id,
          service: serviceCode,
          status: 'active',
          billingCycle
        }
      });

    } catch (error) {
      console.error(`[GHL-WEBHOOK] Error activating subscription:`, error);

      // Log transazione fallita
      await supabaseAdmin.from('payment_transactions').insert({
        activity_id: primaryActivity.id,
        user_id: user.id,
        service_code: serviceCode,
        transaction_id: transactionId,
        amount: parseFloat(amount) || 0,
        currency,
        status: 'failed',
        source: 'gohighlevel',
        customer_email: email,
        raw_payload: req.body,
        error_message: error.message
      });

      res.status(500).json({
        error: 'Failed to activate subscription',
        message: error.message
      });
    }
  })
);

// ==================== GHL SUBSCRIPTION EVENTS ====================

/**
 * POST /api/webhooks/ghl/subscription
 *
 * Riceve eventi subscription da GHL (rinnovi, cancellazioni, etc.)
 */
router.post('/ghl/subscription',
  express.json(),
  asyncHandler(async (req, res) => {
    console.log('[GHL-WEBHOOK] Received subscription event');

    const signature = req.headers['x-ghl-signature'] || req.headers['x-webhook-secret'];
    if (!verifyGHLSignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const {
      event,
      email,
      subscriptionId,
      productName,
      status,
      cancelledAt,
      nextBillingDate
    } = req.body;

    console.log(`[GHL-WEBHOOK] Subscription event: ${event}, Email: ${email}`);

    const userData = await findUserByEmail(email);
    if (!userData) {
      console.error(`[GHL-WEBHOOK] User not found: ${email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const serviceCode = parseServiceFromProduct(productName);
    if (!serviceCode) {
      console.error(`[GHL-WEBHOOK] Cannot determine service: ${productName}`);
      return res.status(400).json({ error: 'Cannot determine service' });
    }

    const { primaryActivity } = userData;
    if (!primaryActivity) {
      return res.status(400).json({ error: 'No activity found' });
    }

    try {
      switch (event) {
        case 'subscription.cancelled':
        case 'subscription.canceled':
          await subscriptionService.cancelSubscription(primaryActivity.id, serviceCode);

          await webhookService.sendSubscriptionCancelled({
            email: userData.user.email,
            fullName: userData.user.user_metadata?.full_name,
            service: serviceCode,
            serviceName: webhookService.getServiceLabel(serviceCode),
            cancellationDate: cancelledAt || new Date().toISOString(),
            activityId: primaryActivity.id
          });

          console.log(`[GHL-WEBHOOK] ✓ Subscription cancelled: ${email}/${serviceCode}`);
          break;

        case 'subscription.renewed':
        case 'invoice.paid':
          // Estendi periodo abbonamento
          await subscriptionService.renewSubscription(primaryActivity.id, serviceCode);

          await webhookService.sendSubscriptionRenewed({
            email: userData.user.email,
            fullName: userData.user.user_metadata?.full_name,
            service: serviceCode,
            serviceName: webhookService.getServiceLabel(serviceCode),
            nextBillingDate,
            activityId: primaryActivity.id
          });

          console.log(`[GHL-WEBHOOK] ✓ Subscription renewed: ${email}/${serviceCode}`);
          break;

        case 'payment.failed':
        case 'invoice.payment_failed':
          // Segna come past_due
          await subscriptionService.markPaymentFailed(primaryActivity.id, serviceCode);

          await webhookService.sendPaymentFailed({
            email: userData.user.email,
            fullName: userData.user.user_metadata?.full_name,
            service: serviceCode,
            serviceName: webhookService.getServiceLabel(serviceCode),
            activityId: primaryActivity.id
          });

          console.log(`[GHL-WEBHOOK] ✓ Payment failed logged: ${email}/${serviceCode}`);
          break;

        default:
          console.log(`[GHL-WEBHOOK] Unhandled event: ${event}`);
      }

      res.json({ received: true, processed: true, event });

    } catch (error) {
      console.error(`[GHL-WEBHOOK] Error processing ${event}:`, error);
      res.status(500).json({ error: error.message });
    }
  })
);

// ==================== HEALTH CHECK ====================

/**
 * GET /api/webhooks/health
 *
 * Health check per verificare che gli endpoint siano attivi
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/webhooks/ghl/payment',
      'POST /api/webhooks/ghl/subscription'
    ]
  });
});

// ==================== TEST ENDPOINT (solo development) ====================

if (process.env.NODE_ENV === 'development') {
  /**
   * POST /api/webhooks/test
   *
   * Endpoint per testare il flusso webhook in locale
   */
  router.post('/test',
    express.json(),
    asyncHandler(async (req, res) => {
      console.log('[WEBHOOK-TEST] Received test payload:', JSON.stringify(req.body, null, 2));

      res.json({
        received: true,
        payload: req.body,
        headers: {
          'content-type': req.headers['content-type'],
          'x-ghl-signature': req.headers['x-ghl-signature']
        }
      });
    })
  );
}

export default router;
