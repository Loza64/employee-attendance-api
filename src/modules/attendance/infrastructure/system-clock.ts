import { Clock } from '../domain/clock';

export class SystemClock implements Clock {
  private readonly formatter: Intl.DateTimeFormat;

  constructor(timeZone: string) {
    this.formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  now(): Date {
    return new Date();
  }

  businessDate(at: Date): string {
    const parts = this.formatter.formatToParts(at);
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
}
