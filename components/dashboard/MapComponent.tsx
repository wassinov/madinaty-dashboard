"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import {
  MapRef,
  Marker,
  Popup,
  Source,
  Layer,
  LayerProps,
  MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import Map from "react-map-gl/maplibre";
import { Plus, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "@teispace/next-themes";
import "maplibre-gl/dist/maplibre-gl.css";
import { Signalement } from "@/types/database";
import { wilayas } from "../../src/data/wilayas";
import { getCommuneByCode } from "@/lib/utils/geoHelpers";
import { useFilters } from "@/lib/context/FilterContext";
import { useFilteredSignalements } from "@/lib/hooks/useFilteredSignalements";
import { cn } from "@/lib/utils";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  MAP_STYLE_URL,
  MAP_STYLE_URL_DARK,
  MARKER_BG_HEX,
  DOMAIN_KEYS,
  DOMAIN_TYPES,
  DOMAIN_META,
} from "@/lib/constants";

// === Couches de limites des wilayas ===
// Couleurs issues de la charte (domaine : trait turquoise discret).
const wilayaFillLayer: LayerProps = {
  id: "wilayas-fill",
  type: "fill",
  paint: { "fill-color": "#00a3c4", "fill-opacity": 0.05 },
};
const wilayaBorderLayer: LayerProps = {
  id: "wilayas-border",
  type: "line",
  paint: { "line-color": "#008a9e", "line-width": 1, "line-opacity": 0.45 },
};

// === Mapping type -> couleur hex (charte Madinaty) ===
const TYPE_ICONS: Record<string, string> = {
  fuite: "💧",
  penurie: "🚱",
  qualite_eau: "🧪",
  assainissement: "🚽",
  dechets: "🗑️",
  eclairage_public: "💡",
};

// === Épingles teardrop (SVG OpenDesign) ===
// Chemins centrés sur (0,0), pointe en bas. Coordonnées reprises du
// `<symbol id="pin">` de la maquette : tête ronde + pointe effilée.
//
// Couleurs par DOMAINE via les tokens OKLCh (--d-*), passées par l'attribut
// `fill` (variable CSS résolue puis héritée par les chemins) ; le point
// central suit `--color-surface` (s'inverse en dark).
type PinMarkerProps = { color: string };

const PIN_LARGE_VIEWBOX = "-13 -16 26 30";

const TeardropShape = () => (
  <path d="M0 14 C 0 14 -11 4 -11 -5 A 11 11 0 1 1 11 -5 C 11 4 0 14 0 14 Z" />
);

const PinMarker = ({ color }: PinMarkerProps) => (
  <svg
    viewBox={PIN_LARGE_VIEWBOX}
    preserveAspectRatio="none"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", height: "100%" }}
    aria-hidden
  >
    <TeardropShape />
    <circle cx="0" cy="-5" r="4" fill="var(--color-surface)" />
  </svg>
);

// === Marqueur sélectionné : grande épingle + anneau pulsant accent ===
// L'anneau est un overlay CSS (cercle `border` + keyframes) : circulaire quel
// que soit le ratio bouton/SVG, insensible au RTL.
const PinMarkerSelected = ({ color }: PinMarkerProps) => (
  <span className="marker-pin-stack">
    <PinMarker color={color} />
    <span className="pulse-ring" aria-hidden />
  </span>
);

// === Couleur de l'épingle par type (couleurs de DOMAINE, tokens --d-*) ===
const TYPE_DOMAIN_COLOR: Record<string, string> = {
  fuite: "var(--d-eau)",
  penurie: "var(--d-eau)",
  qualite_eau: "var(--d-eau)",
  assainissement: "var(--d-ass)",
  dechets: "var(--d-dec)",
  eclairage_public: "var(--d-ecl)",
};

type Props = {
  signalements: Signalement[];
  onSelectSignalement?: (s: Signalement) => void;
};

// === Rendu des signalements (mode simple, sans clustering) ===
// Chaque signalement est une piñette teardrop par domaine, rendue par une
// couche `symbol` (icônes sprite injectées, voir `addDomainIcons`). Seul le
// signalement sélectionné reste un marqueur DOM (grande épingle + anneau
// pulsant) pour rester affûté / interactif.
const ICON_PREFIX = "sig-";

