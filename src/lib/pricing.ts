export interface Rules {
  version: number;
  accommodations: string[];
  baseSettings: Record<string, AccSettings>;
  ageGroups: AgeGroup[];
  saisons: Saison[];
  overwrite: Overwrite[];
}

export interface AccSettings {
  service?: number;
  personsInclusive: number;
  maxPersons: number;
  deposit: number;
  extraPersons: { byAge: Record<string, number> };
  extraService?: { formula: string };
}

export interface AgeGroup {
  name: string;
  taxfee: number;
  range: string;
}

export interface Saison {
  name: string;
  price: Record<string, number>;
  minStay: number;
  ranges: { from: string; to: string }[];
}

export interface Overwrite {
  from: string;
  to: string;
  minStay?: number;
  [key: string]: unknown;
}

export const SLUG_TO_CODE: Record<string, string> = {
  schmetterling: 'SL',
  eichhoernchen: 'EH',
  schwan: 'SW',
  fuchs: 'FS',
};

const RULES_URL = 'https://sas-public.awzone.de/ext-api/rules.json';
const DAY_MS = 24 * 60 * 60 * 1000;

let rulesCache: Rules | null = null;

export async function fetchRules(): Promise<Rules> {
  if (rulesCache) return rulesCache;
  const res = await fetch(RULES_URL);
  rulesCache = await res.json();
  return rulesCache!;
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getSaisonForDate(date: Date, rules: Rules): Saison | null {
  const ds = toDateString(date);
  for (const saison of rules.saisons) {
    for (const r of saison.ranges) {
      if (ds >= r.from && ds <= r.to) return saison;
    }
  }
  return null;
}

export function getNightPrice(date: Date, accCode: string, rules: Rules): number {
  const ds = toDateString(date);
  for (const ow of rules.overwrite) {
    if (ds >= ow.from && ds <= ow.to && accCode in ow) {
      return ow[accCode] as number;
    }
  }
  const saison = getSaisonForDate(date, rules);
  return saison ? (saison.price[accCode] ?? 0) : 0;
}

export function getMinStayForDate(date: Date, rules: Rules): number {
  const ds = toDateString(date);
  for (const ow of rules.overwrite) {
    if (ds >= ow.from && ds <= ow.to && ow.minStay != null) {
      return ow.minStay;
    }
  }
  const saison = getSaisonForDate(date, rules);
  return saison?.minStay ?? 2;
}

export function getServiceFee(accCode: string, totalPersons: number, rules: Rules): number {
  const s = rules.baseSettings[accCode];
  if (!s) return 0;
  if (s.extraService) {
    const expr = s.extraService.formula.replace(/\$x/g, String(totalPersons));
    return new Function(`return ${expr}`)() as number;
  }
  return s.service ?? 0;
}

export interface StayResult {
  accommodationTotal: number;
  extraPersonTotal: number;
  serviceFee: number;
  kurtaxeTotal: number;
  total: number;
  nights: number;
  avgNightPrice: number;
}

export function calculateStay(
  accCode: string,
  checkin: Date,
  checkout: Date,
  guests: { ageGroup: string; count: number }[],
  rules: Rules,
): StayResult {
  const nights = Math.round((checkout.getTime() - checkin.getTime()) / DAY_MS);
  const settings = rules.baseSettings[accCode];

  let accommodationTotal = 0;
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkin.getTime() + i * DAY_MS);
    accommodationTotal += getNightPrice(d, accCode, rules);
  }

  const totalPersons = guests.reduce((s, g) => s + g.count, 0);

  let extraPersonTotal = 0;
  if (settings) {
    const sorted = [...guests].sort((a, b) => {
      const ca = settings.extraPersons.byAge[a.ageGroup] ?? 0;
      const cb = settings.extraPersons.byAge[b.ageGroup] ?? 0;
      return cb - ca;
    });
    let includedLeft = settings.personsInclusive;
    for (const g of sorted) {
      const included = Math.min(g.count, includedLeft);
      const extra = g.count - included;
      includedLeft -= included;
      const rate = settings.extraPersons.byAge[g.ageGroup] ?? 0;
      extraPersonTotal += extra * rate * nights;
    }
  }

  const serviceFee = getServiceFee(accCode, totalPersons, rules);

  let kurtaxeTotal = 0;
  for (const g of guests) {
    const ag = rules.ageGroups.find(a => a.name === g.ageGroup);
    if (ag) kurtaxeTotal += g.count * ag.taxfee * nights;
  }

  const total = accommodationTotal + extraPersonTotal + serviceFee + kurtaxeTotal;

  return {
    accommodationTotal,
    extraPersonTotal,
    serviceFee,
    kurtaxeTotal,
    total,
    nights,
    avgNightPrice: nights > 0 ? Math.round(accommodationTotal / nights) : 0,
  };
}
