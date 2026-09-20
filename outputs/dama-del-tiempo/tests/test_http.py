import unittest
import threading
import json
from http.server import HTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from server import Handler


class HttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=HTTPServer(('127.0.0.1',0),Handler)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.url=f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join()

    def test_full_chart_request(self):
        data=dict(date='2000-01-01',time='12:00',timezone='Etc/UTC',latitude=51.4779,longitude=0)
        req=Request(self.url+'/api/chart',data=json.dumps(data).encode(),headers={'Content-Type':'application/json'})
        with urlopen(req) as response:
            result=json.load(response)
            self.assertEqual(len(result['results']['bodies']),9)
            self.assertEqual(len(result['results']['cusps']),12)
            self.assertEqual(response.headers['Cache-Control'],'no-store')

    def test_missing_fields_return_spanish_error(self):
        req=Request(self.url+'/api/chart',data=b'{}',headers={'Content-Type':'application/json'})
        with self.assertRaises(HTTPError) as ctx:urlopen(req)
        self.assertEqual(ctx.exception.code,400)
        self.assertIn('Faltan datos',json.load(ctx.exception)['error'])

    def test_cross_origin_rejected(self):
        req=Request(self.url+'/api/chart',data=b'{}',headers={'Content-Type':'application/json','Origin':'https://example.com'})
        with self.assertRaises(HTTPError) as ctx:urlopen(req)
        self.assertEqual(ctx.exception.code,403)

    def test_source_files_not_exposed_as_static(self):
        with self.assertRaises(HTTPError) as ctx:urlopen(self.url+'/../server.py')
        self.assertEqual(ctx.exception.code,404)

    def test_interface_assets(self):
        for path in ['/','/app.js','/wheel.js','/aspects.js','/glyphs.js','/style.css','/favicon.svg','/license','/api/house-systems','/angular.js','/aspect-ui.js','/dignities.js','/dignities-ui.js','/data/rulerships.json','/data/triplicities.json','/data/egyptian-terms.json','/data/faces.json']:
            with self.subTest(path=path),urlopen(self.url+path) as response:self.assertEqual(response.status,200)

    def test_house_change_and_polar_error_http(self):
        def post(path,data):
            return urlopen(Request(self.url+path,data=json.dumps(data).encode(),headers={'Content-Type':'application/json'}))
        with post('/api/chart',dict(date='2024-06-21',time='12:00',timezone='Etc/UTC',latitude=69.6492,longitude=18.9553,house_system='whole_sign')) as response:
            previous=json.load(response)
        with self.assertRaises(HTTPError) as ctx:
            post('/api/houses',{'chart':previous,'house_system':'placidus'})
        self.assertEqual(ctx.exception.code,422)
        error=json.load(ctx.exception);self.assertEqual(error['code'],'HOUSE_CALCULATION_FAILED')
        self.assertNotIn('results',error)
        with post('/api/houses',{'chart':previous,'house_system':'whole_sign'}) as response:
            restored=json.load(response)
        self.assertEqual(restored['astronomy']['bodies'],previous['astronomy']['bodies'])


if __name__=='__main__':unittest.main()
