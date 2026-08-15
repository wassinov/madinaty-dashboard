'use client'

import { useEffect } from 'react'
import maplibregl from 'maplibre-gl'

let loaded = false

/**
 * Charge une seule fois le plugin de rendu RTL de maplibre-gl (arabe/hébreu)
 * avant l'affichage des cartes. Sans lui, les labels arabes s'affichent de
 * gauche à droite avec des lettres non jointes (voir Issue dashboard).
 *
 * Le plugin est self-hosté dans `public/mapbox-gl-rtl-text.min.js` et chargé
 * de façon paresseuse (`lazy: true`) à la première occurrence de texte RTL.
 */
export function MapRtlTextSetup() {
  useEffect(() => {
    if (loaded) return
    loaded = true

    try {
      if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
        const url = new URL(
          '/mapbox-gl-rtl-text.min.js',
          window.location.origin,
        ).toString()
        maplibregl.setRTLTextPlugin(url, true).catch((err) => {
          console.error('Erreur chargement plugin RTL maplibre :', err)
        })
      }
    } catch (err) {
      console.error('Échec initialisation plugin RTL maplibre :', err)
    }
  }, [])

  return null
}
