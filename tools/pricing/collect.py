"""Scheduled merchant-feed collector. No secrets or price history are stored in git.
Feed credentials and adapters are supplied by the operator after merchant access is granted.
All product matches are exact OpenDB UUIDs, never fuzzy names.
"""
import os,json,csv,io,urllib.request,urllib.parse,datetime,sys,time
from pathlib import Path
from identifiers import IdentifierIndex
MERCHANTS={'amazon':{'amazon.fr','amazon.de','amazon.co.uk','amazon.com'},'grosbill':{'grosbill.com'},'ldlc':{'ldlc.com'},'topachat':{'topachat.com'},'materielnet':{'materiel.net'}}
def now():return datetime.datetime.now(datetime.timezone.utc)
def normalize(row,cfg,known):
 def field(name,default=None):return row.get(cfg.get('fields',{}).get(name,name),default)
 pid=str(field('part_id','')); merchant=cfg['merchant']; country=str(field('country',cfg.get('country','fr')));currency=str(field('currency',cfg.get('currency','EUR')))
 if pid not in known:raise ValueError('Unknown exact product ID')
 url=str(field('url',''));u=urllib.parse.urlsplit(url)
 if u.scheme!='https' or u.username or u.password or (u.hostname or '').removeprefix('www.') not in MERCHANTS[merchant]:raise ValueError('Merchant URL rejected')
 def price(v):
  if isinstance(v,bool):raise ValueError('Boolean price')
  x=float(str(v).replace('\u202f','').replace(' ','').replace(',','.'))
  if not 0<=x<=100000:raise ValueError('Price range')
  return x
 amount=price(field('amount'));shipping=field('shipping');shipping=None if shipping in [None,''] else price(shipping)
 if amount<=0:raise ValueError('Invalid price')
 value=field('in_stock');stock=str(value).lower() in ['true','1','in_stock','in stock','en stock']
 at=str(field('observed_at',''));date=datetime.datetime.fromisoformat(at.replace('Z','+00:00'))
 if date.tzinfo is None or abs((now()-date).total_seconds())>86400:raise ValueError('Missing or stale observation timestamp')
 exp=date+datetime.timedelta(seconds=min(int(cfg.get('ttl_seconds',3600)),86400))
 if exp<=now():raise ValueError('Expired feed observation')
 return dict(part_id=pid,merchant=merchant,country=country,currency=currency,amount=amount,shipping=shipping,in_stock=stock,url=url,observed_at=date.isoformat().replace('+00:00','Z'),expires_at=exp.isoformat().replace('+00:00','Z'),history_allowed=cfg.get('history_allowed',False))
def fetch(url,headers=None):
 if urllib.parse.urlsplit(url).scheme!='https':raise ValueError('HTTPS required')
 req=urllib.request.Request(url,headers=headers or {})
 with urllib.request.urlopen(req,timeout=30) as r:
  data=r.read(25000001)
  if len(data)>25000000:raise ValueError('Feed exceeds 25 MB')
  return data.decode('utf-8-sig')
def main():
 raw_config=os.environ.get('RIGUNO_FEEDS','').strip()
 try:
  config=json.loads(raw_config or '[]')
 except json.JSONDecodeError:
  print('Merchant feed configuration is not valid JSON.',file=sys.stderr);sys.exit(1)
 if not isinstance(config,list):
  print('Merchant feed configuration must be an array.',file=sys.stderr);sys.exit(1)
 if not config:print('No merchant feed configured. Nothing collected.');return
 root=Path(__file__).resolve().parents[2];known={p['id'] for f in (root/'configurator/public/data').glob('*.json') if f.stem not in ['index','defaults'] for p in json.loads(f.read_text())}
 index=IdentifierIndex.from_archive(root/'data/upstream/buildcores-open-db.tar.gz',known)
 total=0;failures=0
 for cfg in config:
  merchant=cfg.get('merchant')
  if merchant not in MERCHANTS:raise ValueError('Unsupported merchant')
  try:
   text=fetch(cfg['url'],{'Authorization':'Bearer '+cfg['token']} if cfg.get('token') else None)
   rows=list(csv.DictReader(io.StringIO(text),delimiter=cfg.get('delimiter',','))) if cfg.get('format')=='csv' else json.loads(text)
   if cfg.get('root'):rows=rows[cfg['root']]
   valid=[]; rejected=0
   for row in rows:
    try:
     mapped=dict(row);mapped[cfg.get('fields',{}).get('part_id','part_id')]=index.resolve(row,cfg,known)
     valid.append(normalize(mapped,cfg,known))
    except (ValueError,TypeError,KeyError):rejected+=1
   for start in range(0,len(valid),100):
    batch=valid[start:start+100]; endpoint=os.environ['RIGUNO_INGEST_URL']
    if urllib.parse.urlsplit(endpoint).scheme!='https':raise ValueError('HTTPS required')
    req=urllib.request.Request(endpoint,data=json.dumps(batch).encode(),headers={'Content-Type':'application/json','Authorization':'Bearer '+os.environ['RIGUNO_INGEST_TOKEN']},method='POST')
    with urllib.request.urlopen(req,timeout=45) as r:
     if r.status!=200:raise ValueError('Ingest failed')
    total+=len(batch)
   print(f'{merchant}: {len(valid)} observations accepted, {rejected} rejected')
  except Exception:
   # Do not log URLs, authorization headers, response bodies or credential-bearing exceptions.
   print(f'{merchant}: collection failed; existing offers will expire normally',file=sys.stderr);failures+=1
 print(f'Total: {total} observations, {failures} failed providers')
 if failures:sys.exit(1)
if __name__=='__main__':main()
