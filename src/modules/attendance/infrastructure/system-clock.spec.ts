import { SystemClock } from './system-clock';

describe('SystemClock.businessDate', () => {
  it('uses the configured time zone to decide the day', () => {
    const elSalvador = new SystemClock('America/El_Salvador');

    expect(elSalvador.businessDate(new Date('2026-10-27T05:59:59Z'))).toBe('2026-10-26');
    expect(elSalvador.businessDate(new Date('2026-10-27T06:00:00Z'))).toBe('2026-10-27');
  });

  it('works with UTC and other zones', () => {
    expect(new SystemClock('UTC').businessDate(new Date('2026-10-27T05:59:59Z'))).toBe('2026-10-27');
    expect(new SystemClock('Asia/Tokyo').businessDate(new Date('2026-10-26T15:30:00Z'))).toBe('2026-10-27');
  });

  it('returns the current date from now()', () => {
    const before = Date.now();
    const now = new SystemClock('UTC').now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
  });
});
