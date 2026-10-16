import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Establishment } from './pwaApi'
import { Satellite, Globe, Navigation, Search, MapPin, CheckCircle2, AlertTriangle, ExternalLink, Ruler } from 'lucide-react'

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

interface LiveFieldMapProps {
  establishments: Establishment[]
  onSelectEst: (est: Establishment) => void
  onStartInspect: (est: Establishment) => void
  height?: string
}

const PONG_NAM_RON_CENTER: [number, number] = [19.9328, 99.1719]

export const LiveFieldMap: React.FC<LiveFieldMapProps> = ({
  establishments,
  onSelectEst,
  onStartInspect,
  height
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const currentTileLayerRef = useRef<L.TileLayer | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)

  const [mapType, setMapType] = useState<'hybrid' | 'osm'>('hybrid')
  const [selectedForPopup, setSelectedForPopup] = useState<Establishment | null>(null)
  const [locating, setLocating] = useState(false)
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: PONG_NAM_RON_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    })

    // Custom Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapRef.current = map

    // Tile Layer
    const tileUrl =
      mapType === 'hybrid'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: mapType === 'osm' ? ['a', 'b', 'c'] : []
    }).addTo(map)
    currentTileLayerRef.current = tileLayer

    // Markers layer
    const markersGroup = L.layerGroup().addTo(map)
    markersLayerRef.current = markersGroup

    // Invalidate size to ensure full rendering
    const t1 = setTimeout(() => map.invalidateSize(), 100)
    const t2 = setTimeout(() => map.invalidateSize(), 400)
    const t3 = setTimeout(() => map.invalidateSize(), 800)

    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      window.removeEventListener('resize', handleResize)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Switch Tile Layer
  useEffect(() => {
    if (!mapRef.current) return
    if (currentTileLayerRef.current) {
      mapRef.current.removeLayer(currentTileLayerRef.current)
    }

    const tileUrl =
      mapType === 'hybrid'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: mapType === 'osm' ? ['a', 'b', 'c'] : []
    }).addTo(mapRef.current)
    currentTileLayerRef.current = tileLayer
  }, [mapType])

  // Update Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return

    markersLayerRef.current.clearLayers()

    establishments.forEach((est) => {
      const lat = est.lat || 19.9288 + (Math.random() - 0.5) * 0.015
      const lng = est.lng || 99.1685 + (Math.random() - 0.5) * 0.015

      const isHazardous = est.category === 'hazardous' || est.type.includes('ปิโตรเลียม') || est.type.includes('น้ำมัน') || est.type.includes('หยอดเหรียญ') || est.type.includes('อันตราย')
      const isFood = !isHazardous && (est.type.includes('สะสมอาหาร') || est.type.includes('จำหน่ายอาหาร'))
      const isWarn = est.permitStatus === 'ใกล้หมดอายุ' || est.permitStatus === 'หมดอายุ'

      const pinColor = isWarn ? '#f59e0b' : isHazardous ? '#8b5cf6' : isFood ? '#10b981' : '#3b82f6'
      const iconEmoji = isHazardous ? '⛽' : isFood ? '🍱' : '🏪'

      const customIcon = L.divIcon({
        className: 'custom-pwa-marker',
        html: `
          <div style="
            background: ${pinColor};
            width: 38px;
            height: 38px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.45), 0 0 12px ${pinColor}88;
            border: 2px solid #ffffff;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <span style="transform: rotate(45deg); font-size: 16px; user-select: none;">
              ${iconEmoji}
            </span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
      })

      const marker = L.marker([lat, lng], { icon: customIcon })
      marker.on('click', () => {
        setSelectedForPopup(est)
        mapRef.current?.panTo([lat, lng])
      })

      markersLayerRef.current?.addLayer(marker)
    })
  }, [establishments])

  // Locate User
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับการระบุพิกัดดาวเทียม')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude, longitude } = pos.coords
        setUserGps({ lat: latitude, lng: longitude })

        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 17, { duration: 1.5 })

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude])
          } else {
            const userIcon = L.divIcon({
              className: 'user-location-marker',
              html: `
                <div style="
                  width: 24px;
                  height: 24px;
                  background: #0284c7;
                  border: 3px solid #ffffff;
                  border-radius: 50%;
                  box-shadow: 0 0 0 8px rgba(2, 132, 199, 0.4), 0 0 16px #0284c7;
                  animation: pulse 2s infinite;
                "></div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
            userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(mapRef.current)
          }
        }
      },
      (err) => {
        setLocating(false)
        alert(`ไม่สามารถดึงตำแหน่งได้: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div
      className="relative w-full flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white"
      style={{ minHeight: height || '380px', height: height || '100%', width: '100%', position: 'relative' }}
    >
      {/* Map Element */}
      <div
        ref={mapContainerRef}
        className="w-full h-full flex-1 z-0"
        style={{ minHeight: height || '380px', height: height || '100%', width: '100%', background: '#e2e8f0' }}
      />

      {/* Top Map Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Layer Switcher */}
        <div className="pointer-events-auto flex items-center bg-white/95 border border-slate-300 rounded-xl p-1 shadow-md text-xs font-medium backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setMapType('hybrid')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              mapType === 'hybrid'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>ดาวเทียม</span>
          </button>
          <button
            type="button"
            onClick={() => setMapType('osm')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              mapType === 'osm'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>แผนที่ถนน</span>
          </button>
        </div>

        {/* GPS Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="pointer-events-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md border border-emerald-500 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'กำลังหาพิกัด...' : 'พิกัดฉัน'}</span>
        </button>
      </div>

      {/* Floating Store Details Sheet / Card (When Selected) */}
      {selectedForPopup && (
        <div className="absolute bottom-4 left-3 right-3 z-20 animate-in fade-in slide-in-from-bottom-6 duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedForPopup.permitNo}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    selectedForPopup.permitStatus === 'ปกติ'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedForPopup.permitStatus}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">
                  {selectedForPopup.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1">
                  เจ้าของ: {selectedForPopup.owner} • {selectedForPopup.village || 'ต.โป่งน้ำร้อน'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedForPopup(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Area Info if available */}
            {selectedForPopup.areaSqm ? (
              <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-200 text-xs text-emerald-900">
                <Ruler className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {selectedForPopup.category === 'hazardous' || selectedForPopup.type.includes('ปิโตรเลียม') || selectedForPopup.type.includes('น้ำมัน') || selectedForPopup.type.includes('หยอดเหรียญ') || selectedForPopup.type.includes('อันตราย')
                    ? 'ขนาดพื้นที่ประกอบกิจการ: '
                    : selectedForPopup.category === 'food_storage' || selectedForPopup.type.includes('สะสมอาหาร')
                    ? 'ขนาดพื้นที่สะสมอาหาร: '
                    : 'ขนาดพื้นที่ร้าน: '}
                  <strong className="text-emerald-700">{selectedForPopup.areaSqm} ตร.ม.</strong>
                  {selectedForPopup.category === 'hazardous' || selectedForPopup.type.includes('ปิโตรเลียม') || selectedForPopup.type.includes('หยอดเหรียญ')
                    ? ' (แบบ บท.๓)'
                    : selectedForPopup.areaSqm <= 200
                    ? ' (แบบ นจ.๓)'
                    : ' (แบบ บทอ.๒)'}
                </span>
              </div>
            ) : null}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectEst(selectedForPopup)
                  onStartInspect(selectedForPopup)
                }}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>เริ่มตรวจสุขลักษณะ</span>
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedForPopup.lat || 19.9288},${selectedForPopup.lng || 99.1685}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-300 active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>นำทาง Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
