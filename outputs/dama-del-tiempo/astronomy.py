"""Solo resultados del motor astronómico Swiss Ephemeris. AGPL-3.0-only."""
from pathlib import Path
import swisseph as swe
from houses import calculate_houses, DEFAULT_SYSTEM

EPHE = Path(__file__).parent / 'ephe'
PLANETS = [(swe.SUN, 'Sol'), (swe.MOON, 'Luna'), (swe.MERCURY, 'Mercurio'),
           (swe.VENUS, 'Venus'), (swe.MARS, 'Marte'), (swe.JUPITER, 'Júpiter'),
           (swe.SATURN, 'Saturno')]


def calculate(utc, latitude, longitude, node='mean', house_system=DEFAULT_SYSTEM):
    if not 1800 <= utc.year <= 2399:
        raise ValueError('Esta etapa admite fechas UTC entre 1800 y 2399, con calendario gregoriano.')
    if not -90 < latitude < 90 or not -180 <= longitude <= 180:
        raise ValueError('Ingresá longitud entre −180 y 180 y latitud entre −90 y 90, sin incluir los polos.')
    if node not in ('mean', 'true'):
        raise ValueError('Seleccioná nodo medio o verdadero.')
    for name in ('sepl_18.se1', 'semo_18.se1'):
        if not (EPHE / name).is_file():
            raise ValueError('Faltan las efemérides oficiales. No se realizará un cálculo alternativo.')
    swe.set_ephe_path(str(EPHE))
    tt, ut1 = swe.utc_to_jd(utc.year, utc.month, utc.day, utc.hour, utc.minute,
                          utc.second + utc.microsecond / 1e6, swe.GREG_CAL)
    bodies = []
    for ident, name in PLANETS + [(swe.MEAN_NODE if node == 'mean' else swe.TRUE_NODE, 'Nodo Norte')]:
        values, flags = swe.calc(tt, ident, swe.FLG_SWIEPH | swe.FLG_SPEED)
        # Los nodos son puntos analíticos del propio motor; para los planetas
        # se rechaza expresamente cualquier fallback automático a Moshier.
        if ident in [p[0] for p in PLANETS] and not flags & swe.FLG_SWIEPH:
            raise ValueError('Swiss Ephemeris no utilizó los archivos previstos; cálculo cancelado.')
        bodies.append({'name': name, 'longitude': values[0], 'latitude': values[1],
                       'speed': values[3], 'flags': flags})
    houses = calculate_houses(ut1, latitude, longitude, house_system)
    whole_sign = houses if house_system == 'whole_sign' else calculate_houses(ut1, latitude, longitude, 'whole_sign')
    return {'bodies': bodies, **houses, 'whole_sign_cusps': whole_sign['cusps'],
            'jd_tt': tt, 'jd_ut1': ut1,
            'engine': swe.version, 'node': node}