// Reverse lookup type -> domaine (légende chemin inverse de DOMAIN_TYPES).
const typeToDomain: Record<string, string> = {};
for (const [key, types] of Object.entries(DOMAIN_TYPES)) {
  for (const t of types) typeToDomain[t] = key;
}
const domainOfType = (t: string) => typeToDomain[t] ?? "eau";

// Icône sprite : même teardrop que PinMarkerSmall mais rasterisé sur un
// canvas offscreen (couleur du DOMAINE en hex ; point central translucide,
// neutre dark/light). Retourne un `ImageData` car maplibre-gl 4.x rejette les
// HTMLCanvasElement dans `addImage` (traités comme {width,height,data} avec
// `.data` manquant => image vide). `ImageData` possède width/height/data et
// est accepté sans risque.
const PIN_SPRITE_W = 22;
const PIN_SPRITE_H = 24;
// Résolution interne 2× pour un rendu net ; la taille affichée (CSS) reste
// pilotée par `icon-size` : css_px = (canvas / pixelRatio) × icon-size.
const PIN_SPRITE_DPR = 2;

function drawPinSprite(color: string): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = PIN_SPRITE_W * PIN_SPRITE_DPR;
  canvas.height = PIN_SPRITE_H * PIN_SPRITE_DPR;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new ImageData(canvas.width, canvas.height);
  }

  // Le tracé est défini dans la viewBox « -11 -13 … » centrée sur (0,0) avec la
  // pointe en bas (y = 11). On translate pour caler la pointe sur le bord bas.
  ctx.scale(PIN_SPRITE_DPR, PIN_SPRITE_DPR);
  ctx.translate(PIN_SPRITE_W / 2, PIN_SPRITE_H / 2);

  const path = new Path2D(
    'M0 11 C 0 11 -8.5 3 -8.5 -3.8 A 8.5 8.5 0 1 1 8.5 -3.8 C 8.5 3 0 11 0 11 Z'
  );
  ctx.fillStyle = color;
  ctx.fill(path);

  ctx.beginPath();
  ctx.arc(0, -3.8, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

const pointSymbolLayer: LayerProps = {
  id: "signalements-points",
  type: "symbol",
  layout: {
    "icon-image": ["get", "domain"],
    "icon-size": 1.5,
    "icon-anchor": "bottom",
    "icon-allow-overlap": false,
  },
};

export function MapComponent({ signalements, onSelectSignalement }: Props) {
  const t = useTranslations('map');
  const tTypes = useTranslations('types');
  const tDomains = useTranslations('domains');
  const { filters, setFilters, perimeter } = useFilters();
  const { resolvedTheme } = useTheme();
  const selectedWilaya = filters.wilayaCode
    ? wilayas.find((w) => w.code === filters.wilayaCode)
    : null;

  // La carte ne doit pas rendre le style sombre avant l'hydratation (flash).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const mapStyle =
    mounted && resolvedTheme === 'dark' ? MAP_STYLE_URL_DARK : MAP_STYLE_URL;

  const mapRef = useRef<MapRef>(null);

  const [viewState, setViewState] = useState({
    latitude: 36.7538,
    longitude: 3.0588,
    zoom: 6,
  });

  // Focus de la carte selon le périmètre de l'utilisateur :
  //   - commune verrouillée/choisie -> centre sur la CAPITALE de la commune
  //     (référentiel communes.geojson), zoom 11
  //   - sinon wilaya choisie -> centre wilaya, zoom 9
  //   - sinon (admin global) -> vue nationale, zoom 6
  const communeCode = perimeter.fixedCommuneCode ?? filters.communeCode;

  useEffect(() => {
    let lat = 36.7538;
    let lng = 3.0588;
    let zoom = 6;

    if (communeCode) {
      const commune = getCommuneByCode(communeCode);
      if (commune) {
        // Centrage sur la capitale de la commune (dynamique selon le code)
        lat = commune.lat;
        lng = commune.lng;
        zoom = 11;
      } else if (signalements.length > 0) {
        const total = signalements.length;
        lat =
          signalements.reduce((acc, s) => acc + (s.latitude ?? 0), 0) / total;
        lng =
          signalements.reduce((acc, s) => acc + (s.longitude ?? 0), 0) / total;
        zoom = 11;
      }
    } else if (selectedWilaya) {
      lat = selectedWilaya.lat;
      lng = selectedWilaya.lng;
      zoom = 9;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- focaliser le centre de la carte
    setViewState({ latitude: lat, longitude: lng, zoom });
  }, [communeCode, selectedWilaya, signalements]);

  const [popupInfo, setPopupInfo] = useState<Signalement | null>(null);

  // ==== Filtrage côté client des signalements selon le FilterContext ====
  // Logique partagée avec le tiroir liste (`useFilteredSignalements`).
  const filteredSignalements = useFilteredSignalements(signalements);

  // ==== Points avec coordonnées valides (source GeoJSON des piñettes) ====
  const markerPoints = useMemo(
    () =>
      filteredSignalements.filter(
        (s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude)
      ),
    [filteredSignalements]
  );

  // GeoJSON des points « simples » (sprite). Le signalement sélectionné est
  // retiré de la source : il est rendu en marqueur DOM par-dessus.
  const pointsGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: markerPoints
        .filter((s) => s.id !== popupInfo?.id)
        .map((s) => ({
          type: "Feature" as const,
          id: s.id,
          geometry: {
            type: "Point" as const,
            coordinates: [s.longitude, s.latitude],
          },
          properties: {
            id: s.id,
            type: s.type,
            domain: `${ICON_PREFIX}${domainOfType(s.type)}`,
          },
        })),
    }),
    [markerPoints, popupInfo]
  );

  const [iconsReady, setIconsReady] = useState(false);
  const styledataBoundRef = useRef(false);

  // Épingles sprite par domaine : rasterisées sur canvas (aucune dépendance
  // au réseau/CSP) puis injectées dans le sprite MapLibre. Idempotent via
  // `hasImage` — sûr à rappeler à chaque rechargement de style.
  const addDomainIcons = useCallback((map: MapLibreMap) => {
    for (const key of DOMAIN_KEYS) {
      const name = `${ICON_PREFIX}${key}`;
      try {
        if (!map.hasImage(name)) {
          map.addImage(
            name,
            drawPinSprite(DOMAIN_META[key].color),
            { pixelRatio: PIN_SPRITE_DPR }
          );
        }
      } catch {
        // Style non prêt ou image refusée : ignorée, le point restera invisible.
      }
    }
  }, []);

  // L'instance MapLibre est créée de façon asynchrone par react-map-gl : une
  // lecture de `mapRef.current` dans un effet de montage est toujours `null`.
  // La seule source fiable du timing est l'événement `onLoad` du composant
  // `<Map>` (déclenché une fois le style entièrement chargé). On y injecte les
  // sprites puis on re-joue via `styledata` après chaque rechargement de style
  // (toggle clair/sombre), qui vide le sprite images.
  const handleMapLoad = useCallback(
    (evt: { target: MapLibreMap }) => {
      const map = evt.target;
      if (map.isStyleLoaded()) {
        addDomainIcons(map);
        setIconsReady(true);
        map.triggerRepaint();
      }
      if (!styledataBoundRef.current) {
        styledataBoundRef.current = true;
        map.on('styledata', () => {
          if (map.isStyleLoaded()) {
            addDomainIcons(map);
            map.triggerRepaint();
          }
        });
      }
    },
    [addDomainIcons]
  );

  const handleMapClick = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;
    const props = (feature.properties ?? {}) as Record<string, unknown>;

    if (feature.layer?.id === "signalements-points") {
      const id = String(props.id);
      const s = markerPoints.find((m) => m.id === id);
      if (s) setPopupInfo(s);
    }
  };

  const mapClickableLayers = ["signalements-points"];

  return (
    <div
      data-od-id="map-card"
      className="w-full h-full relative rounded-lg overflow-hidden"
    >
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        interactiveLayerIds={mapClickableLayers}
      >
        {/* Limites des wilayas */}
        <Source
          id="wilayas-source"
          type="geojson"
          data="/data/wilaya-boundaries.geojson"
        >
          <Layer {...wilayaFillLayer} />
          <Layer {...wilayaBorderLayer} />
        </Source>

        {/* Signalements — mode simple : chaque point est une piñette teardrop
            par domaine (couche `symbol`). Le clic sur un point ouvre la popup.
            Le signalement sélectionné est retiré de la source et rendu en
            marqueur DOM par-dessus. */}
        <Source
          id="signalements-source"
          type="geojson"
          data={pointsGeoJson}
        >
          {iconsReady && <Layer {...pointSymbolLayer} />}
        </Source>

        {/* Marqueur DOM du signalement sélectionné : grande épingle
            teardrop + anneau pulsant (la popup garde l'ancrage).
            Attention : l'ancre `bottom` doit rester pour la pointe. */}
        {popupInfo && (
          <Marker
            key={popupInfo.id}
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
          >
            <span
              className="marker-pin marker-pin--lg pointer-events-none"
              aria-hidden
            >
              <PinMarkerSelected
                color={TYPE_DOMAIN_COLOR[popupInfo.type] ?? 'var(--prio-l)'}
              />
            </span>
          </Marker>
        )}

        {/* Popup déclenchée par clic sur un point individuel */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.latitude}
            longitude={popupInfo.longitude}
            anchor="top"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
          >
            <div className="p-1 text-sm max-w-[220px]">
              <strong className="block text-base mb-1">
                {TYPE_ICONS[popupInfo.type] ?? "📍"}{" "}
                {tTypes(popupInfo.type)}
              </strong>
              <p className="text-[var(--color-muted)] mb-1 line-clamp-3">
                {popupInfo.description}
              </p>
              {popupInfo.adresse_texte && (
                <span className="text-xs text-[var(--color-muted)] block">
                  {popupInfo.adresse_texte}
                </span>
              )}
              {onSelectSignalement && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectSignalement(popupInfo);
                    setPopupInfo(null);
                  }}
                  className="mt-2 w-full rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary-foreground)] hover:opacity-90"
                >
                  {t('details_button')}
                </button>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Légende interactive par domaine : clic = filtre, survol = sous-types */}
      <div
        data-od-id="map-legend"
        className="pointer-events-auto absolute bottom-3 start-3 z-20 flex flex-col gap-1 rounded-lg bg-[var(--color-surface)]/90 p-2 shadow-lg backdrop-blur-md sm:gap-1.5"
      >
        {DOMAIN_KEYS.map((key) => {
          const meta = DOMAIN_META[key];
          const active = filters.domaine === key;
          return (
            <div
              key={key}
              data-od-id={`map-legend-${key}`}
              className="group relative"
            >
              <button
                type="button"
                onClick={() =>
                  setFilters({ domaine: active ? null : key })
                }
                aria-pressed={active}
                className={cn(
                  'flex w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
                  active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-fg)]'
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: meta.color }}
                  aria-hidden
                />
                <span aria-hidden>{meta.emoji}</span>
                <span>{tDomains(meta.label)}</span>
              </button>

              {/* Tooltip animé : sous-types du domaine */}
              <div
                className="map-tooltip pointer-events-none absolute bottom-full start-1/2 z-30 hidden -translate-x-1/2 pb-1 group-hover:block rtl:translate-x-1/2"
                role="tooltip"
              >
                <div className="w-max max-w-[220px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-xl">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    {tDomains(meta.label)}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {meta.types.map((type) => (
                      <li
                        key={type}
                        className="flex items-center gap-2 text-xs text-[var(--color-fg)]"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              MARKER_BG_HEX[type] ?? '#6b7280',
                          }}
                          aria-hidden
                        />
                        <span>{tTypes(type)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contrôles de zoom (légers, compatibles RTL) */}
      <div
        data-od-id="map-zoom"
        className="absolute bottom-3 end-3 z-20 flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/90 shadow-lg backdrop-blur-md"
      >
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label={t('zoom_in')}
          className="flex h-8 w-8 items-center justify-center text-[var(--color-fg)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="h-px bg-[var(--color-border)]" />
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label={t('zoom_out')}
          className="flex h-8 w-8 items-center justify-center text-[var(--color-fg)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
