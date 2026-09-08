import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1];assets=json.loads((root/'data/assets/manifest.json').read_text());linked=[]
for a in assets:
 f=root/'configurator/public/data'/f"{a['category']}.json";rows=json.loads(f.read_text())
 for p in rows:
  # Exact model phrase; avoid RTX 4070 SUPER and Ti variants.
  if a['match'].lower() in p['name'].replace('™','').lower():p['image']=a['file'];p['imageCredit']={'author':a['author'],'license':a['license'],'url':a['source']};linked.append(p['name'])
 f.write_text(json.dumps(rows,separators=(',',':')))
 defaults_path=root/'configurator/public/data/defaults.json';defaults=json.loads(defaults_path.read_text())
 for p in rows:
  if p['id']==defaults.get(a['category'],{}).get('id'):defaults[a['category']]=p
 defaults_path.write_text(json.dumps(defaults,separators=(',',':')))
print(linked)
