import json
import unittest
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch
import swisseph as swe
from houses import HOUSE_SYSTEMS, calculate_houses, HouseCalculationError
from server import chart, update_houses
from rules import quadrant_house


class HouseSystemsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.reference=json.loads((Path(__file__).parent/'houses-reference.json').read_text(encoding='utf-8'))

    def test_registry_codes(self):
        self.assertEqual({k:v['code'] for k,v in HOUSE_SYSTEMS.items()},dict(alcabitius='B',regiomontanus='R',placidus='P',whole_sign='W'))

    def test_three_charts_four_systems_against_swetest(self):
        for case in self.reference['cases']:
            for system,expected in case['systems'].items():
                with self.subTest(case=case['name'],system=system):
                    actual=chart(dict(case['input'],house_system=system))
                    self.assertEqual(len(actual['results']['cusps']),12)
                    for cusp,ref in zip(actual['results']['cusps'],expected['cusps']):
                        self.assertAlmostEqual(cusp['longitude'],ref,delta=1e-6)
                        self.assertEqual(cusp['house_system'],system)
                    self.assertAlmostEqual(actual['astronomy']['ascendant'],expected['ascendant'],delta=1e-6)
                    self.assertAlmostEqual(actual['astronomy']['midheaven'],expected['midheaven'],delta=1e-6)

    def test_switch_never_calls_planet_calculation(self):
        previous=chart(self.reference['cases'][0]['input']);original=deepcopy(previous)
        with patch('astronomy.swe.calc',side_effect=AssertionError('No debe recalcular planetas')):
            for system in HOUSE_SYSTEMS:
                updated=update_houses({'chart':previous,'house_system':system})
                self.assertEqual(updated['astronomy']['bodies'],original['astronomy']['bodies'])
                self.assertEqual(updated['astronomy']['ascendant'],original['astronomy']['ascendant'])
                self.assertEqual(updated['astronomy']['midheaven'],original['astronomy']['midheaven'])
                self.assertEqual(updated['results']['house_system']['id'],system)
        self.assertEqual(previous,original)

    def test_planet_occupancy_changes_and_is_identified(self):
        original=chart(self.reference['cases'][0]['input']);changed=False
        for system in HOUSE_SYSTEMS:
            result=update_houses({'chart':original,'house_system':system})
            for b,old in zip(result['results']['bodies'],original['results']['bodies']):
                self.assertEqual(b['house'],quadrant_house(b['longitude'],result['astronomy']['cusps']))
                self.assertEqual(b['house_system'],system)
                changed|=b['house']!=old['house']
        self.assertTrue(changed)

    def test_whole_sign_from_swiss_preserves_real_angles(self):
        data=chart(dict(self.reference['cases'][0]['input'],house_system='whole_sign'))
        raw=data['astronomy'];self.assertNotEqual(raw['ascendant'],raw['cusps'][0])
        self.assertNotEqual(raw['midheaven'],raw['cusps'][9])
        self.assertEqual(int(raw['ascendant']//30),int(raw['cusps'][0]//30))
        for lon in raw['cusps']:self.assertAlmostEqual(lon%30,0)
        for body in data['results']['bodies']:self.assertEqual(body['house'],body['whole_sign'])

    def test_crossing_house_twelve_and_one(self):
        cusps=[350]+[float((350+i*30)%360) for i in range(1,12)]
        self.assertEqual(quadrant_house(349.999,cusps),12)
        self.assertEqual(quadrant_house(350,cusps),1)
        self.assertEqual(quadrant_house(0,cusps),1)
        self.assertEqual(quadrant_house(20,cusps),2)

    def test_high_latitude_unequal_houses_are_not_equalized(self):
        for system in ('alcabitius','regiomontanus','placidus'):
            cusps=chart(dict(self.reference['cases'][2]['input'],house_system=system))['astronomy']['cusps']
            widths=[(cusps[(i+1)%12]-cusps[i])%360 for i in range(12)]
            self.assertGreater(max(widths)-min(widths),25)
            self.assertAlmostEqual(sum(widths),360)

    def test_polar_placidus_fails_without_fallback_then_whole_sign_succeeds(self):
        polar=dict(date='2024-06-21',time='12:00:00',timezone='Etc/UTC',latitude=69.6492,longitude=18.9553,house_system='whole_sign')
        previous=chart(polar)
        with self.assertLogs('dama.houses',level='ERROR') as log:
            with self.assertRaises(HouseCalculationError):update_houses({'chart':previous,'house_system':'placidus'})
        self.assertIn('HOUSE_CALCULATION_FAILED',log.output[0]);self.assertNotIn('69.6492',log.output[0])
        restored=update_houses({'chart':previous,'house_system':'whole_sign'})
        self.assertEqual(restored['astronomy']['cusps'],previous['astronomy']['cusps'])

    def test_invalid_cusps_fail_closed(self):
        for cusps in [tuple([0]*12),tuple([float('nan')]+list(range(11))),tuple(range(11)),tuple([400]+list(range(11)))]:
            with patch('houses.swe.houses_ex',return_value=(cusps,(10,280))):
                with self.assertLogs('dama.houses',level='ERROR'),self.assertRaises(HouseCalculationError):
                    calculate_houses(2451545,51,0,'regiomontanus')

    def test_unknown_system_rejected(self):
        with self.assertRaisesRegex(ValueError,'desconocido'):calculate_houses(2451545,51,0,'inventado')

    def test_changed_coordinates_do_not_corrupt_original_angles(self):
        previous=chart(self.reference['cases'][0]['input']);previous['location']['latitude']=20
        with self.assertLogs('dama.houses',level='ERROR'),self.assertRaises(HouseCalculationError):
            update_houses({'chart':previous,'house_system':'placidus'})


if __name__=='__main__':unittest.main()
