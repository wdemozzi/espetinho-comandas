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
 * Extracts and inspects the current hostname and parameters to determine
 * if the user is in a dedicated staff subdomain or in public customer space.
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

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Check query parameter override (?subdomain=admin or ?sub=garcom)
  const querySub = searchParams.get('subdomain') || searchParams.get('sub');

  // 2. Parse hostname subdomain
  let detectedSub: string | null = null;
  const parts = hostname.split('.');

  if (hostname.endsWith('.localhost') && parts.length >= 2) {
    // e.g. admin.localhost -> 'admin'
    detectedSub = parts[0];
  } else if (parts.length >= 3) {
    // e.g. admin.ctconveniencia.com.br or admin.espetinho-comandas.vercel.app
    detectedSub = parts[0];
  }

  const activeSub = (querySub || detectedSub || '').toLowerCase();

  // 3. Path routes fallback (e.g. /admin, /sistema, /operacao, /garcom, /cozinha, /caixa)
  const isStaffPath =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/sistema' ||
    pathname.startsWith('/sistema/') ||
    pathname === '/operacao' ||
    pathname.startsWith('/operacao/') ||
    pathname === '/painel' ||
    pathname.startsWith('/painel/') ||
    pathname === '/garcom' ||
    pathname === '/cozinha' ||
    pathname === '/caixa';

  const isStaff =
    KNOWN_STAFF_SUBDOMAINS.includes(activeSub as StaffSubdomainType) || isStaffPath;

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

  if (activeSub === 'admin' || pathname.startsWith('/admin')) {
    targetView = 'admin';
    displayName = 'Gestão & Administrativo';
    securityLabel = 'Subdomínio Administrativo Restrito';
  } else if (activeSub === 'cozinha' || pathname === '/cozinha') {
    targetView = 'cozinha';
    displayName = 'KDS Churrasqueira & Cozinha';
    securityLabel = 'Terminal de Produção KDS';
  } else if (activeSub === 'caixa' || pathname === '/caixa') {
    targetView = 'caixa';
    displayName = 'Frente de Caixa & Fechamento';
    securityLabel = 'Terminal de PDV & Caixa';
  } else if (activeSub === 'garcom' || pathname === '/garcom') {
    targetView = 'garcom';
    displayName = 'Comandas & Atendimento de Salão';
    securityLabel = 'Terminal Garçom Salão';
  } else {
    // app, gestao, operacao, sistema, painel
    targetView = 'garcom';
    displayName = 'CT Conveniência Operações';
    securityLabel = 'Subdomínio Corporativo Protegido';
  }

  return {
    isStaffSubdomain: true,
    subdomain: activeSub || (isStaffPath ? pathname.replace('/', '') : 'operacao'),
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

  const { protocol, host, port, searchParams, pathname } = new URL(window.location.href);
  const hostname = window.location.hostname.toLowerCase();

  // If query override was used on same host
  if (searchParams.has('subdomain') || searchParams.has('sub')) {
    const cleanParams = new URLSearchParams(searchParams);
    cleanParams.delete('subdomain');
    cleanParams.delete('sub');
    const qs = cleanParams.toString();
    return `${pathname}${qs ? `?${qs}` : ''}`;
  }

  // If in subdomain: e.g. admin.ctconveniencia.com.br -> ctconveniencia.com.br
  const parts = hostname.split('.');
  if (parts.length >= 3) {
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

  // If already on a subdomain or domain with at least 2 parts
  if (host.includes('.localhost')) {
    return `${protocol}//${subdomain}.localhost:${window.location.port}`;
  }

  if (parts.length >= 3) {
    // replace existing subdomain
    parts[0] = subdomain;
    return `${protocol}//${parts.join('.')}`;
  }

  // fallback to query or path
  return `/?subdomain=${subdomain}`;
}
