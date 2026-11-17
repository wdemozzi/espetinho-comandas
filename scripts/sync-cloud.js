const SUPABASE_URL = 'https://ogldhoxfbjhgvwpjocoj.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbGRob3hmYmpoZ3Z3cGpvY29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjA2MzUsImV4cCI6MjEwODQzNjYzNX0.y0SC-PYdh0pXgAkmnjWS_GaOWbCdpgkhMTFlWgqbdGs';

const CATEGORIES = [
  {
    "id": "b1",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Espetinhos na Brasa",
    "slug": "espetinhos",
    "icon": "Flame",
    "sort_order": 1,
    "default_sector": "churrasqueira",
    "is_active": true,
    "created_at": "2026-11-17T12:00:15.191Z"
  },
  {
    "id": "b-marmitaria",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Marmitaria & Almoço",
    "slug": "marmitaria",
    "icon": "Utensils",
    "sort_order": 2,
    "default_sector": "cozinha",
    "is_active": true,
    "created_at": "2026-11-17T12:00:15.195Z"
  },
  {
    "id": "b5",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Jantinhas Completas",
    "slug": "jantinhas",
    "icon": "Utensils",
    "sort_order": 3,
    "default_sector": "cozinha",
    "is_active": true,
    "created_at": "2026-11-17T12:00:15.195Z"
  },
  {
    "id": "b8",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Drinks & Copão",
    "slug": "drinks",
    "icon": "Wine",
    "sort_order": 4,
    "default_sector": "bar",
    "is_active": true,
    "created_at": "2026-11-17T12:00:15.195Z"
  },
  {
    "id": "b7",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Milk-Shake Cremoso",
    "slug": "milk-shake",
    "icon": "Sparkles",
    "sort_order": 5,
    "default_sector": "cozinha",
    "is_active": true,
    "created_at": "2026-11-17T12:00:15.195Z"
  },
  {
    "id": "b6",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Açaí & Sobremesas",
    "slug": "acai-sobremesas",
    "icon": "Sparkles",
    "sort_order": 6,
    "default_sector": "cozinha",
    "is_active": true,
    "created_at": "2026-11-17T12:00:15.195Z"
  },
  {
    "id": "b2",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Acompanhamentos",
    "slug": "acompanhamentos",
    "icon": "Utensils",
    "sort_order": 7,
    "default_sector": "cozinha",
    "is_active": true,
    "created_at": "2026-11-17T12:00:15.195Z"
  },
  {
    "id": "b3",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Porções & Petiscos",
    "slug": "porcoes",
    "icon": "Soup",
    "sort_order": 8,
    "default_sector": "cozinha",
    "is_active": true,
    "created_at": "2026-11-17T12:00:15.195Z"
  },
  {
    "id": "b4",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "name": "Bebidas & Chopp",
    "slug": "bebidas",
    "icon": "Beer",
    "sort_order": 9,
    "default_sector": "bar",
    "is_active": true,
    "created_at": "2026-11-17T12:00:15.195Z"
  }
];

