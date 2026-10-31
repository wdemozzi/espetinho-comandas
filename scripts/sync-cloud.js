const SUPABASE_URL = 'https://ogldhoxfbjhgvwpjocoj.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbGRob3hmYmpoZ3Z3cGpvY29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjA2MzUsImV4cCI6MjEwODQzNjYzNX0.y0SC-PYdh0pXgAkmnjWS_GaOWbCdpgkhMTFlWgqbdGs';

const CATEGORIES = [
  { id: 'b1', establishment_id: 'a0000000-0000-0000-0000-000000000001', name: 'Espetinhos na Brasa', slug: 'espetinhos', icon: 'Flame', sort_order: 1, default_sector: 'churrasqueira', is_active: true, created_at: new Date().toISOString() },
  { id: 'b5', establishment_id: 'a0000000-0000-0000-0000-000000000001', name: 'Jantinhas Completas', slug: 'jantinhas', icon: 'Utensils', sort_order: 2, default_sector: 'cozinha', is_active: true, created_at: new Date().toISOString() },
  { id: 'b6', establishment_id: 'a0000000-0000-0000-0000-000000000001', name: 'Açaí & Sobremesas', slug: 'acai-sobremesas', icon: 'Sparkles', sort_order: 3, default_sector: 'cozinha', is_active: true, created_at: new Date().toISOString() },
  { id: 'b2', establishment_id: 'a0000000-0000-0000-0000-000000000001', name: 'Acompanhamentos', slug: 'acompanhamentos', icon: 'Utensils', sort_order: 4, default_sector: 'cozinha', is_active: true, created_at: new Date().toISOString() },
  { id: 'b3', establishment_id: 'a0000000-0000-0000-0000-000000000001', name: 'Porções & Petiscos', slug: 'porcoes', icon: 'Soup', sort_order: 5, default_sector: 'cozinha', is_active: true, created_at: new Date().toISOString() },
  { id: 'b4', establishment_id: 'a0000000-0000-0000-0000-000000000001', name: 'Bebidas & Chopp', slug: 'bebidas', icon: 'Beer', sort_order: 6, default_sector: 'bar', is_active: true, created_at: new Date().toISOString() },
];

