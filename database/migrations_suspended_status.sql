-- Migration: Add 'suspended' status to subscription_status enum
-- Run this in Supabase SQL Editor
-- Purpose: Allow subscriptions to be suspended (data kept, access blocked) until customer decides to renew or cancel

-- ============================================
-- ADD 'suspended' TO subscription_status ENUM
-- ============================================

-- PostgreSQL doesn't allow easy modification of enum types
-- We need to add the new value to the enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'suspended';

-- Note: The 'suspended' status means:
-- - Subscription data is preserved
-- - Customer cannot access the service
-- - Can be reactivated by admin or payment
-- - Different from 'expired' (auto-transition) or 'cancelled' (user-initiated)
-- - Different from 'past_due' (payment failed, auto-retry expected)

-- ============================================
-- HELPER FUNCTION: Suspend a subscription
-- ============================================

CREATE OR REPLACE FUNCTION suspend_subscription(p_subscription_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_status subscription_status;
BEGIN
    -- Get current status
    SELECT status INTO v_current_status
    FROM subscriptions
    WHERE id = p_subscription_id;

    IF v_current_status IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Only allow suspension from certain statuses
    IF v_current_status NOT IN ('active', 'trial', 'expired', 'past_due') THEN
        RETURN FALSE;
    END IF;

    -- Update to suspended
    UPDATE subscriptions
    SET
        status = 'suspended',
        updated_at = NOW()
    WHERE id = p_subscription_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Reactivate a suspended subscription
-- ============================================

CREATE OR REPLACE FUNCTION reactivate_subscription(
    p_subscription_id UUID,
    p_new_period_months INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_status subscription_status;
    v_billing_cycle billing_cycle;
    v_new_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current status and billing cycle
    SELECT status, billing_cycle INTO v_current_status, v_billing_cycle
    FROM subscriptions
    WHERE id = p_subscription_id;

    IF v_current_status IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Only allow reactivation from suspended status
    IF v_current_status != 'suspended' THEN
        RETURN FALSE;
    END IF;

    -- Calculate new period end based on billing cycle
    IF v_billing_cycle = 'yearly' THEN
        v_new_period_end := NOW() + INTERVAL '1 year';
    ELSE
        v_new_period_end := NOW() + (p_new_period_months || ' months')::INTERVAL;
    END IF;

    -- Update to active
    UPDATE subscriptions
    SET
        status = 'active',
        current_period_start = NOW(),
        current_period_end = v_new_period_end,
        trial_ends_at = NULL,
        cancelled_at = NULL,
        updated_at = NOW()
    WHERE id = p_subscription_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEX for suspended subscriptions (useful for admin queries)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_suspended
ON subscriptions(status)
WHERE status = 'suspended';
