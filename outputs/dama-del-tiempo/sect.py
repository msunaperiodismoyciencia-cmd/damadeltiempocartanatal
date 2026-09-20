"""Secta por altura geométrica del centro solar; no recalcula posiciones."""
import math
import swisseph as swe

def sect_from_altitude(altitude):
    if not math.isfinite(altitude):
        raise ValueError('Altura solar no válida.')
    return 'diurna' if altitude >= 0 else 'nocturna'

def solar_sect(raw, latitude, longitude):
    sun = next(b for b in raw['bodies'] if b['name'] == 'Sol')
    _, altitude, _ = swe.azalt(raw['jd_ut1'], swe.ECL2HOR,
                             (longitude, latitude, 0), 0, 15,
                             (sun['longitude'], sun['latitude'], 1))
    return {'name': sect_from_altitude(altitude), 'solar_altitude': altitude,
            'rule': 'Centro solar geométrico sin refracción: altura >= 0° diurna; < 0° nocturna.',
            'source': 'Swiss Ephemeris, swe.azalt, true_altitude; horizonte astronómico local.'}
