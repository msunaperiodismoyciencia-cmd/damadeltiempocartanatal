import unittest, copy
from datetime import datetime, timezone
from astronomy import calculate
from sect import solar_sect, sect_from_altitude
from server import chart, update_houses

class SectTests(unittest.TestCase):
    def test_exact_horizon(self):
        self.assertEqual(sect_from_altitude(0),'diurna')
        self.assertEqual(sect_from_altitude(-1e-12),'nocturna')
        with self.assertRaises(ValueError):sect_from_altitude(float('nan'))
    def test_actual_sun_and_preserved_positions(self):
        for hour,expected in [(0,'nocturna'),(12,'diurna')]:
            raw=calculate(datetime(2000,1,1,hour,tzinfo=timezone.utc),51.4779,0)
            before=copy.deepcopy(raw)
            self.assertEqual(solar_sect(raw,51.4779,0)['name'],expected)
            self.assertEqual(raw,before)
    def test_civil_clock_does_not_determine_sect(self):
        # Same displayed clock in two explicit zones means different instants.
        base=dict(date='2000-01-01',time='12:00',latitude=51.4779,longitude=0)
        self.assertEqual(chart({**base,'timezone':'Etc/UTC'})['sect']['name'],'diurna')
        self.assertEqual(chart({**base,'timezone':'Etc/GMT-12'})['sect']['name'],'nocturna')
    def test_polar_day_and_night(self):
        for month,expected in [(6,'diurna'),(12,'nocturna')]:
            raw=calculate(datetime(2024,month,21,12,tzinfo=timezone.utc),78,15,house_system='whole_sign')
            self.assertEqual(solar_sect(raw,78,15)['name'],expected)
    def test_house_system_does_not_change_sect(self):
        first=chart(dict(date='2000-01-01',time='12:00',latitude=51.4779,longitude=0,timezone='Etc/UTC'))
        for system in ['alcabitius','regiomontanus','placidus','whole_sign']:
            changed=update_houses({'chart':first,'house_system':system})
            self.assertEqual(changed['sect'],first['sect'])
            self.assertEqual(changed['astronomy']['bodies'],first['astronomy']['bodies'])
