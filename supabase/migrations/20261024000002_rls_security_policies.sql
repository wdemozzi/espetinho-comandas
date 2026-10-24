-- ========================================================
-- MIGRATION 002: ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Enable RLS on all tables
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_split_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_adjustments ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles AS $$
    SELECT * FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_establishment()
RETURNS UUID AS $$
    SELECT establishment_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. ESTABLISHMENTS POLICIES
-- Public can view active establishment info by slug or id
CREATE POLICY "Public can view active establishment"
ON public.establishments FOR SELECT
USING (is_active = TRUE);

-- Admin can update their own establishment
CREATE POLICY "Admin can update own establishment"
ON public.establishments FOR UPDATE
USING (id = public.get_current_user_establishment() AND public.get_current_user_role() = 'admin');

-- 2. PROFILES POLICIES
-- Staff can view members of their own establishment
CREATE POLICY "Staff can view peers in same establishment"
ON public.profiles FOR SELECT
USING (establishment_id = public.get_current_user_establishment());

-- Admin can manage staff profiles
CREATE POLICY "Admin can insert profiles in own establishment"
ON public.profiles FOR INSERT
WITH CHECK (establishment_id = public.get_current_user_establishment() AND public.get_current_user_role() = 'admin');

CREATE POLICY "Admin can update profiles in own establishment"
ON public.profiles FOR UPDATE
USING (establishment_id = public.get_current_user_establishment() AND public.get_current_user_role() = 'admin');

-- 3. CATEGORIES POLICIES
-- Public can view active categories
CREATE POLICY "Public can view active categories"
ON public.categories FOR SELECT
USING (is_active = TRUE);

-- Admin can manage categories
CREATE POLICY "Admin can manage categories"
ON public.categories FOR ALL
USING (establishment_id = public.get_current_user_establishment() AND public.get_current_user_role() = 'admin');

-- 4. PRODUCTS & ADDONS POLICIES
-- Public can view available products
CREATE POLICY "Public can view available products"
ON public.products FOR SELECT
USING (is_available = TRUE);

-- Admin can manage products
CREATE POLICY "Admin can manage products"
ON public.products FOR ALL
USING (establishment_id = public.get_current_user_establishment() AND public.get_current_user_role() = 'admin');

-- Public can view addons
CREATE POLICY "Public can view product addons"
ON public.product_addons FOR SELECT
USING (is_available = TRUE);

-- Admin can manage addons
CREATE POLICY "Admin can manage addons"
ON public.product_addons FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_addons.product_id 
    AND p.establishment_id = public.get_current_user_establishment() 
    AND public.get_current_user_role() = 'admin'
));

-- 5. RESTAURANT TABLES POLICIES
-- Public can view table by QR token
CREATE POLICY "Public can lookup table by QR token"
ON public.restaurant_tables FOR SELECT
USING (is_active = TRUE);

-- Staff can view all tables in their establishment
CREATE POLICY "Staff can view tables in own establishment"
ON public.restaurant_tables FOR SELECT
USING (establishment_id = public.get_current_user_establishment());

-- Admin can manage tables
CREATE POLICY "Admin can manage tables"
ON public.restaurant_tables FOR ALL
USING (establishment_id = public.get_current_user_establishment() AND public.get_current_user_role() = 'admin');

-- Garçom and Caixa can update table status (e.g. libre to ocupada)
CREATE POLICY "Staff can update table status"
ON public.restaurant_tables FOR UPDATE
USING (establishment_id = public.get_current_user_establishment());

-- 6. TABS POLICIES
-- Staff can view all tabs in their establishment
CREATE POLICY "Staff can view tabs"
ON public.tabs FOR SELECT
USING (establishment_id = public.get_current_user_establishment());

-- Garcom and Caixa and Admin can insert and update tabs
CREATE POLICY "Staff can open tabs"
ON public.tabs FOR INSERT
WITH CHECK (establishment_id = public.get_current_user_establishment());

CREATE POLICY "Staff can update tabs"
ON public.tabs FOR UPDATE
USING (establishment_id = public.get_current_user_establishment());

-- 7. ORDERS & TAB_ORDERS POLICIES
-- Staff can view orders in their establishment
CREATE POLICY "Staff can view orders"
ON public.orders FOR SELECT
USING (establishment_id = public.get_current_user_establishment());

-- Public can view their own order by ID (for public status page)
CREATE POLICY "Public can view specific order by id"
ON public.orders FOR SELECT
USING (TRUE);

-- Staff can insert orders
CREATE POLICY "Staff can insert orders"
ON public.orders FOR INSERT
WITH CHECK (establishment_id = public.get_current_user_establishment());

-- Public can place orders (via QR or Catalog)
CREATE POLICY "Public can place orders"
ON public.orders FOR INSERT
WITH CHECK (origin IN ('table_qr', 'external_catalog'));

CREATE POLICY "Staff can update orders"
ON public.orders FOR UPDATE
USING (establishment_id = public.get_current_user_establishment());

CREATE POLICY "Staff can link orders to tabs"
ON public.tab_orders FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.tabs t 
    WHERE t.id = tab_orders.tab_id 
    AND t.establishment_id = public.get_current_user_establishment()
));

-- 8. ORDER ITEMS POLICIES
CREATE POLICY "Staff can view order items"
ON public.order_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.establishment_id = public.get_current_user_establishment()
));

CREATE POLICY "Public can view own order items"
ON public.order_items FOR SELECT
USING (TRUE);

CREATE POLICY "Staff or Customer can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id
));

CREATE POLICY "Kitchen and Waiter can update order items status"
ON public.order_items FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.establishment_id = public.get_current_user_establishment()
));

-- 9. BILL SPLITS & PARTICIPANTS POLICIES
CREATE POLICY "Cashier and Admin can manage bill splits"
ON public.bill_splits FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.tabs t 
    WHERE t.id = bill_splits.tab_id 
    AND t.establishment_id = public.get_current_user_establishment()
    AND public.get_current_user_role() IN ('admin', 'caixa')
));

CREATE POLICY "Cashier and Admin can manage split participants"
ON public.bill_split_participants FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.bill_splits s
    JOIN public.tabs t ON t.id = s.tab_id
    WHERE s.id = bill_split_participants.split_id
    AND t.establishment_id = public.get_current_user_establishment()
    AND public.get_current_user_role() IN ('admin', 'caixa')
));

-- 10. PAYMENTS & ADJUSTMENTS POLICIES
CREATE POLICY "Cashier and Admin can view and record payments"
ON public.payments FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.tabs t 
    WHERE t.id = payments.tab_id 
    AND t.establishment_id = public.get_current_user_establishment()
    AND public.get_current_user_role() IN ('admin', 'caixa')
));

CREATE POLICY "Admin can manage adjustments"
ON public.payment_adjustments FOR ALL
USING (public.get_current_user_role() = 'admin');
