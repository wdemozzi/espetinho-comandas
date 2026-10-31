export type StaffSubdomainType =
  | 'admin'
  | 'app'
  | 'gestao'
  | 'operacao'
  | 'painel'
  | 'sistema'
  | 'garcom'
  | 'cozinha'
  | 'caixa'
  | 'pos';

export interface SubdomainConfig {
  isStaffSubdomain: boolean;
  subdomain: string | null;
  targetView: 'landing' | 'admin' | 'garcom' | 'cozinha' | 'caixa' | 'cardapio_bio';
  displayName: string;
  securityLabel: string;
}

const KNOWN_STAFF_SUBDOMAINS: StaffSubdomainType[] = [
  'admin',
  'app',
  'gestao',
  'operacao',
  'painel',
  'sistema',
  'garcom',
  'cozinha',
  'caixa',
  'pos',
];

/**
 * Extracts and inspects the current hostname, pathname, search params, and hash to determine
 * if the user is in a dedicated staff subdomain/path or in public customer space.
 */
export function getSubdomainConfig(): SubdomainConfig {
  if (typeof window === 'undefined') {
    return {
      isStaffSubdomain: false,
      subdomain: null,
      targetView: 'landing',
      displayName: 'Cardápio Público',
      securityLabel: 'Acesso Público',
    };
  }

  const hostname = (window.location.hostname || '').toLowerCase();
  // Strip trailing slashes for reliable matching
  const pathname = (window.location.pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search || '');
  const hash = (window.location.hash || '').toLowerCase().replace(/^#/, '');

  // 1. Query parameter overrides (?subdomain=admin, ?view=admin, ?admin, etc.)
  let querySub: string | null =
    searchParams.get('subdomain') ||
    searchParams.get('sub') ||
    searchParams.get('view');

  if (!querySub) {
    if (searchParams.has('admin')) querySub = 'admin';
    else if (searchParams.has('garcom')) querySub = 'garcom';
    else if (searchParams.has('cozinha')) querySub = 'cozinha';
    else if (searchParams.has('caixa')) querySub = 'caixa';
    else if (searchParams.has('operacao') || searchParams.has('sistema') || searchParams.has('app')) {
      querySub = 'operacao';
    }
  }

  // 2. Hash overrides (#admin, #garcom, #cozinha, #caixa)
  let hashSub: string | null = null;
  if (KNOWN_STAFF_SUBDOMAINS.includes(hash as StaffSubdomainType)) {
    hashSub = hash;
  }

  // 3. Subdomain extraction from hostname
  let detectedSub: string | null = null;
  const parts = hostname.split('.');

  if (hostname.endsWith('.localhost') && parts.length >= 2) {
    // e.g. admin.localhost -> 'admin'
    detectedSub = parts[0];
  } else if (hostname.endsWith('.vercel.app')) {
    // e.g. admin.espetinho-comandas.vercel.app -> 4 parts -> 'admin'
    // espetinho-comandas.vercel.app -> 3 parts -> project apex (not staff)
    if (parts.length >= 4) {
      detectedSub = parts[0];
    }
  } else if (parts.length >= 3) {
    // e.g. admin.ctconveniencia.com.br -> 'admin'
    detectedSub = parts[0];
  }

  // 4. Path routes fallback (e.g. /admin, /sistema, /operacao, /garcom, /cozinha, /caixa)
  let pathSub: string | null = null;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    pathSub = 'admin';
  } else if (pathname === '/garcom' || pathname.startsWith('/garcom/')) {
    pathSub = 'garcom';
  } else if (pathname === '/cozinha' || pathname.startsWith('/cozinha/')) {
    pathSub = 'cozinha';
  } else if (pathname === '/caixa' || pathname.startsWith('/caixa/')) {
    pathSub = 'caixa';
  } else if (
    pathname === '/operacao' ||
    pathname.startsWith('/operacao/') ||
    pathname === '/sistema' ||
    pathname.startsWith('/sistema/') ||
    pathname === '/painel' ||
    pathname.startsWith('/painel/') ||
    pathname === '/app' ||
    pathname.startsWith('/app/')
  ) {
    pathSub = 'operacao';
  }

  const activeSub = (querySub || hashSub || pathSub || detectedSub || '').toLowerCase();
  const isStaff =
    KNOWN_STAFF_SUBDOMAINS.includes(activeSub as StaffSubdomainType) || Boolean(pathSub);

  if (!isStaff) {
    return {
      isStaffSubdomain: false,
      subdomain: null,
      targetView: 'landing',
      displayName: 'Cardápio do Cliente',
      securityLabel: 'Zona Pública Segura',
    };
  }

  // Determine initial target operational view
  let targetView: SubdomainConfig['targetView'] = 'garcom';
  let displayName = 'Terminal da Equipe';
  let securityLabel = 'Subdomínio Operacional Seguro';

  if (activeSub === 'admin') {
    targetView = 'admin';
    displayName = 'Gestão & Administrativo';
    securityLabel = 'Subdomínio Administrativo Restrito';
  } else if (activeSub === 'cozinha') {
    targetView = 'cozinha';
    displayName = 'KDS Churrasqueira & Cozinha';
    securityLabel = 'Terminal de Produção KDS';
  } else if (activeSub === 'caixa') {
    targetView = 'caixa';
    displayName = 'Frente de Caixa & Fechamento';
    securityLabel = 'Terminal de PDV & Caixa';
  } else if (activeSub === 'garcom') {
    targetView = 'garcom';
    displayName = 'Comandas & Atendimento de Salão';
    securityLabel = 'Terminal Garçom Salão';
  } else {
    targetView = 'garcom';
    displayName = 'CT Conveniência Operações';
    securityLabel = 'Subdomínio Corporativo Protegido';
  }

  return {
    isStaffSubdomain: true,
    subdomain: activeSub,
    targetView,
    displayName,
    securityLabel,
  };
}

