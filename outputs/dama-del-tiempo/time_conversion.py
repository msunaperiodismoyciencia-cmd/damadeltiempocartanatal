"""Conversión civil independiente de las reglas astrológicas. AGPL-3.0-only."""
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, reset_tzpath
import tzdata

# Siempre usar la versión fijada, también en Linux: resultados reproducibles.
reset_tzpath(())


def local_to_utc(date: str, time: str, zone: str, fold=None):
    try:
        naive = datetime.fromisoformat(f'{date}T{time}')
        if naive.tzinfo is not None:
            raise ValueError()
        tz = ZoneInfo(zone)
    except (ValueError, ZoneInfoNotFoundError, TypeError):
        raise ValueError('Revisá la fecha, la hora y el identificador de zona IANA.')
    candidates = {}
    for f in (0, 1):
        local = naive.replace(tzinfo=tz, fold=f)
        utc = local.astimezone(timezone.utc)
        if utc.astimezone(tz).replace(tzinfo=None) == naive:
            candidates[utc] = local
    if not candidates:
        raise ValueError('Esta hora local no existió por un cambio de horario. Revisá el registro original.')
    if len(candidates) > 1:
        if fold not in (0, 1):
            raise ValueError('Hora repetida: elegí la primera o la segunda ocurrencia en las opciones horarias.')
        local = naive.replace(tzinfo=tz, fold=fold)
        utc = local.astimezone(timezone.utc)
    else:
        utc, local = next(iter(candidates.items()))
    return utc, {
        'local': local.isoformat(), 'utc': utc.isoformat(), 'zone': zone,
        'offset_seconds': int(local.utcoffset().total_seconds()),
        'dst_seconds': int(local.dst().total_seconds()), 'tzdata': tzdata.__version__,
    }
