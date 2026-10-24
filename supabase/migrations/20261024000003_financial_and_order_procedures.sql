-- ========================================================
-- MIGRATION 003: PROCEDURES & INTEGRITY TRIGGERS
-- ========================================================

-- 1. Recalculate Tab Total Trigger
CREATE OR REPLACE FUNCTION public.sync_tab_total_on_order()
RETURNS TRIGGER AS $$
DECLARE
    v_tab_id UUID;
    v_total INT;
BEGIN
    -- Determine tab_id based on operation
    IF TG_TABLE_NAME = 'tab_orders' THEN
        v_tab_id := COALESCE(NEW.tab_id, OLD.tab_id);
    ELSIF TG_TABLE_NAME = 'order_items' THEN
        SELECT t.tab_id INTO v_tab_id
        FROM public.tab_orders t
        WHERE t.order_id = COALESCE(NEW.order_id, OLD.order_id)
        LIMIT 1;
    END IF;

    IF v_tab_id IS NOT NULL THEN
        SELECT COALESCE(SUM(oi.total_cents), 0)
        INTO v_total
        FROM public.tab_orders to_link
        JOIN public.orders o ON o.id = to_link.order_id
        JOIN public.order_items oi ON oi.order_id = o.id
        WHERE to_link.tab_id = v_tab_id
        AND oi.status != 'cancelled';

        UPDATE public.tabs
        SET total_cents = v_total,
            updated_at = NOW()
        WHERE id = v_tab_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_tab_orders_total ON public.tab_orders;
CREATE TRIGGER trg_tab_orders_total
AFTER INSERT OR DELETE ON public.tab_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_tab_total_on_order();

DROP TRIGGER IF EXISTS trg_order_items_total ON public.order_items;
CREATE TRIGGER trg_order_items_total
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.sync_tab_total_on_order();

-- 2. Atomic Payment Processing Function
CREATE OR REPLACE FUNCTION public.process_tab_payment(
    p_tab_id UUID,
    p_amount_cents INT,
    p_method public.payment_method,
    p_participant_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_tab public.tabs%ROWTYPE;
    v_balance INT;
    v_payment_id UUID;
    v_participant public.bill_split_participants%ROWTYPE;
    v_part_balance INT;
BEGIN
    -- Lock tab row for update to prevent concurrent race condition payments
    SELECT * INTO v_tab
    FROM public.tabs
    WHERE id = p_tab_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comanda não encontrada';
    END IF;

    IF v_tab.status NOT IN ('open', 'closing') THEN
        RAISE EXCEPTION 'A comanda não está aberta para receber pagamentos (status: %)', v_tab.status;
    END IF;

    -- Current remaining balance
    v_balance := (v_tab.total_cents - v_tab.discount_cents) - v_tab.paid_cents;

    IF p_amount_cents <= 0 THEN
        RAISE EXCEPTION 'O valor do pagamento deve ser maior que zero';
    END IF;

    IF p_amount_cents > v_balance THEN
        RAISE EXCEPTION 'Valor do pagamento (% centavos) excede o saldo pendente da comanda (% centavos)', 
            p_amount_cents, v_balance;
    END IF;

    -- Check participant if linked
    IF p_participant_id IS NOT NULL THEN
        SELECT * INTO v_participant
        FROM public.bill_split_participants
        WHERE id = p_participant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Participante da divisão não encontrado';
        END IF;

        v_part_balance := v_participant.assigned_cents - v_participant.paid_cents;
        IF p_amount_cents > v_part_balance THEN
            RAISE EXCEPTION 'Valor (% centavos) excede o saldo atribuído ao participante (% centavos)', 
                p_amount_cents, v_part_balance;
        END IF;

        -- Update participant paid amount & status
        UPDATE public.bill_split_participants
        SET paid_cents = paid_cents + p_amount_cents,
            status = CASE 
                WHEN (paid_cents + p_amount_cents) >= assigned_cents THEN 'paid'::public.participant_payment_status
                ELSE 'partial'::public.participant_payment_status
            END,
            updated_at = NOW()
        WHERE id = p_participant_id;
    END IF;

    -- Record immutable payment
    INSERT INTO public.payments (
        tab_id,
        split_participant_id,
        recorded_by,
        amount_cents,
        method,
        notes
    ) VALUES (
        p_tab_id,
        p_participant_id,
        auth.uid(),
        p_amount_cents,
        p_method,
        p_notes
    ) RETURNING id INTO v_payment_id;

    -- Update Tab paid amount
    UPDATE public.tabs
    SET paid_cents = paid_cents + p_amount_cents,
        status = CASE 
            WHEN (paid_cents + p_amount_cents) >= (total_cents - discount_cents) THEN 'closing'::public.tab_status
            ELSE 'open'::public.tab_status
        END,
        updated_at = NOW()
    WHERE id = p_tab_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'payment_id', v_payment_id,
        'new_paid_cents', v_tab.paid_cents + p_amount_cents,
        'remaining_cents', v_balance - p_amount_cents
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Close Tab and Release Table Function
CREATE OR REPLACE FUNCTION public.close_tab_and_release_table(
    p_tab_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_tab public.tabs%ROWTYPE;
    v_pending INT;
BEGIN
    SELECT * INTO v_tab
    FROM public.tabs
    WHERE id = p_tab_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comanda não encontrada';
    END IF;

    v_pending := (v_tab.total_cents - v_tab.discount_cents) - v_tab.paid_cents;

    IF v_pending > 0 THEN
        RAISE EXCEPTION 'Não é permitido encerrar comanda com saldo pendente de % centavos (R$ %)', 
            v_pending, (v_pending / 100.0);
    END IF;

    -- Close tab
    UPDATE public.tabs
    SET status = 'paid',
        closed_at = NOW(),
        closed_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_tab_id;

    -- Free table if associated
    IF v_tab.table_id IS NOT NULL THEN
        UPDATE public.restaurant_tables
        SET status = 'livre'
        WHERE id = v_tab.table_id;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Comanda encerrada e mesa liberada com sucesso'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
