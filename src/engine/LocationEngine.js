class LocationEngine {
  constructor() {
    this.watchId = null;
    this.lastPosition = null;
    this.parkBoundaries = [];
    this.isTracking = false;
  }

  async start(driverId, bookingId, onUpdate) {
    if (this.isTracking) return;

    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    this.isTracking = true;
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, heading, speed, accuracy } = position.coords;
        const battery = await this.getBatteryLevel();

        const update = {
          latitude,
          longitude,
          // Preserve null so dashboards can show '—' when stationary.
          // Do NOT coerce to 0 — 0° is a valid bearing (true north).
          heading: heading ?? null,
          // Convert m/s → km/h then apply a 1.5 km/h dead-band to eliminate
          // GPS chipset noise that causes false speed readings when stationary.
          speed: (() => {
            if (speed == null) return 0;
            const kmh = Math.round(speed * 3.6 * 10) / 10;
            return kmh < 1.5 ? 0 : kmh;
          })(),
          accuracy,
          bookingId,
          isOnline: true,
          batteryLevel: battery,
          lastUpdated: new Date() // Will be serverTimestamp in Firestore
        };

        this.lastPosition = update;
        
        if (onUpdate) onUpdate(update);
      },
      (error) => console.error('LocationEngine Error:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
  }

  async getBatteryLevel() {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      return battery.level * 100;
    }
    return 100;
  }

  isInsidePark(lat, lng, parkPolygon) {
    // Standard point-in-polygon algorithm (Ray casting)
    let inside = false;
    for (let i = 0, j = parkPolygon.length - 1; i < parkPolygon.length; j = i++) {
      const xi = parkPolygon[i][0], yi = parkPolygon[i][1];
      const xj = parkPolygon[j][0], yj = parkPolygon[j][1];
      
      const intersect = ((yi > lat) !== (yj > lat)) &&
          (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}

export default new LocationEngine();
