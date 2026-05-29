import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, type LatLngExpression } from 'leaflet'
import { useOrderStore, type Order } from '../../stores/orderStore'
import { Card, Button, EmptyState } from '../shared/ui'
import { CheckCircle, Truck, MapPin, Clock, Package, RefreshCw, Navigation } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix Leaflet default marker icon
delete (Icon.Default.prototype as Record<string, unknown>)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

interface GeocodeResult {
  lat: string
  lon: string
  display_name: string
}

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'ar',
    })
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'Accept-Language': 'es' },
    })
    const data: GeocodeResult[] = await res.json()
    return data?.[0] ?? null
  } catch {
    return null
  }
}

function MapController({ center }: { center: LatLngExpression }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 15, { animate: true })
  }, [map, center])
  return null
}

function formatElapsed(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remaining = mins % 60
  return `${hours}h ${remaining}m`
}

export default function DeliveryView() {
  const { orders, updateStatus, fetchOrders } = useOrderStore()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [geoPosition, setGeoPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [geoLabel, setGeoLabel] = useState('')
  const [geocoding, setGeocoding] = useState(false)

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Auto-refresh every 30s
  useEffect(() => {
    const timer = setInterval(() => fetchOrders(), 30000)
    return () => clearInterval(timer)
  }, [fetchOrders])

  // Orders ready for pickup (READY + DELIVERY channel)
  const paraRecoger = orders.filter((o) => o.status === 'ready' && o.channel === 'delivery')
  // Orders out for delivery
  const enCamino = orders.filter((o) => o.status === 'out_for_delivery')

  // Geocode selected order address
  useEffect(() => {
    if (!selectedOrder?.address) {
      setGeoPosition(null)
      setGeoLabel('')
      return
    }

    setGeocoding(true)
    let cancelled = false

    geocodeAddress(selectedOrder.address).then((result) => {
      if (cancelled || !result) {
        setGeocoding(false)
        return
      }
      setGeoPosition({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
      setGeoLabel(result.display_name)
      setGeocoding(false)
    })

    return () => { cancelled = true }
  }, [selectedOrder])

  const handlePickUp = useCallback(async (orderId: number) => {
    await updateStatus(orderId, 'out_for_delivery')
  }, [updateStatus])

  const handleMarkDelivered = useCallback(async (orderId: number) => {
    await updateStatus(orderId, 'billed')
  }, [updateStatus])

  const handleRefresh = useCallback(() => {
    fetchOrders()
  }, [fetchOrders])

  const defaultCenter: LatLngExpression = [-34.6037, -58.3816] // Buenos Aires

  const renderOrderCard = (
    order: Order,
    actions: 'pickup' | 'delivered'
  ) => {
    const isSelected = selectedOrder?.id === order.id
    return (
      <Card
        key={order.id}
        className={`cursor-pointer transition-all ${
          isSelected
            ? 'ring-2 ring-orange-500 border-orange-500'
            : 'hover:border-gray-300'
        }`}
        onClick={() => setSelectedOrder(order)}
      >
        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">#{order.orderNumber}</span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  DELIVERY
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{order.customer}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock size={14} />
              <span>{formatElapsed(order.createdAt)}</span>
            </div>
          </div>

          {order.address && (
            <div className="flex items-start gap-1.5 mb-2 text-sm text-gray-600">
              <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
              <span className="line-clamp-2">{order.address}</span>
            </div>
          )}

          <div className="text-xs text-gray-400 space-y-0.5">
            {order.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex gap-1">
                <span className="text-gray-500">{item.quantity}x</span>
                <span>{item.name}</span>
              </div>
            ))}
            {order.items.length > 3 && (
              <span className="text-gray-400 italic">+{order.items.length - 3} más</span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600">${order.total.toFixed(2)}</span>
            {actions === 'pickup' && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePickUp(order.id)
                }}
                leftIcon={<Package size={14} />}
              >
                Recoger
              </Button>
            )}
            {actions === 'delivered' && (
              <Button
                variant="success"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMarkDelivered(order.id)
                }}
                leftIcon={<CheckCircle size={14} />}
              >
                Entregado
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex h-[calc(100vh-72px)] gap-0">
      {/* Left panel — Order list */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <Truck size={20} className="text-orange-500" />
            <h2 className="font-semibold text-gray-800">Repartos</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Actualizar">
            <RefreshCw size={16} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Para Recoger section */}
          <div className="p-3 pb-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Package size={14} />
              Para Recoger ({paraRecoger.length})
            </h3>
            <div className="space-y-2">
              {paraRecoger.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4 italic">
                  Sin pedidos listos para recoger
                </p>
              ) : (
                paraRecoger.map((order) => renderOrderCard(order, 'pickup'))
              )}
            </div>
          </div>

          {/* En Camino section */}
          <div className="p-3 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Truck size={14} />
              En Camino ({enCamino.length})
            </h3>
            <div className="space-y-2">
              {enCamino.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4 italic">
                  Sin pedidos en camino
                </p>
              ) : (
                enCamino.map((order) => renderOrderCard(order, 'delivered'))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Map */}
      <div className="flex-1 relative">
        {selectedOrder ? (
          <>
            <MapContainer
              center={geoPosition ?? defaultCenter}
              zoom={15}
              className="h-full w-full z-0"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {geoPosition && (
                <>
                  <MapController center={geoPosition} />
                  <Marker position={[geoPosition.lat, geoPosition.lng]}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{selectedOrder.customer}</p>
                        <p className="text-gray-600">{selectedOrder.address}</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>

            {/* Overlay info card */}
            <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
              <Card className="bg-white/95 backdrop-blur-sm shadow-lg pointer-events-auto">
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">#{selectedOrder.orderNumber}</h3>
                      <p className="text-sm text-gray-500">{selectedOrder.customer}</p>
                    </div>
                    <span className="text-sm font-semibold text-orange-600">
                      {formatElapsed(selectedOrder.createdAt)}
                    </span>
                  </div>
                  {selectedOrder.address && (
                    <div className="flex items-start gap-1.5 mt-2 text-sm text-gray-600">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-orange-500" />
                      <span>{geocoding ? 'Buscando dirección...' : geoLabel || selectedOrder.address}</span>
                    </div>
                  )}
                  {!geocoding && !geoPosition && selectedOrder.address && (
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(selectedOrder.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Navigation size={14} />
                      Abrir en Google Maps
                    </a>
                  )}
                </div>
              </Card>
            </div>

            {/* Bottom action button */}
            <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
              {selectedOrder.status === 'ready' && (
                <Button
                  variant="primary"
                  fullWidth
                  className="pointer-events-auto shadow-lg text-base py-3"
                  onClick={() => handlePickUp(selectedOrder.id)}
                  leftIcon={<Package size={20} />}
                >
                  Recoger Pedido
                </Button>
              )}
              {selectedOrder.status === 'out_for_delivery' && (
                <Button
                  variant="success"
                  fullWidth
                  className="pointer-events-auto shadow-lg text-base py-3"
                  onClick={() => handleMarkDelivered(selectedOrder.id)}
                  leftIcon={<CheckCircle size={20} />}
                >
                  Marcar como Entregado
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <MapPin size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Seleccioná un pedido</p>
              <p className="text-sm">para ver su ubicación en el mapa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
