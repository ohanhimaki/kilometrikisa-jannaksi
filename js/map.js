window.kkMap = {
    _map: null,

    // Interpoloi koordinaatin reitiltä annetulle km-arvolle
    _interpolate: function(stops, km) {
        if (km <= stops[0].km) return [stops[0].lat, stops[0].lng];
        for (let i = 1; i < stops.length; i++) {
            if (km <= stops[i].km) {
                const from = stops[i - 1];
                const to = stops[i];
                const f = (km - from.km) / (to.km - from.km);
                return [from.lat + (to.lat - from.lat) * f,
                        from.lng + (to.lng - from.lng) * f];
            }
        }
        return [stops[stops.length - 1].lat, stops[stops.length - 1].lng];
    },

    // Palauttaa reitin koordinaatit kahden km-arvon väliltä
    _routeSegment: function(stops, fromKm, toKm) {
        const coords = [];
        coords.push(this._interpolate(stops, fromKm));
        for (const s of stops) {
            if (s.km > fromKm && s.km < toKm) coords.push([s.lat, s.lng]);
        }
        coords.push(this._interpolate(stops, toKm));
        return coords;
    },

    init: function (stops, totalAjettu, edellinenKm) {
        if (this._map) {
            this._map.remove();
            this._map = null;
        }

        const map = L.map('kk-map', { zoomControl: true, scrollWheelZoom: true });
        this._map = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        const allCoords = stops.map(s => [s.lat, s.lng]);

        // Harmaa katkoviiva – koko reitti taustalle
        L.polyline(allCoords, {
            color: '#ccc',
            weight: 3,
            dashArray: '8 8'
        }).addTo(map);

        const maxKm = stops[stops.length - 1].km;
        const capped = Math.min(totalAjettu, maxKm);

        // Vihreä – koko ajettu osuus (alku → nykyinen sijainti)
        const greenEnd = edellinenKm != null ? edellinenKm : capped;
        if (greenEnd > 0) {
            const greenCoords = this._routeSegment(stops, 0, Math.min(greenEnd, maxKm));
            L.polyline(greenCoords, {
                color: '#1a7c3e',
                weight: 5,
                lineJoin: 'round'
            }).addTo(map);
        }

        // Oranssi – edistys edellisestä käynnistä
        if (edellinenKm != null && edellinenKm < capped) {
            const orangeCoords = this._routeSegment(stops, edellinenKm, capped);
            L.polyline(orangeCoords, {
                color: '#e07b00',
                weight: 6,
                lineJoin: 'round',
                opacity: 0.9
            }).addTo(map);
        }

        // 🚴 Pyöräilijä nykyisellä sijainnilla
        const bikePos = this._interpolate(stops, capped);
        const bikeIcon = L.divIcon({
            html: '<div class="kk-bike-marker">🚴</div>',
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 24]
        });
        L.marker(bikePos, { icon: bikeIcon })
            .bindTooltip(`<b>Olemme tässä!</b><br>${totalAjettu.toLocaleString('fi-FI')} km ajettu`, { direction: 'top' })
            .addTo(map);

        // Pysäkkipisteet
        stops.forEach(stop => {
            const color = stop.done ? '#1a7c3e' : stop.next ? '#e07b00' : '#aaa';
            const size = stop.next ? 16 : 12;
            const icon = L.divIcon({
                html: `<div style="background:${color};border:3px solid white;width:${size}px;height:${size}px;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,0.35)"></div>`,
                className: '',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
            });
            L.marker([stop.lat, stop.lng], { icon })
                .bindTooltip(`<b>${stop.name}</b><br>${stop.km} km`, { direction: 'top', offset: [0, -10] })
                .addTo(map);
        });

        map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
    }
};