const PRODUCTS = [
  {
    "id": "p-1794619879777",
    "name": "Caipirinha CT - 300ML",
    "addons": [
      {
        "id": "add-1794619797055-62xx",
        "name": "Limão",
        "product_id": "",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "add-1794619833220-glt3",
        "name": "Cachaça",
        "product_id": "",
        "sort_order": 2,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "add-1794619844337-152q",
        "name": "BobPinga",
        "product_id": "",
        "sort_order": 3,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "add-1794619852972-v36p",
        "name": "Busca Brisa",
        "product_id": "",
        "sort_order": 4,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "add-1794619857874-txp1",
        "name": "Vodka",
        "product_id": "",
        "sort_order": 5,
        "price_cents": 0,
        "is_available": true
      }
    ],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-11-14T01:31:19.777Z",
    "allow_notes": true,
    "category_id": "b8",
    "description": "Caipirinha artesanal refrescante de 300ml, preparada com frutas frescas selecionadas, destilado especial e muito gelo.",
    "price_cents": 1500,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "addon_group_title": "Escolha 1 Opção",
    "addon_selection_mode": "single"
  },
  {
    "id": "p1",
    "name": "Espetinho Tradicional de Carne",
    "addons": [
      {
        "id": "a1",
        "product_id": "p1",
        "name": "Ponto: Mal passada",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 1
      },
      {
        "id": "a2",
        "product_id": "p1",
        "name": "Ponto: Ao ponto",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 2
      },
      {
        "id": "a3",
        "product_id": "p1",
        "name": "Ponto: Bem passada",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 3
      },
      {
        "id": "a4",
        "product_id": "p1",
        "name": "Molho Alho Especial (+R$ 3,00)",
        "price_cents": 300,
        "is_available": true,
        "sort_order": 4
      },
      {
        "id": "a4b",
        "product_id": "p1",
        "name": "Farofa Crocante da Casa (+R$ 2,00)",
        "price_cents": 200,
        "is_available": true,
        "sort_order": 5
      }
    ],
    "sector": "churrasqueira",
    "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b1",
    "description": "Espetinho clássico de carne bovina de primeira qualidade, temperado no sal de parrilla e assado no ponto perfeito na brasa quente.",
    "price_cents": 1000,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 96,
    "min_stock_alert": 5,
    "cost_price_cents": 1100,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p2",
    "name": "Espetinho Tradicional de Kafta",
    "addons": [
      {
        "id": "ak1",
        "product_id": "p2",
        "name": "Ponto: Ao ponto",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 1
      },
      {
        "id": "ak2",
        "product_id": "p2",
        "name": "Chimichurri Extra (+R$ 3,00)",
        "price_cents": 300,
        "is_available": true,
        "sort_order": 2
      },
      {
        "id": "ak3",
        "product_id": "p2",
        "name": "Molho Alho Especial (+R$ 3,00)",
        "price_cents": 300,
        "is_available": true,
        "sort_order": 3
      }
    ],
    "sector": "churrasqueira",
    "image_url": "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b1",
    "description": "Kafta artesanal de carne bovina selecionada, temperada com hortelã fresca e especiarias árabes, assada suculenta na brasa.",
    "price_cents": 800,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 98,
    "min_stock_alert": 5,
    "cost_price_cents": 900,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p3",
    "name": "Espetinho Tradicional de Frango",
    "addons": [
      {
        "id": "af1",
        "product_id": "p3",
        "name": "Molho Alho Especial (+R$ 3,00)",
        "price_cents": 300,
        "is_available": true,
        "sort_order": 1
      },
      {
        "id": "af2",
        "product_id": "p3",
        "name": "Farofa Temperada da Casa (+R$ 2,00)",
        "price_cents": 200,
        "is_available": true,
        "sort_order": 2
      }
    ],
    "sector": "churrasqueira",
    "image_url": "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b1",
    "description": "Cubos suculentos de peito de frango selecionado, marinados em tempero especial com ervas finas da casa e dourados na brasa.",
    "price_cents": 1000,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 100,
    "min_stock_alert": 5,
    "cost_price_cents": 600,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p4",
    "name": "Espetinho Tradicional de Coração de Frango",
    "sector": "churrasqueira",
    "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b1",
    "description": "Corações de frango tenros e suculentos, temperados no alho e ervas finas, assados no ponto ideal na brasa.",
    "price_cents": 800,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 100,
    "min_stock_alert": 5,
    "cost_price_cents": 750,
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "addons": [
      {
        "id": "ac1",
        "product_id": "p4",
        "name": "Farofa Crocante da Casa (+R$ 2,00)",
        "price_cents": 200,
        "is_available": true,
        "sort_order": 1
      },
      {
        "id": "ac2",
        "product_id": "p4",
        "name": "Molho Alho Especial (+R$ 3,00)",
        "price_cents": 300,
        "is_available": true,
        "sort_order": 2
      }
    ]
  },
  {
    "id": "p5",
    "name": "Kafta Recheada com Queijo",
    "sector": "churrasqueira",
    "image_url": "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b1",
    "description": "Kafta artesanal temperada com hortelã fresca e especiarias, recheada com queijo muçarela derretendo a cada mordida.",
    "price_cents": 1700,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 37,
    "min_stock_alert": 10,
    "cost_price_cents": 800,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p6",
    "name": "Espetinho Tradicional de Queijo Coalho",
    "sector": "churrasqueira",
    "image_url": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b1",
    "description": "Espeto de queijo coalho autêntico, tostadinho e crocante por fora, macio e derretendo por dentro na brasa.",
    "price_cents": 800,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 100,
    "min_stock_alert": 5,
    "cost_price_cents": 450,
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "addons": [
      {
        "id": "aq1",
        "product_id": "p6",
        "name": "Melaço de Cana Extra (+R$ 2,50)",
        "price_cents": 250,
        "is_available": true,
        "sort_order": 1
      },
      {
        "id": "aq2",
        "product_id": "p6",
        "name": "Orégano Salpicado",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 2
      }
    ]
  },
  {
    "id": "p7",
    "name": "Antarctica Original  - Garrafa 600ML",
    "addons": [],
    "sector": "bar",
    "image_url": "https://images.unsplash.com/photo-1608270546103-9c4c7cc35930?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Pilsen tradicional Antarctica Original garrafa 600ml, puro sabor servida trincando de gelada no balde de gelo.",
    "price_cents": 1200,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 39,
    "min_stock_alert": 10,
    "cost_price_cents": 950,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p8",
    "name": "Antarctica BOA - Garrafa 600ML",
    "addons": [],
    "sector": "bar",
    "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Antarctica Pilsen (BOA) garrafa 600ml estupidamente gelada, ideal para acompanhar seu espetinho.",
    "price_cents": 1000,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 41,
    "min_stock_alert": 10,
    "cost_price_cents": 350,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p9",
    "name": "Arroz",
    "addons": [],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b2",
    "description": "Porção individual de arroz branco soltinho, cozido na hora com alho e tempero caseiro.",
    "price_cents": 300,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 500,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p10",
    "name": "Batata Rústica com Cheddar e Bacon",
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-24T19:45:21.903Z",
    "allow_notes": true,
    "category_id": "b3",
    "description": "Batata rústica crocante por fora e macia por dentro com páprica doce, coberta com cheddar cremoso e cubos de bacon frito.",
    "price_cents": 3800,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 1600,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p11",
    "name": "Jantinha Tradicional Completa",
    "addons": [
      {
        "id": "aj1",
        "name": "Espeto: Picanha Nobre (+R$ 3,00)",
        "product_id": "p11",
        "sort_order": 1,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "aj2",
        "name": "Espeto: Alcatra Macia",
        "product_id": "p11",
        "sort_order": 2,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "aj3",
        "name": "Espeto: Frango com Bacon",
        "product_id": "p11",
        "sort_order": 3,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "aj4",
        "name": "Espeto: Linguiça na Brasa",
        "product_id": "p11",
        "sort_order": 4,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "aj5",
        "name": "Espeto: Kafta Artesanal",
        "product_id": "p11",
        "sort_order": 5,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "aj6",
        "name": "Espeto: Queijo Coalho",
        "product_id": "p11",
        "sort_order": 6,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "aj7",
        "name": "Espeto Adicional (+R$ 10,00)",
        "product_id": "p11",
        "sort_order": 7,
        "price_cents": 1000,
        "is_available": true
      },
      {
        "id": "aj8",
        "name": "Mandioca Extra (+R$ 5,00)",
        "product_id": "p11",
        "sort_order": 8,
        "price_cents": 500,
        "is_available": true
      },
      {
        "id": "aj9",
        "name": "Vinagrete Extra (+R$ 4,00)",
        "product_id": "p11",
        "sort_order": 9,
        "price_cents": 400,
        "is_available": true
      },
      {
        "id": "aj10",
        "name": "Feijão Tropeiro Extra (+R$ 6,00)",
        "product_id": "p11",
        "sort_order": 10,
        "price_cents": 600,
        "is_available": true
      }
    ],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b5",
    "description": "Arroz branco soltinho, feijão tropeiro temperado da casa, mandioca cozida amanteigada derretendo, vinagrete fresco e 1 espetinho na brasa à sua escolha.",
    "price_cents": 2500,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 1100,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p12",
    "name": "Jantinha Dupla Especial (2 Espetos)",
    "addons": [
      {
        "id": "ajd1",
        "name": "1º Espeto: Picanha (+R$ 3,00)",
        "product_id": "p12",
        "sort_order": 1,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ajd2",
        "name": "1º Espeto: Alcatra Macia",
        "product_id": "p12",
        "sort_order": 2,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ajd3",
        "name": "1º Espeto: Frango com Bacon",
        "product_id": "p12",
        "sort_order": 3,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ajd4",
        "name": "2º Espeto: Queijo Coalho",
        "product_id": "p12",
        "sort_order": 4,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ajd5",
        "name": "2º Espeto: Linguiça na Brasa",
        "product_id": "p12",
        "sort_order": 5,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ajd6",
        "name": "2º Espeto: Kafta Artesanal",
        "product_id": "p12",
        "sort_order": 6,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ajd7",
        "name": "Mandioca Extra (+R$ 5,00)",
        "product_id": "p12",
        "sort_order": 7,
        "price_cents": 500,
        "is_available": true
      }
    ],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b5",
    "description": "Servida para quem tem fome de verdade: arroz branco soltinho, feijão tropeiro artesanal, mandioca na manteiga, vinagrete especial e 2 espetinhos à sua escolha.",
    "price_cents": 3400,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 35,
    "min_stock_alert": 8,
    "cost_price_cents": 1600,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p13",
    "name": "Açaí no Copo 300ml",
    "addons": [
      {
        "id": "ac1",
        "name": "Leite Condensado (+R$ 2,50)",
        "product_id": "p13",
        "sort_order": 1,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "ac2",
        "name": "Leite Ninho em Pó (+R$ 3,00)",
        "product_id": "p13",
        "sort_order": 2,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ac3",
        "name": "Morango Fresco Picado (+R$ 4,00)",
        "product_id": "p13",
        "sort_order": 3,
        "price_cents": 400,
        "is_available": true
      },
      {
        "id": "ac4",
        "name": "Banana Fatiada (+R$ 2,50)",
        "product_id": "p13",
        "sort_order": 4,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "ac5",
        "name": "Granola Crocante (+R$ 2,00)",
        "product_id": "p13",
        "sort_order": 5,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "ac6",
        "name": "Paçoca de Amendoim (+R$ 2,00)",
        "product_id": "p13",
        "sort_order": 6,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "ac7",
        "name": "Nutella Pura (+R$ 5,00)",
        "product_id": "p13",
        "sort_order": 7,
        "price_cents": 500,
        "is_available": true
      },
      {
        "id": "ac8",
        "name": "Confetes de Chocolate (+R$ 2,50)",
        "product_id": "p13",
        "sort_order": 8,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "ac9",
        "name": "Mel Puro (+R$ 3,00)",
        "product_id": "p13",
        "sort_order": 9,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ac10",
        "name": "Calda de Morango (+R$ 2,00)",
        "product_id": "p13",
        "sort_order": 10,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "ac11",
        "name": "Calda de Chocolate (+R$ 2,00)",
        "product_id": "p13",
        "sort_order": 11,
        "price_cents": 200,
        "is_available": true
      }
    ],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b6",
    "description": "Açaí cremoso especial batido no ponto ideal. Escolha seus complementos favoritos com preço individual de cada um!",
    "price_cents": 1400,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 50,
    "min_stock_alert": 10,
    "cost_price_cents": 550,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p14",
    "name": "Açaí no Copo 500ml",
    "addons": [
      {
        "id": "acb1",
        "name": "Leite Condensado (+R$ 2,50)",
        "product_id": "p14",
        "sort_order": 1,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "acb2",
        "name": "Leite Ninho em Pó (+R$ 3,00)",
        "product_id": "p14",
        "sort_order": 2,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "acb3",
        "name": "Morango Fresco Picado (+R$ 4,00)",
        "product_id": "p14",
        "sort_order": 3,
        "price_cents": 400,
        "is_available": true
      },
      {
        "id": "acb4",
        "name": "Banana Fatiada (+R$ 2,50)",
        "product_id": "p14",
        "sort_order": 4,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "acb5",
        "name": "Granola Crocante (+R$ 2,00)",
        "product_id": "p14",
        "sort_order": 5,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "acb6",
        "name": "Paçoca de Amendoim (+R$ 2,00)",
        "product_id": "p14",
        "sort_order": 6,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "acb7",
        "name": "Nutella Pura (+R$ 5,00)",
        "product_id": "p14",
        "sort_order": 7,
        "price_cents": 500,
        "is_available": true
      },
      {
        "id": "acb8",
        "name": "Confetes de Chocolate (+R$ 2,50)",
        "product_id": "p14",
        "sort_order": 8,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "acb9",
        "name": "Mel Puro (+R$ 3,00)",
        "product_id": "p14",
        "sort_order": 9,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "acb10",
        "name": "Calda de Morango (+R$ 2,00)",
        "product_id": "p14",
        "sort_order": 10,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "acb11",
        "name": "Calda de Chocolate (+R$ 2,00)",
        "product_id": "p14",
        "sort_order": 11,
        "price_cents": 200,
        "is_available": true
      }
    ],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b6",
    "description": "Copo generoso de 500ml de puro açaí super cremoso e refrescante. Monte do seu jeito com complementos selecionados!",
    "price_cents": 2000,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 45,
    "min_stock_alert": 10,
    "cost_price_cents": 800,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p15",
    "name": "Açaí Mega na Tigela / Copo 700ml",
    "addons": [
      {
        "id": "acc1",
        "name": "Leite Condensado (+R$ 2,50)",
        "product_id": "p15",
        "sort_order": 1,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "acc2",
        "name": "Leite Ninho em Pó (+R$ 3,00)",
        "product_id": "p15",
        "sort_order": 2,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "acc3",
        "name": "Morango Fresco Picado (+R$ 4,00)",
        "product_id": "p15",
        "sort_order": 3,
        "price_cents": 400,
        "is_available": true
      },
      {
        "id": "acc4",
        "name": "Banana Fatiada (+R$ 2,50)",
        "product_id": "p15",
        "sort_order": 4,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "acc5",
        "name": "Granola Crocante (+R$ 2,00)",
        "product_id": "p15",
        "sort_order": 5,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "acc6",
        "name": "Paçoca de Amendoim (+R$ 2,00)",
        "product_id": "p15",
        "sort_order": 6,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "acc7",
        "name": "Nutella Pura (+R$ 5,00)",
        "product_id": "p15",
        "sort_order": 7,
        "price_cents": 500,
        "is_available": true
      },
      {
        "id": "acc8",
        "name": "Confetes de Chocolate (+R$ 2,50)",
        "product_id": "p15",
        "sort_order": 8,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "acc9",
        "name": "Mel Puro (+R$ 3,00)",
        "product_id": "p15",
        "sort_order": 9,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "acc10",
        "name": "Calda de Morango (+R$ 2,00)",
        "product_id": "p15",
        "sort_order": 10,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "acc11",
        "name": "Calda de Chocolate (+R$ 2,00)",
        "product_id": "p15",
        "sort_order": 11,
        "price_cents": 200,
        "is_available": true
      }
    ],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b6",
    "description": "O gigante de 700ml para dividir ou se fartar! Açaí espesso de alta qualidade com complementos e caldas que você escolher.",
    "price_cents": 2600,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 31,
    "min_stock_alert": 8,
    "cost_price_cents": 1100,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793455475660",
    "name": "Mandioca",
    "addons": [],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-31T14:04:35.660Z",
    "allow_notes": true,
    "category_id": "b2",
    "description": "Porção de mandioca amarela cozida desmanchando na boca, regada com manteiga de garrafa e cheiro verde fresco.",
    "price_cents": 500,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 39,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793455492739",
    "name": "Vinagrete",
    "addons": [],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-10-31T14:04:52.739Z",
    "allow_notes": true,
    "category_id": "b2",
    "description": "Vinagrete tradicional da casa com tomates frescos picadinhos, cebola, cheiro verde e azeite no ponto ideal.",
    "price_cents": 500,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 39,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793455879454",
    "name": "Brahma - Garrafa 600ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:11:19.454Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Brahma Chopp garrafa 600ml clássica, servida trincando de gelada no balde de gelo.",
    "price_cents": 1200,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793455946070",
    "name": "Antarctica -  Garrafinha 300ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:12:26.070Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Antarctica garrafinha 300ml (romarinho) estupidamente gelada.",
    "price_cents": 350,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 38,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456003855",
    "name": "Brahma - Lata 350ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:13:23.855Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Brahma Chopp lata 350ml gelada.",
    "price_cents": 599,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456040468",
    "name": "Heineken - Lata 269ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:14:00.468Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Heineken Premium Puro Malte sleek lata 269ml trincando de gelada.",
    "price_cents": 799,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456058976",
    "name": "Skol - Lata 350ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:14:18.976Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Skol Pilsen lata 350ml bem gelada.",
    "price_cents": 500,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456082166",
    "name": "Budweiser - Long Neck",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:14:42.166Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Budweiser American Lager long neck 330ml gelada.",
    "price_cents": 800,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456167706",
    "name": "Itaipava - Lata 350ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:16:07.706Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Itaipava 100% Malte lata 350ml bem gelada.",
    "price_cents": 399,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456271212",
    "name": "Coca-Cola - Lata 350ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:17:51.212Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Refrigerante Coca-Cola original lata 350ml trincando de gelada, servida com copo de gelo e limão.",
    "price_cents": 550,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 38,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456299777",
    "name": "Monster - Lata 473ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:18:19.777Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Energético Monster Energy original lata 473ml bem gelado.",
    "price_cents": 1600,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456366174",
    "name": "Coca-Cola - Garrafa 2,5L",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:19:26.174Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Refrigerante Coca-Cola original tamanho família garrafa 2,5L estupidamente gelada.",
    "price_cents": 1600,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456398146",
    "name": "Fanta Laranja - Garrafa 2L",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:19:58.146Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Refrigerante Fanta Laranja garrafa 2L bem gelada.",
    "price_cents": 1200,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456419279",
    "name": "Sukita - Garrafa 2L",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:20:19.280Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Refrigerante Sukita Laranja garrafa 2L bem gelada.",
    "price_cents": 1000,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456448571",
    "name": "Chopp de Vinho - Lata 500ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:20:48.571Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Chopp de Vinho especial gelado em lata de 500ml, doce e refrescante.",
    "price_cents": 1500,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456505270",
    "name": "Água sem Gás - Garrafa 500ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:21:45.270Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Água mineral natural sem gás garrafinha 500ml gelada.",
    "price_cents": 200,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1793456522886",
    "name": "Água com Gás - Garrafa 500ML",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-10-31T14:22:02.886Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Água mineral natural com gás garrafinha 500ml gelada servida com rodela de limão.",
    "price_cents": 350,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p16",
    "name": "Milk-Shake no Copo 300ml",
    "addons": [
      {
        "id": "ms301",
        "name": "Sabor: Morango",
        "product_id": "p16",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms302",
        "name": "Sabor: Maracujá",
        "product_id": "p16",
        "sort_order": 2,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms303",
        "name": "Sabor: Chocolate",
        "product_id": "p16",
        "sort_order": 3,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms304",
        "name": "Sabor: Mocka",
        "product_id": "p16",
        "sort_order": 4,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms305",
        "name": "Sabor: Delícia de Abacaxi",
        "product_id": "p16",
        "sort_order": 5,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms306",
        "name": "Sabor: Torta de Limão",
        "product_id": "p16",
        "sort_order": 6,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms307",
        "name": "Sabor: Napolitano",
        "product_id": "p16",
        "sort_order": 7,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms308",
        "name": "Sabor: Banoffee",
        "product_id": "p16",
        "sort_order": 8,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms309",
        "name": "Chantilly Artesanal (+R$ 3,00)",
        "product_id": "p16",
        "sort_order": 9,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ms310",
        "name": "Nutella Pura (+R$ 4,00)",
        "product_id": "p16",
        "sort_order": 10,
        "price_cents": 400,
        "is_available": true
      },
      {
        "id": "ms311",
        "name": "Ovomaltine Crocante (+R$ 3,50)",
        "product_id": "p16",
        "sort_order": 11,
        "price_cents": 350,
        "is_available": true
      },
      {
        "id": "ms312",
        "name": "Leite Ninho Extra (+R$ 3,00)",
        "product_id": "p16",
        "sort_order": 12,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ms313",
        "name": "Calda de Chocolate Extra (+R$ 2,50)",
        "product_id": "p16",
        "sort_order": 13,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "ms314",
        "name": "Calda de Morango Extra (+R$ 2,50)",
        "product_id": "p16",
        "sort_order": 14,
        "price_cents": 250,
        "is_available": true
      }
    ],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b7",
    "description": "Milk-shake cremoso irresistível batido na hora com sorvete nobre. Escolha seu sabor favorito e adicione opcionais!",
    "price_cents": 1600,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 59,
    "min_stock_alert": 12,
    "cost_price_cents": 600,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p17",
    "name": "Milk-Shake no Copo 500ml",
    "addons": [
      {
        "id": "ms501",
        "name": "Sabor: Morango",
        "product_id": "p17",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms502",
        "name": "Sabor: Maracujá",
        "product_id": "p17",
        "sort_order": 2,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms503",
        "name": "Sabor: Chocolate",
        "product_id": "p17",
        "sort_order": 3,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms504",
        "name": "Sabor: Mocka",
        "product_id": "p17",
        "sort_order": 4,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms505",
        "name": "Sabor: Delícia de Abacaxi",
        "product_id": "p17",
        "sort_order": 5,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms506",
        "name": "Sabor: Torta de Limão",
        "product_id": "p17",
        "sort_order": 6,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms507",
        "name": "Sabor: Napolitano",
        "product_id": "p17",
        "sort_order": 7,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms508",
        "name": "Sabor: Banoffee",
        "product_id": "p17",
        "sort_order": 8,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms509",
        "name": "Chantilly Artesanal (+R$ 3,00)",
        "product_id": "p17",
        "sort_order": 9,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ms510",
        "name": "Nutella Pura (+R$ 4,00)",
        "product_id": "p17",
        "sort_order": 10,
        "price_cents": 400,
        "is_available": true
      },
      {
        "id": "ms511",
        "name": "Ovomaltine Crocante (+R$ 3,50)",
        "product_id": "p17",
        "sort_order": 11,
        "price_cents": 350,
        "is_available": true
      },
      {
        "id": "ms512",
        "name": "Leite Ninho Extra (+R$ 3,00)",
        "product_id": "p17",
        "sort_order": 12,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ms513",
        "name": "Calda de Chocolate Extra (+R$ 2,50)",
        "product_id": "p17",
        "sort_order": 13,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "ms514",
        "name": "Calda de Morango Extra (+R$ 2,50)",
        "product_id": "p17",
        "sort_order": 14,
        "price_cents": 250,
        "is_available": true
      }
    ],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b7",
    "description": "O clássico no tamanho ideal! Muito mais cremosidade e sabor para você se deliciar. Escolha seu sabor favorito!",
    "price_cents": 2200,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 50,
    "min_stock_alert": 10,
    "cost_price_cents": 850,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p18",
    "name": "Milk-Shake Gigante no Copo 700ml",
    "addons": [
      {
        "id": "ms701",
        "name": "Sabor: Morango",
        "product_id": "p18",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms702",
        "name": "Sabor: Maracujá",
        "product_id": "p18",
        "sort_order": 2,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms703",
        "name": "Sabor: Chocolate",
        "product_id": "p18",
        "sort_order": 3,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms704",
        "name": "Sabor: Mocka",
        "product_id": "p18",
        "sort_order": 4,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms705",
        "name": "Sabor: Delícia de Abacaxi",
        "product_id": "p18",
        "sort_order": 5,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms706",
        "name": "Sabor: Torta de Limão",
        "product_id": "p18",
        "sort_order": 6,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms707",
        "name": "Sabor: Napolitano",
        "product_id": "p18",
        "sort_order": 7,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms708",
        "name": "Sabor: Banoffee",
        "product_id": "p18",
        "sort_order": 8,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ms709",
        "name": "Chantilly Artesanal (+R$ 3,00)",
        "product_id": "p18",
        "sort_order": 9,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ms710",
        "name": "Nutella Pura (+R$ 4,00)",
        "product_id": "p18",
        "sort_order": 10,
        "price_cents": 400,
        "is_available": true
      },
      {
        "id": "ms711",
        "name": "Ovomaltine Crocante (+R$ 3,50)",
        "product_id": "p18",
        "sort_order": 11,
        "price_cents": 350,
        "is_available": true
      },
      {
        "id": "ms712",
        "name": "Leite Ninho Extra (+R$ 3,00)",
        "product_id": "p18",
        "sort_order": 12,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ms713",
        "name": "Calda de Chocolate Extra (+R$ 2,50)",
        "product_id": "p18",
        "sort_order": 13,
        "price_cents": 250,
        "is_available": true
      },
      {
        "id": "ms714",
        "name": "Calda de Morango Extra (+R$ 2,50)",
        "product_id": "p18",
        "sort_order": 14,
        "price_cents": 250,
        "is_available": true
      }
    ],
    "sector": "cozinha",
    "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b7",
    "description": "Para quem ama de verdade! Copo gigante de 700ml super encorpado com ingredientes nobres.",
    "price_cents": 2800,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 8,
    "cost_price_cents": 1100,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p19",
    "name": "Copão com Energético 300ml",
    "addons": [
      {
        "id": "cp301",
        "name": "Destilado: Vodka Nacional",
        "product_id": "p19",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cp302",
        "name": "Destilado: Whisky Cavalo Branco (+R$ 5,00)",
        "product_id": "p19",
        "sort_order": 2,
        "price_cents": 500,
        "is_available": true
      },
      {
        "id": "cp303",
        "name": "Borda com Roseta de Limão e Sal (+R$ 3,00)",
        "product_id": "p19",
        "sort_order": 3,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "cp304",
        "name": "Gelo de Coco Especial (+R$ 3,00)",
        "product_id": "p19",
        "sort_order": 4,
        "price_cents": 300,
        "is_available": true
      }
    ],
    "sector": "bar",
    "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b8",
    "description": "Copão de 300ml com muito gelo, energético trincando e destilado à sua escolha (Whisky ou Vodka). Adicione roseta de limão para a experiência perfeita!",
    "price_cents": 1000,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 60,
    "min_stock_alert": 10,
    "cost_price_cents": 400,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p20",
    "name": "Copão com Energético 500ml",
    "addons": [
      {
        "id": "cp501",
        "name": "Destilado: Vodka Nacional",
        "product_id": "p20",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cp502",
        "name": "Destilado: Whisky Cavalo Branco (+R$ 10,00)",
        "product_id": "p20",
        "sort_order": 2,
        "price_cents": 1000,
        "is_available": true
      },
      {
        "id": "cp503",
        "name": "Borda com Roseta de Limão e Sal (+R$ 3,00)",
        "product_id": "p20",
        "sort_order": 3,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "cp504",
        "name": "Gelo de Coco Especial (+R$ 3,00)",
        "product_id": "p20",
        "sort_order": 4,
        "price_cents": 300,
        "is_available": true
      }
    ],
    "sector": "bar",
    "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b8",
    "description": "O tamanho mais pedido da casa! Copão de 500ml bem servido com gelo, energético gelado e destilado (Whisky Cavalo Branco ou Vodka).",
    "price_cents": 1500,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 59,
    "min_stock_alert": 10,
    "cost_price_cents": 650,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p21",
    "name": "Copão com Energético Gigante 700ml",
    "addons": [
      {
        "id": "cp701",
        "name": "Destilado: Vodka Nacional",
        "product_id": "p21",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cp702",
        "name": "Destilado: Whisky Cavalo Branco (+R$ 20,00)",
        "product_id": "p21",
        "sort_order": 2,
        "price_cents": 2000,
        "is_available": true
      },
      {
        "id": "cp703",
        "name": "Borda com Roseta de Limão e Sal (+R$ 3,00)",
        "product_id": "p21",
        "sort_order": 3,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "cp704",
        "name": "Gelo de Coco Especial (+R$ 3,00)",
        "product_id": "p21",
        "sort_order": 4,
        "price_cents": 300,
        "is_available": true
      }
    ],
    "sector": "bar",
    "image_url": "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b8",
    "description": "Para curtir a noite toda! Copão gigante de 700ml com dose dupla, muito energético trincando e gelo.",
    "price_cents": 2000,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 50,
    "min_stock_alert": 10,
    "cost_price_cents": 900,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p22",
    "name": "Milkshake Alcoólico Especial",
    "addons": [
      {
        "id": "ma1",
        "name": "Bebida: Vodka Especial",
        "product_id": "p22",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ma2",
        "name": "Bebida: Licor Amarula (+R$ 3,00)",
        "product_id": "p22",
        "sort_order": 2,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ma3",
        "name": "Bebida: Whisky Cavalo Branco (+R$ 4,00)",
        "product_id": "p22",
        "sort_order": 3,
        "price_cents": 400,
        "is_available": true
      },
      {
        "id": "ma4",
        "name": "Bebida: Licor de Chocolate (+R$ 2,00)",
        "product_id": "p22",
        "sort_order": 4,
        "price_cents": 200,
        "is_available": true
      },
      {
        "id": "ma5",
        "name": "Sabor: Morango",
        "product_id": "p22",
        "sort_order": 5,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ma6",
        "name": "Sabor: Chocolate Nobre",
        "product_id": "p22",
        "sort_order": 6,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ma7",
        "name": "Sabor: Maracujá Tropical",
        "product_id": "p22",
        "sort_order": 7,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ma8",
        "name": "Sabor: Mocka Café Especial",
        "product_id": "p22",
        "sort_order": 8,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ma9",
        "name": "Sabor: Banoffee",
        "product_id": "p22",
        "sort_order": 9,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "ma10",
        "name": "Chantilly Artesanal (+R$ 3,00)",
        "product_id": "p22",
        "sort_order": 10,
        "price_cents": 300,
        "is_available": true
      },
      {
        "id": "ma11",
        "name": "Nutella Pura (+R$ 4,00)",
        "product_id": "p22",
        "sort_order": 11,
        "price_cents": 400,
        "is_available": true
      },
      {
        "id": "ma12",
        "name": "Ovomaltine Crocante (+R$ 3,50)",
        "product_id": "p22",
        "sort_order": 12,
        "price_cents": 350,
        "is_available": true
      }
    ],
    "sector": "bar",
    "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b8",
    "description": "O famoso Milkshake Alcoólico da Costa Teixeira! Combinação irresistível de sorvete cremoso batido na hora com dose de destilado/licor e coberturas nobres. Consulte sabores e temos!",
    "price_cents": 2500,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 45,
    "min_stock_alert": 8,
    "cost_price_cents": 1000,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p23",
    "name": "Roseta Tradicional no Copo",
    "sector": "bar",
    "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-01T23:23:18.174Z",
    "allow_notes": true,
    "category_id": "b8",
    "description": "Preparo clássico no copo com rodelas de limão espremido, cubos de gelo e borda salpicada com sal. Acompanhamento autêntico para drinks, cervejas e destilados!",
    "price_cents": 300,
    "track_stock": false,
    "is_available": true,
    "stock_quantity": 100,
    "min_stock_alert": 0,
    "cost_price_cents": 70,
    "establishment_id": "a0000000-0000-0000-0000-000000000001"
  },
  {
    "id": "p-1794613148502",
    "name": "Skol - Lata 269ML PROMOÇÃO",
    "addons": [],
    "sector": "bar",
    "image_url": null,
    "created_at": "2026-11-13T23:39:08.502Z",
    "allow_notes": true,
    "category_id": "b4",
    "description": "Cerveja Skol Pilsen fina lata 269ml trincando de gelada em super promoção.",
    "price_cents": 250,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 10,
    "cost_price_cents": 0,
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "is_promo": true,
    "original_price_cents": 350,
    "promo_tag": "⚡ PROMOÇÃO"
  },
  {
    "id": "p24",
    "name": "Espetinho com Catupiry",
    "addons": [
      {
        "id": "cat-1",
        "name": "Kafta",
        "addon_type": "single",
        "product_id": "p24",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cat-2",
        "name": "Carne (Alcatra)",
        "addon_type": "single",
        "product_id": "p24",
        "sort_order": 2,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cat-3",
        "name": "Coração de Frango",
        "addon_type": "single",
        "product_id": "p24",
        "sort_order": 3,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cat-4",
        "name": "Frango com Bacon",
        "addon_type": "single",
        "product_id": "p24",
        "sort_order": 4,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cat-5",
        "name": "Queijo Coalho",
        "addon_type": "single",
        "product_id": "p24",
        "sort_order": 5,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cat-6",
        "name": "Picanha Nobre (+R$ 3,00)",
        "addon_type": "single",
        "product_id": "p24",
        "sort_order": 6,
        "price_cents": 300,
        "is_available": true
      }
    ],
    "sector": "churrasqueira",
    "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-14T00:10:23.454Z",
    "allow_notes": true,
    "category_id": "b1",
    "description": "Espetinho nobre na brasa com generosa cobertura de Catupiry original maçaricado. Escolha 1 espeto incluso no valor de R$ 15,00!",
    "price_cents": 1500,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 40,
    "min_stock_alert": 5,
    "cost_price_cents": 550,
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "addon_group_title": "Escolha o Tipo de Espeto (1 Incluso)",
    "addon_selection_mode": "single"
  },
  {
    "id": "p25",
    "name": "Caipirinha Tradicional",
    "addons": [
      {
        "id": "cai-1",
        "name": "Limão Taiti Tradicional",
        "addon_type": "single",
        "product_id": "p25",
        "sort_order": 1,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cai-2",
        "name": "Morango Fresco",
        "addon_type": "single",
        "product_id": "p25",
        "sort_order": 2,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cai-3",
        "name": "Maracujá Natural",
        "addon_type": "single",
        "product_id": "p25",
        "sort_order": 3,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cai-4",
        "name": "Abacaxi com Hortelã",
        "addon_type": "single",
        "product_id": "p25",
        "sort_order": 4,
        "price_cents": 0,
        "is_available": true
      },
      {
        "id": "cai-5",
        "name": "Kiwi Especial (+R$ 2,00)",
        "addon_type": "single",
        "product_id": "p25",
        "sort_order": 5,
        "price_cents": 200,
        "is_available": true
      }
    ],
    "sector": "bar",
    "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
    "created_at": "2026-11-14T00:10:23.455Z",
    "allow_notes": true,
    "category_id": "b8",
    "description": "Caipirinha refrescante artesanal com frutas frescas selecionadas, cachaça especial e gelo. Escolha 1 sabor incluso no valor!",
    "price_cents": 1800,
    "track_stock": true,
    "is_available": true,
    "stock_quantity": 50,
    "min_stock_alert": 5,
    "cost_price_cents": 400,
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "addon_group_title": "Escolha o Sabor da Caipirinha (1 Incluso)",
    "addon_selection_mode": "single"
  },
  {
    "id": "p-marmita-p",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "category_id": "b-marmitaria",
    "name": "Marmita P",
    "description": "Sabor de casa e praticidade para o seu dia! Marmita tamanho P individual bem servida com arroz branco, feijão temperado, proteína à sua escolha e acompanhamentos frescos.",
    "image_url": "/marmitaria-combos-tamanhos.jpg",
    "price_cents": 1699,
    "cost_price_cents": 800,
    "sector": "cozinha",
    "is_available": true,
    "allow_notes": true,
    "stock_quantity": 50,
    "track_stock": false,
    "min_stock_alert": 5,
    "addon_selection_mode": "single",
    "addon_group_title": "Escolha a Opção de Proteína (1 Inclusa)",
    "created_at": "2026-11-17T12:00:15.196Z",
    "addons": [
      {
        "id": "mp-m-prot-1",
        "product_id": "p-marmita-p",
        "name": "Bife a Cavalo com Ovo Frito",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 1,
        "addon_type": "single"
      },
      {
        "id": "mp-m-prot-2",
        "product_id": "p-marmita-p",
        "name": "Filé de Frango Grelhado Suculento",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 2,
        "addon_type": "single"
      },
      {
        "id": "mp-m-prot-3",
        "product_id": "p-marmita-p",
        "name": "Carne Moída Especial Caseira",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 3,
        "addon_type": "single"
      },
      {
        "id": "mp-m-prot-4",
        "product_id": "p-marmita-p",
        "name": "Bife Bovino Acebolado",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 4,
        "addon_type": "single"
      },
      {
        "id": "mp-m-ext-1",
        "product_id": "p-marmita-p",
        "name": "Ovo Frito Extra (+R$ 3,00)",
        "price_cents": 300,
        "is_available": true,
        "sort_order": 5,
        "addon_type": "multiple"
      },
      {
        "id": "mp-m-ext-2",
        "product_id": "p-marmita-p",
        "name": "Batata Frita Crocante Extra (+R$ 5,00)",
        "price_cents": 500,
        "is_available": true,
        "sort_order": 6,
        "addon_type": "multiple"
      },
      {
        "id": "mp-m-ext-3",
        "product_id": "p-marmita-p",
        "name": "Refogado de Brócolis Extra (+R$ 4,00)",
        "price_cents": 400,
        "is_available": true,
        "sort_order": 7,
        "addon_type": "multiple"
      }
    ]
  },
  {
    "id": "p-marmita-m",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "category_id": "b-marmitaria",
    "name": "Marmita M",
    "description": "O tamanho mais pedido da casa! Marmita M generosa com comida caseira de verdade: arroz soltinho, feijão temperado, proteína à sua escolha e guarnições frescas.",
    "image_url": "/marmitaria-combos-tamanhos.jpg",
    "price_cents": 2099,
    "cost_price_cents": 950,
    "sector": "cozinha",
    "is_available": true,
    "allow_notes": true,
    "stock_quantity": 50,
    "track_stock": false,
    "min_stock_alert": 5,
    "addon_selection_mode": "single",
    "addon_group_title": "Escolha a Opção de Proteína (1 Inclusa)",
    "created_at": "2026-11-17T12:00:15.196Z",
    "addons": [
      {
        "id": "mm-m-prot-1",
        "product_id": "p-marmita-m",
        "name": "Bife a Cavalo com Ovo Frito",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 1,
        "addon_type": "single"
      },
      {
        "id": "mm-m-prot-2",
        "product_id": "p-marmita-m",
        "name": "Filé de Frango Grelhado Suculento",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 2,
        "addon_type": "single"
      },
      {
        "id": "mm-m-prot-3",
        "product_id": "p-marmita-m",
        "name": "Carne Moída Especial Caseira",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 3,
        "addon_type": "single"
      },
      {
        "id": "mm-m-prot-4",
        "product_id": "p-marmita-m",
        "name": "Bife Bovino Acebolado",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 4,
        "addon_type": "single"
      },
      {
        "id": "mm-m-ext-1",
        "product_id": "p-marmita-m",
        "name": "Ovo Frito Extra (+R$ 3,00)",
        "price_cents": 300,
        "is_available": true,
        "sort_order": 5,
        "addon_type": "multiple"
      },
      {
        "id": "mm-m-ext-2",
        "product_id": "p-marmita-m",
        "name": "Batata Frita Crocante Extra (+R$ 5,00)",
        "price_cents": 500,
        "is_available": true,
        "sort_order": 6,
        "addon_type": "multiple"
      },
      {
        "id": "mm-m-ext-3",
        "product_id": "p-marmita-m",
        "name": "Refogado de Brócolis Extra (+R$ 4,00)",
        "price_cents": 400,
        "is_available": true,
        "sort_order": 7,
        "addon_type": "multiple"
      }
    ]
  },
  {
    "id": "p-marmita-g",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "category_id": "b-marmitaria",
    "name": "Marmita G",
    "description": "Para quem tem fome de verdade! Marmita tamanho G super farta e completa, feita com carinho e ingredientes frescos: arroz, feijão, proteína selecionada e guarnições completas.",
    "image_url": "/marmitaria-combos-tamanhos.jpg",
    "price_cents": 2390,
    "cost_price_cents": 1100,
    "sector": "cozinha",
    "is_available": true,
    "allow_notes": true,
    "stock_quantity": 40,
    "track_stock": false,
    "min_stock_alert": 5,
    "addon_selection_mode": "single",
    "addon_group_title": "Escolha a Opção de Proteína (1 Inclusa)",
    "created_at": "2026-11-17T12:00:15.196Z",
    "addons": [
      {
        "id": "mg-m-prot-1",
        "product_id": "p-marmita-g",
        "name": "Bife a Cavalo com Ovo Frito",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 1,
        "addon_type": "single"
      },
      {
        "id": "mg-m-prot-2",
        "product_id": "p-marmita-g",
        "name": "Filé de Frango Grelhado Suculento",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 2,
        "addon_type": "single"
      },
      {
        "id": "mg-m-prot-3",
        "product_id": "p-marmita-g",
        "name": "Carne Moída Especial Caseira",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 3,
        "addon_type": "single"
      },
      {
        "id": "mg-m-prot-4",
        "product_id": "p-marmita-g",
        "name": "Bife Bovino Acebolado",
        "price_cents": 0,
        "is_available": true,
        "sort_order": 4,
        "addon_type": "single"
      },
      {
        "id": "mg-m-ext-1",
        "product_id": "p-marmita-g",
        "name": "Ovo Frito Extra (+R$ 3,00)",
        "price_cents": 300,
        "is_available": true,
        "sort_order": 5,
        "addon_type": "multiple"
      },
      {
        "id": "mg-m-ext-2",
        "product_id": "p-marmita-g",
        "name": "Batata Frita Crocante Extra (+R$ 5,00)",
        "price_cents": 500,
        "is_available": true,
        "sort_order": 6,
        "addon_type": "multiple"
      },
      {
        "id": "mg-m-ext-3",
        "product_id": "p-marmita-g",
        "name": "Refogado de Brócolis Extra (+R$ 4,00)",
        "price_cents": 400,
        "is_available": true,
        "sort_order": 7,
        "addon_type": "multiple"
      }
    ]
  },
  {
    "id": "p-combo-3-marmitas-m",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "category_id": "b-marmitaria",
    "name": "Combo com Três Marmitas M",
    "description": "Super economia para a família ou almoço na empresa! 3 Marmitas tamanho M completas, feitas com carinho e ingredientes selecionados (De R$ 62,97 por R$ 54,90).",
    "image_url": "/marmitaria-combos-tamanhos.jpg",
    "price_cents": 5490,
    "cost_price_cents": 2700,
    "sector": "cozinha",
    "is_available": true,
    "allow_notes": true,
    "stock_quantity": 30,
    "track_stock": false,
    "min_stock_alert": 3,
    "is_promo": true,
    "original_price_cents": 6297,
    "promo_discount_percent": 13,
    "promo_tag": "🔥 COMBO 3 MARMITAS",
    "created_at": "2026-11-17T12:00:15.196Z"
  },
  {
    "id": "p-combo-3-marmitas-p",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "category_id": "b-marmitaria",
    "name": "Combo com Três Marmitas P",
    "description": "Praticidade e economia para o seu almoço! 3 Marmitas tamanho P com o sabor inconfundível de comida de casa por apenas R$ 40,90 (De R$ 50,97 por R$ 40,90).",
    "image_url": "/marmitaria-combos-tamanhos.jpg",
    "price_cents": 4090,
    "cost_price_cents": 2200,
    "sector": "cozinha",
    "is_available": true,
    "allow_notes": true,
    "stock_quantity": 30,
    "track_stock": false,
    "min_stock_alert": 3,
    "is_promo": true,
    "original_price_cents": 5097,
    "promo_discount_percent": 20,
    "promo_tag": "🔥 COMBO 3 MARMITAS",
    "created_at": "2026-11-17T12:00:15.196Z"
  },
  {
    "id": "p-marmita-prato-do-dia",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "category_id": "b-marmitaria",
    "name": "Prato do Dia - Bife a Cavalo",
    "description": "O Prato do Dia especial da casa: Arroz branco soltinho, feijão caseiro temperado, bife a cavalo com ovo frito de gema perfeita, refogado de brócolis fresco e batata frita crocante.",
    "image_url": "/marmitaria-prato-do-dia.jpg",
    "price_cents": 2099,
    "cost_price_cents": 950,
    "sector": "cozinha",
    "is_available": true,
    "allow_notes": true,
    "stock_quantity": 40,
    "track_stock": false,
    "min_stock_alert": 5,
    "is_promo": true,
    "promo_tag": "⭐ PRATO DO DIA",
    "created_at": "2026-11-17T12:00:15.196Z",
    "addons": [
      {
        "id": "pdd-1",
        "product_id": "p-marmita-prato-do-dia",
        "name": "Ovo Frito Adicional (+R$ 3,00)",
        "price_cents": 300,
        "is_available": true,
        "sort_order": 1
      },
      {
        "id": "pdd-2",
        "product_id": "p-marmita-prato-do-dia",
        "name": "Batata Frita Extra (+R$ 5,00)",
        "price_cents": 500,
        "is_available": true,
        "sort_order": 2
      },
      {
        "id": "pdd-3",
        "product_id": "p-marmita-prato-do-dia",
        "name": "Brócolis Refogado Extra (+R$ 4,00)",
        "price_cents": 400,
        "is_available": true,
        "sort_order": 3
      }
    ]
  },
  {
    "id": "p-marmita-economica-10",
    "establishment_id": "a0000000-0000-0000-0000-000000000001",
    "category_id": "b-marmitaria",
    "name": "Marmita Econômica (A partir de R$ 10,00)",
    "description": "Marmita individual econômica com comida caseira feita com carinho: arroz branco soltinho, feijão caseiro temperado e carne do dia.",
    "image_url": "/marmitaria-prato-do-dia.jpg",
    "price_cents": 1000,
    "cost_price_cents": 500,
    "sector": "cozinha",
    "is_available": true,
    "allow_notes": true,
    "stock_quantity": 35,
    "track_stock": false,
    "min_stock_alert": 5,
    "is_promo": true,
    "promo_tag": "⚡ A PARTIR DE R$ 10",
    "created_at": "2026-11-17T12:00:15.196Z"
  }
];

