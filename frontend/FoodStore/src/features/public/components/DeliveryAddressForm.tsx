import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Crosshair, Navigation } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon (webpack/vite issue)
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = defaultIcon

// Centro default: Argentina
const DEFAULT_CENTER: L.LatLngExpression = [-34.6037, -58.3816]
const DEFAULT_ZOOM = 13

interface DeliveryAddressFormProps {
  address: string
  onAddressChange: (address: string) => void
}

function parseAddress(address: string) {
  const parts = address.split(',').map((s) => s.trim())
  const street = parts[0] ?? ''
  const city = parts[1] ?? ''
  const extra = parts.slice(2).join(', ').trim()
  // Separar calle y número: "Calle Falsa 123" → ["Calle Falsa", "123"]
  const streetMatch = street.match(/^(.+?)\s+(\d+)$/)
  return {
    street: streetMatch ? streetMatch[1] : street,
    number: streetMatch ? streetMatch[2] : '',
    city,
    extra,
  }
}

function composeAddress(street: string, number: string, city: string, extra: string): string {
  let full = `${street} ${number}`.trim()
  if (city) full += `, ${city}`
  if (extra) full += `, ${extra}`
  return full
}

// Controlador interno: actualiza el centro del mapa cuando cambia la posición
function MapController({ center }: { center: L.LatLngExpression }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [map, center])
  return null
}

function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: L.LatLngExpression
  onDragEnd: (latlng: L.LatLng) => void
}) {
  const markerRef = useRef<L.Marker>(null)

  useMapEvents({
    click(e) {
      onDragEnd(e.latlng)
    },
  })

  return (
    <Marker
      ref={markerRef}
      position={position}
      draggable={true}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current
          if (marker) onDragEnd(marker.getLatLng())
        },
      }}
    />
  )
}

export function DeliveryAddressForm({ address, onAddressChange }: DeliveryAddressFormProps) {
  const parsed = parseAddress(address)
  const [street, setStreet] = useState(parsed.street)
  const [number, setNumber] = useState(parsed.number)
  const [city, setCity] = useState(parsed.city)
  const [extra, setExtra] = useState(parsed.extra)
  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>(DEFAULT_CENTER)
  const [markerPos, setMarkerPos] = useState<L.LatLngExpression | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [reverseLoading, setReverseLoading] = useState(false)

  // Sincronizar cuando address cambia externamente
  useEffect(() => {
    const p = parseAddress(address)
    setStreet(p.street)
    setNumber(p.number)
    setCity(p.city)
    setExtra(p.extra)
  }, [address])

  const notifyChange = useCallback(
    (s: string, n: string, c: string, e: string) => {
      onAddressChange(composeAddress(s, n, c, e))
    },
    [onAddressChange],
  )

  const handleStreetChange = (v: string) => {
    setStreet(v)
    notifyChange(v, number, city, extra)
  }
  const handleNumberChange = (v: string) => {
    setNumber(v)
    notifyChange(street, v, city, extra)
  }
  const handleCityChange = (v: string) => {
    setCity(v)
    notifyChange(street, number, v, extra)
  }
  const handleExtraChange = (v: string) => {
    setExtra(v)
    notifyChange(street, number, city, v)
  }

  // Reverse geocoding: coord → dirección
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setReverseLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`,
          { headers: { 'User-Agent': 'FoodStore/1.0' } },
        )
        const data = await res.json()
        const addr = data.address ?? {}
        const road = addr.road ?? addr.pedestrian ?? addr.street ?? ''
        const num = addr.house_number ?? ''
        const cityName = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? ''
        const state = addr.state ?? ''
        const displayCity = cityName || state

        setStreet(road)
        setNumber(num)
        setCity(displayCity)
        setExtra('')
        notifyChange(road, num, displayCity, '')
      } catch {
        // Si falla el reverse, al menos dejamos el marker
      } finally {
        setReverseLoading(false)
      }
    },
    [notifyChange],
  )

  // Buscar ubicación del usuario
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalización no disponible en este navegador')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setMapCenter([latitude, longitude])
        setMarkerPos([latitude, longitude])
        reverseGeocode(latitude, longitude)
        setGeoLoading(false)
      },
      (err) => {
        setGeoLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Permiso denegado. Ingresá la dirección manualmente.')
            break
          case err.POSITION_UNAVAILABLE:
            setGeoError('No se pudo obtener la ubicación. Intentá de nuevo.')
            break
          case err.TIMEOUT:
            setGeoError('La solicitud de ubicación tardó demasiado.')
            break
          default:
            setGeoError('Error al obtener ubicación.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // Cuando se mueve el marker en el mapa
  const handleMarkerDrag = (latlng: L.LatLng) => {
    setMarkerPos([latlng.lat, latlng.lng])
    reverseGeocode(latlng.lat, latlng.lng)
  }

  return (
    <div className="space-y-3">
      {/* Botón de geolocalización */}
      <button
        type="button"
        onClick={handleDetectLocation}
        disabled={geoLoading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-bold text-body-sm hover:bg-primary/10 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {geoLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Obteniendo ubicación...
          </>
        ) : (
          <>
            <Crosshair size={18} />
            Usar mi ubicación
          </>
        )}
      </button>

      {geoError && (
        <p className="text-red-500 text-body-sm">{geoError}</p>
      )}

      {/* Mapa */}
      <div className="rounded-xl overflow-hidden border border-outline-variant h-52">
        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={markerPos ?? mapCenter} />
          {markerPos && (
            <DraggableMarker position={markerPos} onDragEnd={handleMarkerDrag} />
          )}
        </MapContainer>
      </div>

      {reverseLoading && (
        <p className="text-primary text-body-sm flex items-center gap-1">
          <Navigation size={14} className="animate-pulse" />
          Obteniendo dirección...
        </p>
      )}

      {/* Campos estructurados */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="text-label-sm font-label text-on-surface-variant mb-1 block">Calle *</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={street}
              onChange={(e) => handleStreetChange(e.target.value)}
              placeholder="Calle"
              className="w-full pl-9 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>
        <div>
          <label className="text-label-sm font-label text-on-surface-variant mb-1 block">N° *</label>
          <input
            type="text"
            value={number}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder="123"
            className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none placeholder:text-on-surface-variant/50"
          />
        </div>
      </div>

      <div>
        <label className="text-label-sm font-label text-on-surface-variant mb-1 block">Ciudad *</label>
        <input
          type="text"
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          placeholder="Ciudad"
          className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none placeholder:text-on-surface-variant/50"
        />
      </div>

      <div>
        <label className="text-label-sm font-label text-on-surface-variant mb-1 block">
          Piso / Depto / Referencia
        </label>
        <input
          type="text"
          value={extra}
          onChange={(e) => handleExtraChange(e.target.value)}
          placeholder="Opcional"
          className="w-full px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary-container outline-none placeholder:text-on-surface-variant/50"
        />
      </div>
    </div>
  )
}
