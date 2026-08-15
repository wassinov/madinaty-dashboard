import { wilayas } from "../../src/data/wilayas";
import communeGeo from "../../src/data/communes.json";

export type WilayaOption = { label: string; value: string };
export type CommuneOption = { label: string; value: string };

/**
 * Une commune, dérivée du référentiel unique `src/data/communes.geojson`.
 * Le dashboard importe `src/data/communes.json` : c'est un MIROIR du geojson
 * (Turbopack n'importe pas nativement `.geojson`). Régénéré par
 * `scripts/generate_geo_refs.ps1` depuis la source unique.
 */
export type CommuneInfo = {
  /** Code officiel Wilaya sur 2 chiffres (ex: "13"). */
  wilayaCode: string;
  /** Code officiel Commune == code postal sur 5 chiffres (ex: "13001"). */
  communeCode: string;
  /** Libellé français. */
  nom: string;
  /** Libellé arabe (peut être vide / mal encodé selon la source). */
  nomAr?: string;
  /** Nom de la daira. */
  daira?: string;
  /** Latitude de la capitale de la commune. */
  lat: number;
  /** Longitude de la capitale de la commune. */
  lng: number;
};

const _byCode = new Map<string, CommuneInfo>();

for (const f of communeGeo.features) {
  const p = f.properties;
  const [lng, lat] = f.geometry.coordinates;
  // keep-first : le code postal peut être partagé par plusieurs communes
  // (source non unique). On conserve la PREMIÈRE occurrence dans l'ordre
  // source → résolution déterministe, cohérente avec nearestCommune mobile.
  if (_byCode.has(p.postal_code)) continue;
  _byCode.set(p.postal_code, {
    wilayaCode: String(p.wilaya_code).padStart(2, "0"),
    communeCode: p.postal_code,
    nom: p.name_fr,
    nomAr: p.name_ar,
    daira: p.daira,
    lat,
    lng,
  });
}

export const communes: CommuneInfo[] = [..._byCode.values()];

export function getWilayaOptions(): WilayaOption[] {
  return wilayas.map((w) => ({
    label: w.nom,
    value: w.code,
  }));
}

/**
 * Retourne la liste des communes de la wilaya indiquée.
 * La valeur de chaque option est le code postal == code commune officiel.
 */
export function getCommuneOptions(wilayaCode: string | number): CommuneOption[] {
  const normalized =
    typeof wilayaCode === "number"
      ? String(wilayaCode).padStart(2, "0")
      : wilayaCode.padStart(2, "0");

  return communes
    .filter((c) => c.wilayaCode === normalized)
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
    .map((c) => ({
      label: c.nom,
      value: c.communeCode,
    }));
}

/** Retrouve une commune par son code officiel (ex: "13001"). */
export function getCommuneByCode(
  code: string | null | undefined
): CommuneInfo | undefined {
  if (!code) return undefined;
  return _byCode.get(code) ?? undefined;
}

/**
 * Retourne la commune la plus proche du point (lat/lng) parmi les 1541
 * capitales de communes du référentiel. Sert au vrai « sig / signaler » :
 * quand un citoyen place un repère sur la carte, on déduit automatiquement
 * le code commune/wilaya pour router le signalement vers la bonne direction.
 * Approche planaire (distance en degrés) suffisante à cette échelle locale.
 */
export function getNearestCommune(
  lat: number,
  lng: number
): CommuneInfo | undefined {
  let best: CommuneInfo | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of communes) {
    const dLat = c.lat - lat;
    const dLng = c.lng - lng;
    const d2 = dLat * dLat + dLng * dLng;
    if (d2 < bestDist) {
      bestDist = d2;
      best = c;
    }
  }
  return best;
}