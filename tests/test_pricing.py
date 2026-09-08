import unittest,sys,pathlib,datetime,sqlite3
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools/pricing'))
from collect import normalize
class Pipeline(unittest.TestCase):
 def setUp(self):
  self.id='00000000-0000-4000-8000-000000000001';self.cfg={'merchant':'ldlc'};self.row={'part_id':self.id,'amount':'100,50','shipping':'4,90','in_stock':'true','url':'https://www.ldlc.com/fiche/PB00000001.html','observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 def test_total_and_history_default(self):
  o=normalize(self.row,self.cfg,{self.id});self.assertEqual(o['amount']+o['shipping'],105.4);self.assertFalse(o['history_allowed'])
 def test_stale(self):
  self.row['observed_at']='2020-01-01T00:00:00Z'
  with self.assertRaises(ValueError):normalize(self.row,self.cfg,{self.id})
 def test_unmatched_product(self):
  with self.assertRaises(ValueError):normalize(self.row,self.cfg,set())
 def test_malicious_url(self):
  self.row['url']='https://ldlc.com.evil.test/x'
  with self.assertRaises(ValueError):normalize(self.row,self.cfg,{self.id})
 def test_unknown_shipping(self):
  del self.row['shipping'];self.assertIsNone(normalize(self.row,self.cfg,{self.id})['shipping'])
 def test_schema_privacy_and_cascade(self):
  db=sqlite3.connect(':memory:');db.executescript((pathlib.Path(__file__).resolve().parents[1]/'configurator/migrations/0001_riguno.sql').read_text());db.execute('insert into profiles values (?,?)',('owner','{}'));db.execute('insert into builds(id,owner_id,name,parts) values(?,?,?,?)',('id','owner','private','{}'));self.assertEqual(db.execute('select count(*) from builds where public=1').fetchone()[0],0);db.execute('delete from builds where id=? and owner_id=?',('id','attacker'));self.assertEqual(db.execute('select count(*) from builds').fetchone()[0],1);db.execute('delete from profiles where id=?',('owner',));self.assertEqual(db.execute('select count(*) from builds').fetchone()[0],0)
if __name__=='__main__':unittest.main()