const NEW_PRODUCTS = [
  {
    id: 'p11',
    establishment_id: 'a0000000-0000-0000-0000-000000000001',
    category_id: 'b5',
    name: 'Jantinha Tradicional Completa',
    description: 'Arroz branco soltinho, feijão tropeiro temperado da casa, mandioca cozida amanteigada derretendo, vinagrete fresco e 1 espetinho na brasa à sua escolha.',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    price_cents: 2500,
    cost_price_cents: 1100,
    sector: 'cozinha',
    is_available: true,
    allow_notes: true,
    stock_quantity: 40,
    track_stock: true,
    min_stock_alert: 10,
    created_at: new Date().toISOString(),
    addons: [
      { id: 'aj1', product_id: 'p11', name: 'Espeto: Picanha Nobre (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 1 },
      { id: 'aj2', product_id: 'p11', name: 'Espeto: Alcatra Macia', price_cents: 0, is_available: true, sort_order: 2 },
      { id: 'aj3', product_id: 'p11', name: 'Espeto: Frango com Bacon', price_cents: 0, is_available: true, sort_order: 3 },
      { id: 'aj4', product_id: 'p11', name: 'Espeto: Linguiça na Brasa', price_cents: 0, is_available: true, sort_order: 4 },
      { id: 'aj5', product_id: 'p11', name: 'Espeto: Kafta Artesanal', price_cents: 0, is_available: true, sort_order: 5 },
      { id: 'aj6', product_id: 'p11', name: 'Espeto: Queijo Coalho', price_cents: 0, is_available: true, sort_order: 6 },
      { id: 'aj7', product_id: 'p11', name: 'Espeto Adicional (+R$ 10,00)', price_cents: 1000, is_available: true, sort_order: 7 },
      { id: 'aj8', product_id: 'p11', name: 'Mandioca Extra (+R$ 5,00)', price_cents: 500, is_available: true, sort_order: 8 },
      { id: 'aj9', product_id: 'p11', name: 'Vinagrete Extra (+R$ 4,00)', price_cents: 400, is_available: true, sort_order: 9 },
      { id: 'aj10', product_id: 'p11', name: 'Feijão Tropeiro Extra (+R$ 6,00)', price_cents: 600, is_available: true, sort_order: 10 },
    ],
  },
  {
    id: 'p12',
    establishment_id: 'a0000000-0000-0000-0000-000000000001',
    category_id: 'b5',
    name: 'Jantinha Dupla Especial (2 Espetos)',
    description: 'Servida para quem tem fome de verdade: arroz branco soltinho, feijão tropeiro artesanal, mandioca na manteiga, vinagrete especial e 2 espetinhos à sua escolha.',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    price_cents: 3400,
    cost_price_cents: 1600,
    sector: 'cozinha',
    is_available: true,
    allow_notes: true,
    stock_quantity: 35,
    track_stock: true,
    min_stock_alert: 8,
    created_at: new Date().toISOString(),
    addons: [
      { id: 'ajd1', product_id: 'p12', name: '1º Espeto: Picanha (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 1 },
      { id: 'ajd2', product_id: 'p12', name: '1º Espeto: Alcatra Macia', price_cents: 0, is_available: true, sort_order: 2 },
      { id: 'ajd3', product_id: 'p12', name: '1º Espeto: Frango com Bacon', price_cents: 0, is_available: true, sort_order: 3 },
      { id: 'ajd4', product_id: 'p12', name: '2º Espeto: Queijo Coalho', price_cents: 0, is_available: true, sort_order: 4 },
      { id: 'ajd5', product_id: 'p12', name: '2º Espeto: Linguiça na Brasa', price_cents: 0, is_available: true, sort_order: 5 },
      { id: 'ajd6', product_id: 'p12', name: '2º Espeto: Kafta Artesanal', price_cents: 0, is_available: true, sort_order: 6 },
      { id: 'ajd7', product_id: 'p12', name: 'Mandioca Extra (+R$ 5,00)', price_cents: 500, is_available: true, sort_order: 7 },
    ],
  },
  {
    id: 'p13',
    establishment_id: 'a0000000-0000-0000-0000-000000000001',
    category_id: 'b6',
    name: 'Açaí no Copo 300ml',
    description: 'Açaí cremoso especial batido no ponto ideal. Escolha seus complementos favoritos com preço individual de cada um!',
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80',
    price_cents: 1400,
    cost_price_cents: 550,
    sector: 'cozinha',
    is_available: true,
    allow_notes: true,
    stock_quantity: 50,
    track_stock: true,
    min_stock_alert: 10,
    created_at: new Date().toISOString(),
    addons: [
      { id: 'ac1', product_id: 'p13', name: 'Leite Condensado (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 1 },
      { id: 'ac2', product_id: 'p13', name: 'Leite Ninho em Pó (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 2 },
      { id: 'ac3', product_id: 'p13', name: 'Morango Fresco Picado (+R$ 4,00)', price_cents: 400, is_available: true, sort_order: 3 },
      { id: 'ac4', product_id: 'p13', name: 'Banana Fatiada (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 4 },
      { id: 'ac5', product_id: 'p13', name: 'Granola Crocante (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 5 },
      { id: 'ac6', product_id: 'p13', name: 'Paçoca de Amendoim (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 6 },
      { id: 'ac7', product_id: 'p13', name: 'Nutella Pura (+R$ 5,00)', price_cents: 500, is_available: true, sort_order: 7 },
      { id: 'ac8', product_id: 'p13', name: 'Confetes de Chocolate (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 8 },
      { id: 'ac9', product_id: 'p13', name: 'Mel Puro (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 9 },
      { id: 'ac10', product_id: 'p13', name: 'Calda de Morango (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 10 },
      { id: 'ac11', product_id: 'p13', name: 'Calda de Chocolate (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 11 },
    ],
  },
  {
    id: 'p14',
    establishment_id: 'a0000000-0000-0000-0000-000000000001',
    category_id: 'b6',
    name: 'Açaí no Copo 500ml',
    description: 'Copo generoso de 500ml de puro açaí super cremoso e refrescante. Monte do seu jeito com complementos selecionados!',
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80',
    price_cents: 2000,
    cost_price_cents: 800,
    sector: 'cozinha',
    is_available: true,
    allow_notes: true,
    stock_quantity: 45,
    track_stock: true,
    min_stock_alert: 10,
    created_at: new Date().toISOString(),
    addons: [
      { id: 'acb1', product_id: 'p14', name: 'Leite Condensado (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 1 },
      { id: 'acb2', product_id: 'p14', name: 'Leite Ninho em Pó (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 2 },
      { id: 'acb3', product_id: 'p14', name: 'Morango Fresco Picado (+R$ 4,00)', price_cents: 400, is_available: true, sort_order: 3 },
      { id: 'acb4', product_id: 'p14', name: 'Banana Fatiada (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 4 },
      { id: 'acb5', product_id: 'p14', name: 'Granola Crocante (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 5 },
      { id: 'acb6', product_id: 'p14', name: 'Paçoca de Amendoim (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 6 },
      { id: 'acb7', product_id: 'p14', name: 'Nutella Pura (+R$ 5,00)', price_cents: 500, is_available: true, sort_order: 7 },
      { id: 'acb8', product_id: 'p14', name: 'Confetes de Chocolate (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 8 },
      { id: 'acb9', product_id: 'p14', name: 'Mel Puro (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 9 },
      { id: 'acb10', product_id: 'p14', name: 'Calda de Morango (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 10 },
      { id: 'acb11', product_id: 'p14', name: 'Calda de Chocolate (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 11 },
    ],
  },
  {
    id: 'p15',
    establishment_id: 'a0000000-0000-0000-0000-000000000001',
    category_id: 'b6',
    name: 'Açaí Mega na Tigela / Copo 700ml',
    description: 'O gigante de 700ml para dividir ou se fartar! Açaí espesso de alta qualidade com complementos e caldas que você escolher.',
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80',
    price_cents: 2600,
    cost_price_cents: 1100,
    sector: 'cozinha',
    is_available: true,
    allow_notes: true,
    stock_quantity: 30,
    track_stock: true,
    min_stock_alert: 8,
    created_at: new Date().toISOString(),
    addons: [
      { id: 'acc1', product_id: 'p15', name: 'Leite Condensado (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 1 },
      { id: 'acc2', product_id: 'p15', name: 'Leite Ninho em Pó (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 2 },
      { id: 'acc3', product_id: 'p15', name: 'Morango Fresco Picado (+R$ 4,00)', price_cents: 400, is_available: true, sort_order: 3 },
      { id: 'acc4', product_id: 'p15', name: 'Banana Fatiada (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 4 },
      { id: 'acc5', product_id: 'p15', name: 'Granola Crocante (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 5 },
      { id: 'acc6', product_id: 'p15', name: 'Paçoca de Amendoim (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 6 },
      { id: 'acc7', product_id: 'p15', name: 'Nutella Pura (+R$ 5,00)', price_cents: 500, is_available: true, sort_order: 7 },
      { id: 'acc8', product_id: 'p15', name: 'Confetes de Chocolate (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 8 },
      { id: 'acc9', product_id: 'p15', name: 'Mel Puro (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 9 },
      { id: 'acc10', product_id: 'p15', name: 'Calda de Morango (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 10 },
      { id: 'acc11', product_id: 'p15', name: 'Calda de Chocolate (+R$ 2,00)', price_cents: 200, is_available: true, sort_order: 11 },
    ],
  },
];

async function syncToSupabase() {
  console.log('🚀 Iniciando sincronização no Supabase (ogldhoxfbjhgvwpjocoj)...');

  // 1. Obter produtos atuais da nuvem
  const getRes = await fetch(`${SUPABASE_URL}/rest/v1/ct_cloud_sync?id=eq.products&select=data`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  const currentCloud = await getRes.json();
  const cloudProducts = currentCloud[0]?.data || [];

  console.log(`📦 Produtos existentes na nuvem: ${cloudProducts.length}`);

  // Atualizar categorias dos produtos existentes
  const updatedExisting = cloudProducts.map((p) => {
    let catId = p.category_id || 'b1';
    let sector = p.sector || 'churrasqueira';

    if (p.name.toLowerCase().includes('heineken') || p.name.toLowerCase().includes('coca') || p.name.toLowerCase().includes('cerveja')) {
      catId = 'b4';
      sector = 'bar';
    } else if (p.name.toLowerCase().includes('mandioca') || p.name.toLowerCase().includes('arroz') || p.name.toLowerCase().includes('vinagrete')) {
      catId = 'b2';
      sector = 'cozinha';
    } else if (p.name.toLowerCase().includes('batata') || p.name.toLowerCase().includes('porção')) {
      catId = 'b3';
      sector = 'cozinha';
    } else if (p.name.toLowerCase().includes('jantinha')) {
      catId = 'b5';
      sector = 'cozinha';
    } else if (p.name.toLowerCase().includes('açaí') || p.name.toLowerCase().includes('acai')) {
      catId = 'b6';
      sector = 'cozinha';
    }

    return { ...p, category_id: catId, sector };
  });

  // Mesclar com os novos produtos (Jantinhas e Açaí com complementos)
  const existingIds = new Set(updatedExisting.map((p) => p.id));
  const mergedProducts = [...updatedExisting];

  for (const newP of NEW_PRODUCTS) {
    if (!existingIds.has(newP.id)) {
      mergedProducts.push(newP);
    } else {
      const idx = mergedProducts.findIndex((p) => p.id === newP.id);
      if (idx !== -1) mergedProducts[idx] = newP;
    }
  }

  console.log(`✅ Total de produtos a sincronizar: ${mergedProducts.length}`);

  // 2. Enviar produtos para ct_cloud_sync
  const upsertProductsRes = await fetch(`${SUPABASE_URL}/rest/v1/ct_cloud_sync`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: 'products',
      data: mergedProducts,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!upsertProductsRes.ok) {
    const errText = await upsertProductsRes.text();
    throw new Error(`Erro ao subir produtos: ${errText}`);
  }
  console.log('🎉 Produtos sincronizados com sucesso no Supabase!');

  // 3. Enviar categorias para ct_cloud_sync
  const upsertCategoriesRes = await fetch(`${SUPABASE_URL}/rest/v1/ct_cloud_sync`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: 'categories',
      data: CATEGORIES,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!upsertCategoriesRes.ok) {
    const errText = await upsertCategoriesRes.text();
    throw new Error(`Erro ao subir categorias: ${errText}`);
  }
  console.log('🎉 Categorias sincronizadas com sucesso no Supabase!');

  // 4. Enviar perfis de equipe para ct_cloud_sync
  const PROFILES = [
    { id: 'u1', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Carlos Gerente', role: 'admin', phone: '(44) 99999-0001', pin_code: '9999', is_active: true, created_at: new Date().toISOString() },
    { id: 'u2', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Marcos (Garçom 1)', role: 'garcom', phone: '(44) 99999-0002', pin_code: '1111', is_active: true, created_at: new Date().toISOString() },
    { id: 'u2b', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Lucas (Garçom 2)', role: 'garcom', phone: '(44) 99999-0005', pin_code: '2222', is_active: true, created_at: new Date().toISOString() },
    { id: 'u2c', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Gabriel (Garçom 3)', role: 'garcom', phone: '(44) 99999-0006', pin_code: '3333', is_active: true, created_at: new Date().toISOString() },
    { id: 'u2d', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Juliana (Garçom 4)', role: 'garcom', phone: '(44) 99999-0007', pin_code: '4444', is_active: true, created_at: new Date().toISOString() },
    { id: 'u3', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Zé da Brasa (Churrasqueiro)', role: 'cozinha', phone: '(44) 99999-0003', pin_code: '5555', is_active: true, created_at: new Date().toISOString() },
    { id: 'u4', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Ana Caixa', role: 'caixa', phone: '(44) 99999-0004', pin_code: '6666', is_active: true, created_at: new Date().toISOString() },
  ];

  const upsertProfilesRes = await fetch(`${SUPABASE_URL}/rest/v1/ct_cloud_sync`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: 'profiles',
      data: PROFILES,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!upsertProfilesRes.ok) {
    const errText = await upsertProfilesRes.text();
    throw new Error(`Erro ao subir perfis: ${errText}`);
  }
  console.log('🎉 Perfis de equipe sincronizados com sucesso no Supabase!');
}

syncToSupabase().catch((err) => {
  console.error('❌ Falha:', err);
  process.exit(1);
});
