// Framework-free port: no Nest imports. Application code injects it via the CLOCK token;
// domain code never sees it (domain functions receive `now: Date` as an argument).
export interface Clock {
  now(): Date;
}

export const CLOCK = Symbol('Clock');
