declare namespace daum {
  class Postcode {
    constructor(options: {
      oncomplete: (data: {
        address: string
        roadAddress: string
        jibunAddress: string
      }) => void
    })
    open(): void
  }
}

declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions)
    setCenter(latlng: LatLng): void
    getCenter(): LatLng
    getBounds(): LatLngBounds
    setLevel(level: number): void
    getLevel(): number
    panTo(latlng: LatLng): void
  }

  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  class LatLngBounds {
    getSouthWest(): LatLng
    getNorthEast(): LatLng
  }

  class Marker {
    constructor(options: MarkerOptions)
    setMap(map: Map | null): void
    getPosition(): LatLng
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions)
    open(map: Map, marker: Marker): void
    close(): void
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions)
    setMap(map: Map | null): void
    getMap(): Map | null
    setPosition(position: LatLng): void
    getPosition(): LatLng
  }

  class MarkerClusterer {
    constructor(options: MarkerClustererOptions)
    addMarkers(markers: Marker[]): void
    clear(): void
  }

  interface MapOptions {
    center: LatLng
    level: number
  }

  interface MarkerOptions {
    position: LatLng
    map?: Map
  }

  interface InfoWindowOptions {
    content: string
    removable?: boolean
  }

  interface CustomOverlayOptions {
    position: LatLng
    content: string
    xAnchor?: number
    yAnchor?: number
    map?: Map
  }

  interface MarkerClustererOptions {
    map: Map
    averageCenter?: boolean
    minLevel?: number
    disableClickZoom?: boolean
    styles?: object[]
  }

  namespace event {
    function addListener(target: any, type: string, callback: () => void): void
  }

  namespace services {
    class Geocoder {
      addressSearch(
        address: string,
        callback: (result: Array<{ x: string; y: string }>, status: string) => void
      ): void
    }
    const Status: {
      OK: string
      ZERO_RESULT: string
      ERROR: string
    }
  }

  function load(callback: () => void): void
}

interface Window {
  kakao: typeof kakao
  daum: typeof daum
}
