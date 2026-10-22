"""Bounded public crawl; reports metadata/schema/link evidence, never form data."""
import argparse, concurrent.futures, json, time, urllib.request, urllib.error
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from xml.etree import ElementTree

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.canonical=[]; self.robots=[]; self.links=[]; self.images=[]; self.h1=0; self.title=''; self.in_title=False; self.jsonld=[]; self.script=None
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
        if tag=='meta' and a.get('name') in ('robots','googlebot'):self.robots.append(a.get('content',''))
        if tag=='h1':self.h1+=1
        if tag=='a' and a.get('href'):self.links.append(a['href'])
        if tag=='img':self.images.append({k:a.get(k) for k in ('src','sizes','width','height','loading')})
        if tag=='title':self.in_title=True
        if tag=='script' and a.get('type')=='application/ld+json':self.script=''
    def handle_endtag(self,tag):
        if tag=='title':self.in_title=False
        if tag=='script' and self.script is not None:
            try:self.jsonld.append(json.loads(self.script))
            except ValueError:self.jsonld.append({'invalid':True})
            self.script=None
    def handle_data(self,data):
        if self.in_title:self.title+=data
        if self.script is not None:self.script+=data

def fetch(url):
    start=time.monotonic()
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'NOKS-Technical-Verification/1.0'}),timeout=30) as r:
            return r.status,r.url,r.read().decode('utf-8','replace'),round(time.monotonic()-start,3)
    except urllib.error.HTTPError as e:return e.code,url,'',round(time.monotonic()-start,3)
    except Exception as e:return type(e).__name__,url,'',round(time.monotonic()-start,3)

def inspect(url):
    status,final,html,elapsed=fetch(url); p=Page();p.feed(html)
    issues=[]
    if status!=200:issues.append('non-200')
    if final!=url:issues.append('redirect')
    if len(p.canonical)!=1 or p.canonical[0].rstrip('/')!=url.rstrip('/'):issues.append('canonical')
    if any('noindex' in v for v in p.robots):issues.append('noindex')
    if p.h1!=1:issues.append('h1')
    if not p.title:issues.append('title')
    if any(s.get('invalid') for s in p.jsonld):issues.append('jsonld')
    return dict(url=url,status=status,seconds=elapsed,title=p.title,canonical=p.canonical,robots=p.robots,h1=p.h1,issues=issues,links=p.links,images=p.images,schema=p.jsonld)

def _origin_key(url):
    """Return a normalized HTTP origin, rejecting URLs with credentials."""
    parsed=urlsplit(url)
    if parsed.scheme.lower() not in ('http','https') or not parsed.hostname or parsed.username or parsed.password:
        raise SystemExit(f'invalid HTTP origin or URL: {url}')
    try: port=parsed.port
    except ValueError: raise SystemExit(f'invalid port in URL: {url}')
    if port is None: port=443 if parsed.scheme.lower()=='https' else 80
    return parsed.scheme.lower(),parsed.hostname.lower(),port

def _same_origin_url(location, base_url, origin_key):
    url=urljoin(base_url,location.strip())
    if _origin_key(url)!=origin_key:
        raise SystemExit(f'sitemap location is outside requested origin: {location}')
    return url

def sitemap_urls(origin):
    """Read either a URL set or a sitemap index, including nested sitemaps."""
    origin=origin.rstrip('/')
    origin_key=_origin_key(origin)
    parsed_origin=urlsplit(origin)
    if parsed_origin.path or parsed_origin.query or parsed_origin.fragment:
        raise SystemExit(f'--origin must be an origin without a path: {origin}')
    pending=[origin+'/sitemap.xml']; seen_sitemaps=set(); urls=[]
    while pending:
        sitemap=pending.pop(0)
        if sitemap in seen_sitemaps:
            raise SystemExit(f'duplicate sitemap location: {sitemap}')
        seen_sitemaps.add(sitemap)
        status,final,xml,_=fetch(sitemap)
        if status!=200: raise SystemExit(f'sitemap status {status}: {sitemap}')
        if _origin_key(final)!=origin_key: raise SystemExit(f'sitemap redirected outside requested origin: {final}')
        root=ElementTree.fromstring(xml)
        local=root.tag.rsplit('}',1)[-1]
        if local=='sitemapindex':
            pending.extend(_same_origin_url(x.text,final,origin_key) for x in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc') if x.text)
        elif local=='urlset':
            urls.extend(_same_origin_url(x.text,final,origin_key) for x in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc') if x.text)
        else:
            raise SystemExit(f'unexpected sitemap root <{local}>: {final}')
    duplicate_urls=[url for url,count in Counter(urls).items() if count>1]
    if duplicate_urls:
        raise SystemExit(f'sitemap contains {sum(Counter(urls)[url]-1 for url in duplicate_urls)} duplicate page URL(s): {duplicate_urls[0]}')
    return urls, len(seen_sitemaps)

def main():
    a=argparse.ArgumentParser();a.add_argument('--origin',default='https://chemicals.noksindustrial.com');a.add_argument('--output',required=True);a.add_argument('--representative',action='store_true');args=a.parse_args()
    urls,sitemap_count=sitemap_urls(args.origin)
    if not urls:raise SystemExit('sitemap contains no page URLs')
    duplicate_urls=len(urls)-len(set(urls))
    targets=[args.origin+p for p in ['/','/products','/categories/water-treatment-chemicals','/products/caustic-soda-flakes','/products/methyl-ethyl-ketone-mek','/products/calcium-propionate','/industries/water-treatment','/knowledge','/quote']] if args.representative else urls
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(inspect,targets))
    titles={}
    for r in results:titles.setdefault(r['title'],[]).append(r['url'])
    output={'sitemap_files':sitemap_count,'sitemap_count':len(urls),'duplicate_sitemap_urls':duplicate_urls,'product_count':sum('/products/' in u for u in urls),'results':results,'duplicate_titles':{t:u for t,u in titles.items() if len(u)>1}}
    Path(args.output).write_text(json.dumps(output,indent=2))
    print(json.dumps({'sitemap_files':sitemap_count,'sitemap_count':len(urls),'duplicate_sitemap_urls':duplicate_urls,'products':output['product_count'],'checked':len(results),'failures':[{'url':r['url'],'status':r['status'],'issues':r['issues']} for r in results if r['issues']],'duplicate_titles':len(output['duplicate_titles'])},indent=2))
if __name__=='__main__':main()
