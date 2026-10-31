import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSubdomainConfig, getPublicCustomerUrl } from './subdomain';

describe('Subdomain Routing & Security Isolation', () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    (globalThis as any).window = {} as any;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  function setMockLocation(href: string) {
    const url = new URL(href);
    (globalThis as any).window = {
      location: {
        href: url.href,
        hostname: url.hostname,
        pathname: url.pathname,
        search: url.search,
        protocol: url.protocol,
        port: url.port,
        host: url.host,
      },
    };
  }

  it('identifies public root domain as customer space without staff privileges', () => {
    setMockLocation('https://espetinho-comandas.vercel.app/');
    const config = getSubdomainConfig();

    expect(config.isStaffSubdomain).toBe(false);
    expect(config.targetView).toBe('landing');
    expect(config.subdomain).toBeNull();
  });

  it('identifies admin subdomain as staff management portal', () => {
    setMockLocation('https://admin.ctconveniencia.com.br/');
    const config = getSubdomainConfig();

    expect(config.isStaffSubdomain).toBe(true);
    expect(config.subdomain).toBe('admin');
    expect(config.targetView).toBe('admin');
  });

  it('identifies app subdomain as waiter & orders portal', () => {
    setMockLocation('https://app.ctconveniencia.com.br/');
    const config = getSubdomainConfig();

    expect(config.isStaffSubdomain).toBe(true);
    expect(config.subdomain).toBe('app');
    expect(config.targetView).toBe('garcom');
  });

  it('identifies cozinha subdomain as production KDS terminal', () => {
    setMockLocation('https://cozinha.ctconveniencia.com.br/');
    const config = getSubdomainConfig();

    expect(config.isStaffSubdomain).toBe(true);
    expect(config.subdomain).toBe('cozinha');
    expect(config.targetView).toBe('cozinha');
  });

  it('identifies caixa subdomain as PDV and cashier terminal', () => {
    setMockLocation('https://caixa.ctconveniencia.com.br/');
    const config = getSubdomainConfig();

    expect(config.isStaffSubdomain).toBe(true);
    expect(config.subdomain).toBe('caixa');
    expect(config.targetView).toBe('caixa');
  });

  it('identifies path /admin on root domain as staff management view', () => {
    setMockLocation('https://espetinho-comandas.vercel.app/admin');
    const config = getSubdomainConfig();

    expect(config.isStaffSubdomain).toBe(true);
    expect(config.targetView).toBe('admin');
  });

  it('allows query param subdomain override for flexible testing in dev', () => {
    setMockLocation('http://localhost:5173/?subdomain=admin');
    const config = getSubdomainConfig();

    expect(config.isStaffSubdomain).toBe(true);
    expect(config.subdomain).toBe('admin');
    expect(config.targetView).toBe('admin');
  });

  it('computes public customer URL correctly from subdomain', () => {
    setMockLocation('https://admin.ctconveniencia.com.br/');
    const customerUrl = getPublicCustomerUrl();

    expect(customerUrl).toBe('https://ctconveniencia.com.br/');
  });

  it('computes public customer URL correctly when query override is used', () => {
    setMockLocation('http://localhost:5173/?subdomain=admin');
    const customerUrl = getPublicCustomerUrl();

    expect(customerUrl).toBe('/');
  });
});
