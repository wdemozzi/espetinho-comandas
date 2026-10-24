-- ========================================================
-- MIGRATION 004: SEED DEMO DATA
-- ========================================================

DO $$
DECLARE
    v_est_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_cat_espetinhos UUID := 'b1000000-0000-0000-0000-000000000001';
    v_cat_bebidas UUID := 'b2000000-0000-0000-0000-000000000002';
    v_cat_acompanhamentos UUID := 'b3000000-0000-0000-0000-000000000003';
    v_cat_porcoes UUID := 'b4000000-0000-0000-0000-000000000004';
    v_prod_picanha UUID := 'c1000000-0000-0000-0000-000000000001';
    v_prod_alcatra UUID := 'c2000000-0000-0000-0000-000000000002';
    v_prod_queijo UUID := 'c3000000-0000-0000-0000-000000000003';
    v_prod_frango_bacon UUID := 'c4000000-0000-0000-0000-000000000004';
    v_prod_kafta UUID := 'c5000000-0000-0000-0000-000000000005';
    v_prod_pao_alho UUID := 'c6000000-0000-0000-0000-000000000006';
    v_prod_heineken UUID := 'd1000000-0000-0000-0000-000000000001';
    v_prod_coca UUID := 'd2000000-0000-0000-0000-000000000002';
    v_prod_suco UUID := 'd3000000-0000-0000-0000-000000000003';
    v_prod_mandioca UUID := 'e1000000-0000-0000-0000-000000000001';
    v_prod_farofa UUID := 'e2000000-0000-0000-0000-000000000002';
    v_prod_frita_bacon UUID := 'f1000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Establishment
    INSERT INTO public.establishments (id, name, slug, description, phone, address, opening_hours)
    VALUES (
        v_est_id,
        'Espetinho Raiz & Brasa',
        'espetinho-raiz',
        'O autêntico espetinho na brasa com carnes nobres selecionadas, acompanhamentos da casa e cerveja trincando.',
        '(44) 99735-7463',
        'Av. Paraná, 1250 - Centro',
        'Terça a Domingo das 18h às 00h'
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Categories
    INSERT INTO public.categories (id, establishment_id, name, slug, sort_order, default_sector) VALUES
    (v_cat_espetinhos, v_est_id, 'Espetinhos na Brasa', 'espetinhos', 1, 'churrasqueira'),
    (v_cat_acompanhamentos, v_est_id, 'Acompanhamentos', 'acompanhamentos', 2, 'cozinha'),
    (v_cat_porcoes, v_est_id, 'Porções & Petiscos', 'porcoes', 3, 'cozinha'),
    (v_cat_bebidas, v_est_id, 'Bebidas & Chopp', 'bebidas', 4, 'bar')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Products
    -- Espetinhos
    INSERT INTO public.products (id, establishment_id, category_id, name, description, price_cents, sector, is_available) VALUES
    (v_prod_picanha, v_est_id, v_cat_espetinhos, 'Espetinho de Picanha Nobre', 'Corte nobre com capa de gordura perfeita, sal grosso e toque de manteiga de garrafa.', 2200, 'churrasqueira', TRUE),
    (v_prod_alcatra, v_est_id, v_cat_espetinhos, 'Espetinho de Alcatra Macia', 'Cubos macios de alcatra temperados no sal de parrilla e chimichurri artesanal.', 1800, 'churrasqueira', TRUE),
    (v_prod_queijo, v_est_id, v_cat_espetinhos, 'Espetinho de Queijo Coalho', 'Queijo coalho tostadinho por fora e cremoso por dentro, acompanha melaço de cana.', 1400, 'churrasqueira', TRUE),
    (v_prod_frango_bacon, v_est_id, v_cat_espetinhos, 'Medalhão de Frango com Bacon', 'Peito de frango suculento envolvido em fatias crocantes de bacon defumado.', 1600, 'churrasqueira', TRUE),
    (v_prod_kafta, v_est_id, v_cat_espetinhos, 'Kafta Recheada com Queijo', 'Carne moída selecionada com hortelã fresca, especiarias árabes e recheio generoso de muçarela.', 1700, 'churrasqueira', TRUE),
    (v_prod_pao_alho, v_est_id, v_cat_espetinhos, 'Pão de Alho Especial Recheado', 'Crocante, com pasta de alho suave e queijo gratinado na brasa.', 1200, 'churrasqueira', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Bebidas
    INSERT INTO public.products (id, establishment_id, category_id, name, description, price_cents, sector, is_available) VALUES
    (v_prod_heineken, v_est_id, v_cat_bebidas, 'Cerveja Heineken 600ml', 'Geladíssima no balde de gelo.', 1700, 'bar', TRUE),
    (v_prod_coca, v_est_id, v_cat_bebidas, 'Coca-Cola Original 350ml Lata', 'Lata trincando com limão e gelo.', 700, 'bar', TRUE),
    (v_prod_suco, v_est_id, v_cat_bebidas, 'Suco Natural de Laranja 500ml', 'Feito na hora com laranjas frescas.', 1000, 'bar', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Acompanhamentos
    INSERT INTO public.products (id, establishment_id, category_id, name, description, price_cents, sector, is_available) VALUES
    (v_prod_mandioca, v_est_id, v_cat_acompanhamentos, 'Mandioca Cozida na Manteiga', 'Mandioca amarela desmanchando, regada com manteiga de garrafa e cheiro verde.', 1500, 'cozinha', TRUE),
    (v_prod_farofa, v_est_id, v_cat_acompanhamentos, 'Farofa Crocante da Casa', 'Farofa artesanal com bacon, cebola douradinha e ovos mexidos.', 1200, 'cozinha', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Porções
    INSERT INTO public.products (id, establishment_id, category_id, name, description, price_cents, sector, is_available) VALUES
    (v_prod_frita_bacon, v_est_id, v_cat_porcoes, 'Batata Rústica com Cheddar e Bacon', 'Batatas rústicas com páprica doce, molho cheddar cremoso e cubos de bacon crocante.', 3800, 'cozinha', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Product Addons
    INSERT INTO public.product_addons (product_id, name, price_cents, sort_order) VALUES
    (v_prod_picanha, 'Ponto da carne: Mal passada', 0, 1),
    (v_prod_picanha, 'Ponto da carne: Ao ponto', 0, 2),
    (v_prod_picanha, 'Ponto da carne: Bem passada', 0, 3),
    (v_prod_picanha, 'Molho Alho Extra (+R$ 3,00)', 300, 4),
    (v_prod_alcatra, 'Chimichurri Extra (+R$ 3,00)', 300, 1),
    (v_prod_queijo, 'Melaço de Cana Extra (+R$ 2,50)', 250, 1),
    (v_prod_frita_bacon, 'Bacon Extra (+R$ 6,00)', 600, 1)
    ON CONFLICT DO NOTHING;

    -- 5. Restaurant Tables (Mesas 1 a 10)
    INSERT INTO public.restaurant_tables (establishment_id, table_number, label, capacity, qr_token, status) VALUES
    (v_est_id, 1, 'Mesa 01', 4, '11111111-0000-0000-0000-000000000001', 'livre'),
    (v_est_id, 2, 'Mesa 02', 4, '22222222-0000-0000-0000-000000000002', 'livre'),
    (v_est_id, 3, 'Mesa 03', 6, '33333333-0000-0000-0000-000000000003', 'livre'),
    (v_est_id, 4, 'Mesa 04', 6, '44444444-0000-0000-0000-000000000004', 'livre'),
    (v_est_id, 5, 'Mesa 05', 2, '55555555-0000-0000-0000-000000000005', 'livre'),
    (v_est_id, 6, 'Mesa 06', 2, '66666666-0000-0000-0000-000000000006', 'livre'),
    (v_est_id, 7, 'Mesa 07', 8, '77777777-0000-0000-0000-000000000007', 'livre'),
    (v_est_id, 8, 'Mesa 08', 8, '88888888-0000-0000-0000-000000000008', 'livre'),
    (v_est_id, 9, 'Mesa 09 (Varanda)', 4, '99999999-0000-0000-0000-000000000009', 'livre'),
    (v_est_id, 10, 'Mesa 10 (Varanda)', 4, 'aaaaaaaa-0000-0000-0000-000000000010', 'livre')
    ON CONFLICT (establishment_id, table_number) DO NOTHING;

END $$;
