"""Servidor exclusivamente local, sin persistencia de cartas. AGPL-3.0-only."""
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlencode
from urllib.request import urlopen, Request
import json
import math
import mimetypes
import io
import zipfile
import webbrowser
import argparse
from datetime import datetime, timezone
from time_conversion import local_to_utc
from astronomy import calculate
from rules import present
from sect import solar_sect
from houses import HOUSE_SYSTEMS, DEFAULT_SYSTEM, system_info, replace_houses, HouseCalculationError

ROOT = Path(__file__).parent


def chart(data):
    try:
        lat, lon = float(data['latitude']), float(data['longitude'])
        threshold = float(data.get('station_threshold', .001))
        if not all(map(math.isfinite, (lat, lon, threshold))) or not 0 <= threshold <= .1:
            raise ValueError('Revisá las coordenadas y el umbral estacionario (0 a 0,1).')
        utc, timing = local_to_utc(data['date'], data['time'], data['timezone'], data.get('fold'))
        raw = calculate(utc, lat, lon, data.get('node', 'mean'), data.get('house_system', DEFAULT_SYSTEM))
        warnings = []
        if utc.year < 1970:
            warnings.append('Los datos horarios anteriores a 1970 pueden ser incompletos: verificá la hora legal histórica.')
        if utc > datetime.now(timezone.utc):
            warnings.append('Fecha futura: las reglas de horario legal y los parámetros temporales pueden cambiar.')
        return {'astronomy': raw, 'results': present(raw, threshold), 'time': timing,
                'location': {'latitude': lat, 'longitude': lon},
                'warnings': warnings, 'sect': solar_sect(raw, lat, lon)}
    except (KeyError, TypeError):
        raise ValueError('Faltan datos o su formato no es válido.')


