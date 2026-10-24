import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './databaseStore';

describe('DatabaseStore & Persistence', () => {
  it('should find table flexibly by qr_token, table number, or id', () => {
    // Mesa 02 has table_number 2 and qr_token 'mesa-02-token'
    const byToken = db.getTableByQrToken('mesa-02-token');
    expect(byToken).toBeDefined();
    expect(byToken?.table_number).toBe(2);

    // Should also find by string number
    const byNumber = db.getTableByQrToken('2');
    expect(byNumber).toBeDefined();
    expect(byNumber?.table_number).toBe(2);

    // Should also find with leading zero
    const byLeadingZero = db.getTableByQrToken('02');
    expect(byLeadingZero).toBeDefined();
    expect(byLeadingZero?.table_number).toBe(2);

    // Should also find by ID
    const byId = db.getTableByQrToken('t2');
    expect(byId).toBeDefined();
    expect(byId?.table_number).toBe(2);
  });

  it('should update profile PIN and persist', () => {
    const profiles = db.getProfiles();
    const admin = profiles.find((p) => p.role === 'admin');
    expect(admin).toBeDefined();

    db.saveProfile({
      id: admin!.id,
      pin_code: '4321',
    });

    const updated = db.getProfiles().find((p) => p.id === admin!.id);
    expect(updated?.pin_code).toBe('4321');
  });
});
