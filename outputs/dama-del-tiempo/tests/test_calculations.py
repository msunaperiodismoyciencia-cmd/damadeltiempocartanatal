import unittest
from unittest.mock import patch
from datetime import datetime, timezone
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import chart
from time_conversion import local_to_utc
from rules import whole_sign_house, quadrant_house, motion, position


class AstronomyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.references = json.loads((Path(__file__).parent/'swetest-reference.json').read_text())

    def test_planets_against_official_swetest(self):
        for case in self.references['cases']:
            result = chart(case['input'])['astronomy']
            for actual, expected in zip(result['bodies'], case['bodies']):
                with self.subTest(case=case['name'], body=actual['name']):
                    self.assertAlmostEqual(actual['longitude'], expected[0], delta=0.000001)
                    self.assertAlmostEqual(actual['speed'], expected[1], delta=0.000001)

    def test_alcabitius_against_official_swetest(self):
        for case in self.references['cases']:
            actual = chart(case['input'])['astronomy']
            for index, expected in enumerate(case['cusps']):
                with self.subTest(case=case['name'], house=index+1):
                    self.assertAlmostEqual(actual['cusps'][index], expected, delta=0.000001)

    def test_angles_against_official_swetest(self):
        for case in self.references['cases']:
            actual = chart(case['input'])['astronomy']
            self.assertAlmostEqual(actual['ascendant'], case['cusps'][0], delta=0.000001)
            self.assertAlmostEqual(actual['midheaven'], case['cusps'][9], delta=0.000001)

    def test_retrograde_saturn_and_direct_mercury(self):
        bodies=chart(self.references['cases'][0]['input'])['results']['bodies']
        self.assertEqual(bodies[6]['motion'], 'Retrógrado')
        self.assertEqual(bodies[2]['motion'], 'Directo')

    def test_engine_flag_is_swiss(self):
        import swisseph as swe
        for b in chart(self.references['cases'][0]['input'])['astronomy']['bodies'][:7]:
            self.assertTrue(b['flags'] & swe.FLG_SWIEPH)
            self.assertFalse(b['flags'] & swe.FLG_MOSEPH)

    def test_missing_files_fail_closed(self):
        with patch('astronomy.Path.is_file', return_value=False):
            with self.assertRaisesRegex(ValueError, 'Faltan'):
                chart(self.references['cases'][0]['input'])

    def test_engine_fallback_rejected(self):
        with patch('astronomy.swe.calc', return_value=((1,0,1,1,0,0),4)):
            with self.assertRaisesRegex(ValueError, 'archivos previstos'):
                chart(self.references['cases'][0]['input'])

    def test_true_node_and_south(self):
        data=dict(self.references['cases'][0]['input'],node='true')
        result=chart(data)['results']['bodies']
        self.assertAlmostEqual((result[-1]['longitude']-result[-2]['longitude'])%360,180)
        self.assertNotAlmostEqual(result[-2]['longitude'],self.references['cases'][0]['bodies'][-1][0],places=2)

    def test_invalid_coordinates_threshold_and_date(self):
        for change in [{'latitude':90},{'longitude':181},{'latitude':float('nan')},{'station_threshold':-1},{'date':'1700-01-01'},{'date':'2023-02-29'}]:
            with self.subTest(change=change),self.assertRaises(ValueError):
                chart(dict(self.references['cases'][0]['input'],**change))

    def test_local_and_utc_same_instant(self):
        data=self.references['cases'][1]['input']
        a=chart(data)
        b=chart(dict(data,time='12:30:00',timezone='America/Argentina/Buenos_Aires'))
        self.assertEqual(a['astronomy'],b['astronomy'])


class TimeTests(unittest.TestCase):
    def utc(self,date,time,zone,fold=None):
        return local_to_utc(date,time,zone,fold)[0].isoformat()

    def test_buenos_aires_summer_time_2008(self):
        self.assertEqual(self.utc('2008-01-15','12:00','America/Argentina/Buenos_Aires'),'2008-01-15T14:00:00+00:00')

    def test_buenos_aires_no_summer_time_2010(self):
        self.assertEqual(self.utc('2010-01-15','12:00','America/Argentina/Buenos_Aires'),'2010-01-15T15:00:00+00:00')

    def test_nonexistent_spring_time(self):
        with self.assertRaisesRegex(ValueError,'no existió'):
            self.utc('2024-03-10','02:30','America/New_York')

    def test_ambiguous_time_requires_choice(self):
        with self.assertRaisesRegex(ValueError,'Hora repetida'):
            self.utc('2024-11-03','01:30','America/New_York')

    def test_ambiguous_time_first_and_second(self):
        self.assertEqual(self.utc('2024-11-03','01:30','America/New_York',0),'2024-11-03T05:30:00+00:00')
        self.assertEqual(self.utc('2024-11-03','01:30','America/New_York',1),'2024-11-03T06:30:00+00:00')

    def test_year_rollover(self):
        self.assertEqual(self.utc('2000-01-01','00:30','Asia/Tokyo'),'1999-12-31T15:30:00+00:00')

    def test_month_and_leap_day_rollover(self):
        self.assertEqual(self.utc('2024-03-01','00:15','Asia/Tokyo'),'2024-02-29T15:15:00+00:00')

    def test_next_day_rollover(self):
        self.assertEqual(self.utc('2000-01-31','23:45','America/Argentina/Buenos_Aires'),'2000-02-01T02:45:00+00:00')

    def test_historical_offset_with_seconds(self):
        self.assertEqual(self.utc('1900-01-01','12:00','America/Argentina/Buenos_Aires'),'1900-01-01T16:16:48+00:00')

    def test_half_hour_offset(self):
        self.assertEqual(self.utc('2024-01-01','12:00','Asia/Kolkata'),'2024-01-01T06:30:00+00:00')

    def test_bad_zone_and_offset_input(self):
        for date,time,zone in [('2000-01-01','12:00','No/Existe'),('2000-01-01','12:00+03:00','Etc/UTC')]:
            with self.assertRaises(ValueError):self.utc(date,time,zone)


class RulesTests(unittest.TestCase):
    def test_whole_sign_boundary_and_wrap(self):
        self.assertEqual(whole_sign_house(29.999, 29.9),1)
        self.assertEqual(whole_sign_house(30, 29.9),2)
        self.assertEqual(whole_sign_house(0, 359.9),2)
        self.assertEqual(whole_sign_house(359.999, 0),12)

    def test_all_whole_sign_houses(self):
        for asc_sign in range(12):
            for n in range(12):
                self.assertEqual(whole_sign_house((asc_sign*30+n*30)%360,asc_sign*30+12),n+1)

    def test_alcabitius_interval_boundaries(self):
        cusps=[(350+i*30)%360 for i in range(12)]
        self.assertEqual(quadrant_house(350,cusps),1)
        self.assertEqual(quadrant_house(0,cusps),1)
        self.assertEqual(quadrant_house(20,cusps),2)
        self.assertEqual(quadrant_house(349.999,cusps),12)

    def test_stationary_threshold(self):
        for v in [-.001,0,.001]:self.assertEqual(motion(v,.001),'Estacionario')
        self.assertEqual(motion(-.00101,.001),'Retrógrado')
        self.assertEqual(motion(.00101,.001),'Directo')

    def test_minute_rounding_and_sign_carry(self):
        self.assertEqual(position(29+59.9/60),'Tauro 00° 00′')
        self.assertEqual(position(359.9999),'Aries 00° 00′')
        self.assertEqual(position(280.3689229),'Capricornio 10° 22′')


if __name__=='__main__':unittest.main()