def update_houses(data):
    """Reutiliza la respuesta astronómica recibida; no persiste ni recalcula planetas."""
    try:
        previous = data['chart']
        raw = previous['astronomy']
        if len(raw['bodies']) != 8:
            raise ValueError('Resultado planetario incompleto.')
        for body in raw['bodies']:
            if not all(math.isfinite(body[key]) for key in ('longitude', 'speed')):
                raise ValueError('Resultado planetario no válido.')
        location = previous['location']
        updated = replace_houses(raw, float(location['latitude']), float(location['longitude']), data['house_system'])
        return {**previous, 'astronomy': updated,
                'results': present(updated, previous['results']['station_threshold'])}
    except (KeyError, TypeError):
        raise ValueError('Se necesita una carta calculada completa para cambiar sus casas.')


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # Ni nombres, ni fechas, ni búsquedas en registros.

    def send(self, status, data, content_type='application/json; charset=utf-8'):
        if not isinstance(data, bytes):
            data = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        frame_policy = "'self'" if getattr(self.server, 'test_ui', False) else "'none'"
        self.send_header('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' blob:; object-src 'none'; frame-ancestors " + frame_policy)
        self.end_headers()
        self.wfile.write(data)

    def valid_host(self):
        return self.headers.get('Host') in (f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}')

    def do_GET(self):
        if not self.valid_host():
            return self.send(403, {'error': 'Acceso permitido solamente desde localhost.'})
        url = urlparse(self.path)
        if getattr(self.server, 'test_ui', False) and url.path in ('/tests/browser.html', '/tests/browser.js', '/tests/browser.css'):
            file = ROOT / url.path.lstrip('/')
            mime = {'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css'}[file.suffix[1:]]
            return self.send(200, file.read_bytes(), mime+'; charset=utf-8')
        if url.path == '/api/house-systems':
            return self.send(200, {'default': DEFAULT_SYSTEM, 'systems': [system_info(key) for key in HOUSE_SYSTEMS]})
        if url.path == '/api/places':
            name = parse_qs(url.query).get('q', [''])[0].strip()
            if not 2 <= len(name) <= 120:
                return self.send(400, {'error': 'Ingresá entre 2 y 120 caracteres para buscar.'})
            try:
                endpoint = 'https://geocoding-api.open-meteo.com/v1/search?' + urlencode({'name': name, 'count': 8, 'language': 'es'})
                with urlopen(Request(endpoint, headers={'User-Agent': 'DamaDelTiempo-local/0.1'}), timeout=12) as response:
                    data = json.load(response)
                return self.send(200, {'results': data.get('results', [])})
            except Exception:
                return self.send(503, {'error': 'No se pudo consultar localidades. Podés ingresar coordenadas y zona IANA manualmente.'})
        if url.path == '/source.zip':
            stream = io.BytesIO()
            with zipfile.ZipFile(stream, 'w', zipfile.ZIP_DEFLATED) as archive:
                for path in ROOT.rglob('*'):
                    if path.is_file() and not any(p in ('.venv', 'node_modules', '__pycache__', '.git') for p in path.relative_to(ROOT).parts):
                        archive.write(path, path.relative_to(ROOT))
            return self.send(200, stream.getvalue(), 'application/zip')
        data_files = {'rulerships.json', 'triplicities.json', 'egyptian-terms.json', 'faces.json', 'lots-catalog.json', 'lots-sources.json'}
        if url.path.startswith('/data/') and url.path[6:] in data_files:
            return self.send(200, (ROOT / 'web' / 'data' / url.path[6:]).read_bytes(), 'application/json; charset=utf-8')
        allowed = {'/angular.js': 'angular.js', '/aspect-ui.js': 'aspect-ui.js', '/dignities.js': 'dignities.js', '/dignities-ui.js': 'dignities-ui.js', '/': 'index.html', '/app.js': 'app.js', '/wheel.js': 'wheel.js', '/aspects.js': 'aspects.js', '/glyphs.js': 'glyphs.js', '/style.css': 'style.css', '/favicon.svg': 'favicon.svg'}
        allowed.update({f'/{name}.js': f'{name}.js' for name in ('lots', 'lots-ui', 'lots-wheel', 'profections', 'profections-ui', 'profections-wheel', 'presentation')})
        if url.path in allowed:
            file = ROOT / 'web' / allowed[url.path]
            if file.is_file():
                mime = {'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css', 'svg': 'image/svg+xml'}[file.suffix[1:]]
                return self.send(200, file.read_bytes(), mime + '; charset=utf-8')
        if url.path == '/license':
            return self.send(200, (ROOT / 'LICENSE').read_bytes(), 'text/plain; charset=utf-8')
        self.send(404, {'error': 'Página no encontrada.'})

    def do_POST(self):
        origin = self.headers.get('Origin')
        if not self.valid_host() or (origin and origin not in (f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}')):
            return self.send(403, {'error': 'Origen no permitido.'})
        if self.path not in ('/api/chart', '/api/houses'):
            return self.send(404, {'error': 'Ruta no encontrada.'})
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 50000:
                raise ValueError('Tamaño de solicitud inválido.')
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                raise ValueError('Se requiere JSON.')
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError('Formato de solicitud inválido.')
            return self.send(200, chart(data) if self.path == '/api/chart' else update_houses(data))
        except HouseCalculationError as exc:
            return self.send(422, {'error': str(exc), 'code': exc.code, 'system': exc.system})
        except (ValueError, OverflowError) as exc:
            return self.send(400, {'error': str(exc)})
        except Exception:
            return self.send(500, {'error': 'El motor no pudo completar el cálculo. Revisá la instalación.'})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Dama del Tiempo: uso local')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--open', action='store_true')
    parser.add_argument('--test-ui', action='store_true', help='Habilita el banco de pruebas de navegador, solo local.')
    args = parser.parse_args()
    server = HTTPServer(('127.0.0.1', args.port), Handler)
    server.test_ui = args.test_ui
    url = f'http://127.0.0.1:{args.port}'
    print(f'Dama del Tiempo disponible en {url}', flush=True)
    if args.open:
        webbrowser.open(url)
    server.serve_forever()