const PROFILES = [
  { id: 'u1', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Carlos Gerente', role: 'admin', phone: '(44) 99999-0001', pin_code: '9999', is_active: true, created_at: new Date().toISOString() },
  { id: 'u2', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Marcos (Garçom 1)', role: 'garcom', phone: '(44) 99999-0002', pin_code: '1111', is_active: true, created_at: new Date().toISOString() },
  { id: 'u2b', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Lucas (Garçom 2)', role: 'garcom', phone: '(44) 99999-0005', pin_code: '2222', is_active: true, created_at: new Date().toISOString() },
  { id: 'u2c', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Gabriel (Garçom 3)', role: 'garcom', phone: '(44) 99999-0006', pin_code: '3333', is_active: true, created_at: new Date().toISOString() },
  { id: 'u2d', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Juliana (Garçom 4)', role: 'garcom', phone: '(44) 99999-0007', pin_code: '4444', is_active: true, created_at: new Date().toISOString() },
  { id: 'u3', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Zé da Brasa (Churrasqueiro)', role: 'cozinha', phone: '(44) 99999-0003', pin_code: '5555', is_active: true, created_at: new Date().toISOString() },
  { id: 'u4', establishment_id: 'a0000000-0000-0000-0000-000000000001', full_name: 'Ana Caixa', role: 'caixa', phone: '(44) 99999-0004', pin_code: '6666', is_active: true, created_at: new Date().toISOString() },
];

async function syncToSupabase() {
  console.log('🚀 Sincronizando catálogo completo com Supabase ct_cloud_sync...');

  const headers = {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };

  // 1. Categorias
  const catRes = await fetch(`${SUPABASE_URL}/rest/v1/ct_cloud_sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: 'categories',
      data: CATEGORIES,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!catRes.ok) throw new Error(await catRes.text());
  console.log('✅ Categorias sincronizadas.');

  // 2. Produtos
  const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/ct_cloud_sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: 'products',
      data: PRODUCTS,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!prodRes.ok) throw new Error(await prodRes.text());
  console.log('✅ Produtos sincronizados.');

  // 3. Perfis
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/ct_cloud_sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: 'profiles',
      data: PROFILES,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!profRes.ok) throw new Error(await profRes.text());
  console.log('✅ Perfis sincronizados.');

  console.log('🎉 Sincronização concluída com sucesso!');
}

syncToSupabase().catch(err => {
  console.error('❌ Falha:', err);
  process.exit(1);
});
