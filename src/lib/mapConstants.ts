/**
 * Map zoom limits.
 *
 * Esri World Imagery does not have tiles at every zoom everywhere. Above the
 * native level it returns grey "Map data not yet available" tiles unless Leaflet
 * is told to stop fetching and stretch instead (maxNativeZoom + higher maxZoom).
 *
 * @see https://stackoverflow.com/questions/18687120/leaflet-zoom-in-further-and-stretch-tiles
 */

/** Furthest the user can zoom in (~3 m scale bar with stretched tiles). */
export const MAP_MAX_ZOOM = 22;

/** MapTiler satellite-v2 native max (global tiles to zoom 22). */
export const MAPTILER_MAX_NATIVE_ZOOM = 22;

/**
 * Highest zoom level to request from Esri as real tiles. Many regions (incl.
 * rural Taiwan) only have imagery through 16–17; higher requests return grey
 * "Map data not yet available" placeholders unless Leaflet upscales.
 */
export const SATELLITE_MAX_NATIVE_ZOOM = 16;

/** Labels overlay native max (Carto); also stretched above this. */
export const LABELS_MAX_NATIVE_ZOOM = 19;
