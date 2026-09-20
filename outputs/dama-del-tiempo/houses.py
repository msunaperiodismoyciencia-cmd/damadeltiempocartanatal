"""Registro único y cálculo de casas Swiss Ephemeris. AGPL-3.0-only."""
import math
import logging
import swisseph as swe

HOUSE_SYSTEMS = {
    'alcabitius': {'name': 'Alcabitius', 'code': 'B'},
    'regiomontanus': {'name': 'Regiomontanus', 'code': 'R'},
    'placidus': {'name': 'Placidus', 'code': 'P'},
    'whole_sign': {'name': 'Signos enteros', 'code': 'W'},
}
DEFAULT_SYSTEM = 'alcabitius'
logger = logging.getLogger('dama.houses')


class HouseCalculationError(ValueError):
    code = 'HOUSE_CALCULATION_FAILED'

    def __init__(self, system, detail):
        self.system = system
        self.detail = detail
        name = HOUSE_SYSTEMS.get(system, {}).get('name', system)
        super().__init__(f'No se pudo calcular {name} para este lugar y fecha. No se sustituyó por otro sistema. Elegí otro sistema de casas. Código: {self.code}.')


def system_info(system):
    if system not in HOUSE_SYSTEMS:
        raise ValueError('Sistema de casas desconocido.')
    return {'id': system, **HOUSE_SYSTEMS[system]}


def calculate_houses(jd_ut1, latitude, longitude, system=DEFAULT_SYSTEM):
    info = system_info(system)
    if not all(math.isfinite(v) for v in (jd_ut1, latitude, longitude)):
        raise ValueError('Coordenadas o tiempo no válidos.')
    if not -90 < latitude < 90 or not -180 <= longitude <= 180:
        raise ValueError('Ingresá latitud entre −90° y +90° (sin incluir los polos) y longitud entre −180° y +180°.')
    try:
        cusps, angles = swe.houses_ex(jd_ut1, latitude, longitude, info['code'].encode('ascii'))
        if len(cusps) != 12 or len(angles) < 2:
            raise ValueError('Cantidad de cúspides o ángulos incorrecta.')
        if not all(math.isfinite(v) and 0 <= v < 360 for v in list(cusps)+list(angles[:2])):
            raise ValueError('Cúspides o ángulos no finitos o fuera del círculo.')
        widths = [(cusps[(i+1)%12]-cusps[i])%360 for i in range(12)]
        if min(widths) <= 1e-9 or abs(sum(widths)-360) > 1e-6:
            raise ValueError('Las cúspides no forman doce intervalos consecutivos válidos.')
    except (swe.Error, ValueError) as exc:
        # Solo diagnóstico técnico, sin nombre, fecha, coordenadas ni carta.
        logger.error('HOUSE_CALCULATION_FAILED system=%s swiss=%s reason=%s', system, swe.version, str(exc))
        raise HouseCalculationError(system, str(exc)) from exc
    return {'cusps': list(cusps), 'ascendant': angles[0], 'midheaven': angles[1], 'house_system': system}


def replace_houses(raw, latitude, longitude, system):
    updated = calculate_houses(raw['jd_ut1'], latitude, longitude, system)
    for key in ('ascendant', 'midheaven'):
        difference = abs((updated[key]-raw[key]+180)%360-180)
        if difference > 1e-7:
            logger.error('HOUSE_ANGLE_MISMATCH system=%s', system)
            raise HouseCalculationError(system, 'Los ángulos no corresponden a la carta original.')
    # Conserva los ángulos y los planetas originales sin llamar a swe.calc.
    return {**raw, 'cusps': updated['cusps'], 'house_system': system}