/**
 * Returns the public customer website URL for redirection if staff needs to open customer menu.
 */
export function getPublicCustomerUrl(): string {
  if (typeof window === 'undefined') return '/';

  const { protocol, port, searchParams, pathname } = new URL(window.location.href);
  const hostname = window.location.hostname.toLowerCase();

  // If query override was used on same host
  if (searchParams.has('subdomain') || searchParams.has('sub') || searchParams.has('view')) {
    const cleanParams = new URLSearchParams(searchParams);
    cleanParams.delete('subdomain');
    cleanParams.delete('sub');
    cleanParams.delete('view');
    cleanParams.delete('admin');
    cleanParams.delete('garcom');
    cleanParams.delete('cozinha');
    cleanParams.delete('caixa');
    cleanParams.delete('operacao');
    const qs = cleanParams.toString();
    return `/${qs ? `?${qs}` : ''}`;
  }

  // If on subdomain e.g. admin.ctconveniencia.com.br -> ctconveniencia.com.br
  const parts = hostname.split('.');
  if (!hostname.endsWith('.vercel.app') && parts.length >= 3) {
    const rootDomain = parts.slice(1).join('.');
    return `${protocol}//${rootDomain}${port ? `:${port}` : ''}/`;
  }

  return '/';
}

/**
 * Generates the subdomain link for a specific role/panel.
 */
export function buildSubdomainUrl(subdomain: StaffSubdomainType): string {
  if (typeof window === 'undefined') return `/${subdomain}`;

  const { protocol, host } = window.location;
  const parts = host.split('.');

  if (host.includes('.localhost')) {
    return `${protocol}//${subdomain}.localhost:${window.location.port}`;
  }

  if (!host.includes('.vercel.app') && parts.length >= 3) {
    parts[0] = subdomain;
    return `${protocol}//${parts.join('.')}`;
  }

  // For vercel.app or root domain without custom domain yet, use clean path /${subdomain}
  return `/${subdomain}`;
}
