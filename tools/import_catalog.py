"""Rebuild the local catalog from a pinned, independently cloned BuildCores OpenDB."""
import sys,json,pathlib,shutil,subprocess,tarfile,datetime,collections
root=pathlib.Path(__file__).resolve().parents[1];src=pathlib.Path(sys.argv[1]); dest=root/'configurator/public/data';dest.mkdir(parents=True,exist_ok=True)
sha=subprocess.check_output(['git','-C',str(src),'rev-parse','HEAD'],text=True).strip()
counts={}; allrows=[]; preferred={'CPU':'Ryzen 7 9800X3D','GPU':'GeForce RTX 4070','Motherboard':'B650 TOMAHAWK','RAM':'KF560C30BBK2-32','PCCase':'3500X','PSU':'RM850e','Storage':'990 PRO 2TB','CPUCooler':'Peerless Assassin 120','CaseFan':'ARCTIC P12'}; defaults={}
for folder in sorted((src/'open-db').iterdir()):
 if not folder.is_dir():continue
 rows=[]
 for file in sorted(folder.glob('*.json')):
  d=json.loads(file.read_text());meta=d.get('metadata',{}); spec={k:v for k,v in d.items() if k not in ['metadata','identifiers','general_product_information','opendb_id']}
  p={'id':d.get('opendb_id',file.stem),'category':folder.name,'name':meta.get('name',file.stem),'brand':meta.get('manufacturer',''),'spec':spec,'source':f'https://github.com/buildcores/buildcores-open-db/blob/{sha}/open-db/{folder.name}/{file.name}','manufacturer':d.get('general_product_information',{}).get('manufacturer_url'),'listings':d.get('identifiers',{}).get('retailer_listings',[])}
  rows.append(p)
  if folder.name in preferred and preferred[folder.name].lower() in (p['name']+' '+' '.join(meta.get('part_numbers',[]))).lower() and folder.name not in defaults:defaults[folder.name]=p
 counts[folder.name]=len(rows)
 if folder.name in preferred:
  rows.sort(key=lambda p:(p['id']!=defaults.get(folder.name,{}).get('id'),p['name']))
  (dest/(folder.name+'.json')).write_text(json.dumps(rows,separators=(',',':')))
  allrows.extend({'id':p['id'],'category':p['category'],'name':p['name'],'brand':p['brand']} for p in rows)
(dest/'index.json').write_text(json.dumps({'source':'BuildCores OpenDB','license':'ODC-By-1.0','commit':sha,'importedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'total':sum(counts.values()),'counts':counts,'configurable':len(allrows)},indent=2))
(dest/'defaults.json').write_text(json.dumps(defaults,separators=(',',':')))
(root/'data/upstream').mkdir(parents=True,exist_ok=True)
with tarfile.open(root/'data/upstream/buildcores-open-db.tar.gz','w:gz') as tar:
 for name in ['open-db','schemas','LICENSE.txt','README.md','docs']:tar.add(src/name,arcname='buildcores-open-db/'+name)
shutil.copy(src/'LICENSE.txt',root/'data/upstream/ODC-By-1.0.txt')
(root/'data/upstream/provenance.json').write_text((dest/'index.json').read_text())
print(json.dumps({'counts':counts,'defaults':{k:v['name'] for k,v in defaults.items()},'commit':sha},indent=2))
