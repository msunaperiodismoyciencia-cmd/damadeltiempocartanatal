"""Convenciones astrológicas explícitas, pendientes de validación. AGPL-3.0-only."""
import math
from houses import system_info, DEFAULT_SYSTEM

SIGNS = ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra',
         'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis']


def position(longitude):
    # Redondeo al minuto más cercano, con acarreo de signo y vuelta completa.
    minutes = math.floor((longitude % 360) * 60 + .5) % 21600
    return f'{SIGNS[minutes // 1800]} {minutes % 1800 // 60:02d}° {minutes % 60:02d}′'


def whole_sign_house(longitude, ascendant):
    return (int(longitude % 360 // 30) - int(ascendant % 360 // 30)) % 12 + 1


def quadrant_house(longitude, cusps):
    for i, start in enumerate(cusps):
        if (longitude - start) % 360 < (cusps[(i+1) % 12] - start) % 360:
            return i + 1
    raise ValueError('Cúspides inválidas.')


def motion(speed, threshold):
    return 'Estacionario' if abs(speed) <= threshold else ('Retrógrado' if speed < 0 else 'Directo')


def present(raw, threshold):
    system = raw.get('house_system', DEFAULT_SYSTEM)
    south = dict(raw['bodies'][-1], name='Nodo Sur', longitude=(raw['bodies'][-1]['longitude'] + 180) % 360)
    rows = []
    for body in raw['bodies'] + [south]:
        lon = body['longitude']
        active_house = quadrant_house(lon, raw['cusps'])
        rows.append(dict(body, position=position(lon), house=active_house, house_system=system,
                         alcabitius=active_house if system == 'alcabitius' else None,
                         whole_sign=quadrant_house(lon, raw['whole_sign_cusps']), motion=motion(body['speed'], threshold)))
    return {'bodies': rows, 'house_system': system_info(system), 'angles': [{'name': n, 'longitude': raw[k], 'position': position(raw[k])}
                                      for n, k in [('Ascendente', 'ascendant'), ('Medio Cielo', 'midheaven')]],
            'cusps': [{'house': i+1, 'longitude': c, 'position': position(c), 'house_system': system,
                       **position_fields(c), 'whole_sign': position(raw['whole_sign_cusps'][i])}
                      for i, c in enumerate(raw['cusps'])], 'station_threshold': threshold}


def position_fields(longitude):
    minutes = math.floor((longitude % 360)*60+.5) % 21600
    return {'sign': SIGNS[minutes//1800], 'degree': minutes%1800//60, 'minute': minutes%60}
