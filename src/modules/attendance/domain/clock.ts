export interface Clock {
  now(): Date;
  businessDate(at: Date): string;
}
