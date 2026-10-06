"""Bold overview ERD (keys only) -> docs/fasal-dost-erd-overview.png. Run from repo root: python3 docs/render_erd_overview.py"""
import sys, html, asyncio
sys.path.insert(0, 'docs')
import generate_erd as g
from playwright.async_api import async_playwright
MODS = [('Identity & Access', '#1d6fe0', '#e4efff', ['User', 'Account', 'Organization', 'OrganizationMember']),
 ('Farmer & Farm', '#12994f', '#dff6e8', ['FarmerProfile', 'Farm', 'Crop', 'CropCycle']),
 ('Marketplace', '#f07a12', '#ffecd9', ['Listing', 'ListingImage', 'Offer']),
 ('Orders & Logistics', '#7a3fe0', '#eee3ff', ['Order', 'OrderItem', 'Shipment', 'DeliveryEvent', 'LogisticsProvider']),
 ('Inventory & Warehouse', '#0b9cc0', '#d7f4fb', ['Warehouse', 'InventoryLot', 'StockMovement']),
 ('Finance & Settlements', '#d92b2b', '#ffe0e0', ['WalletAccount', 'LedgerTransaction', 'LedgerEntry', 'Settlement', 'Payout']),
 ('Verification & Trust', '#c99000', '#fff3c4', ['Verification', 'Dispute', 'AuditLog']),
 ('Existing App Tables', '#44566b', '#e6ecf3', ['DiagnosticScan', 'MarketplaceListing', 'JobExecution']),
 ('Reference Tables', '#6b7785', '#eef1f4', ['CropCategory', 'Unit', 'RoleRef', 'Country'])]
modof = {n: i for i, (_, _, _, ns) in enumerate(MODS) for n in ns}
fkinfo = {}
for r in g.rels:
    fkinfo[(r['child'], r['fk'])] = r
def card(n):
    m = g.models[n]; i = modof[n]; col = MODS[i][1]; tint = MODS[i][2]
    rows = ''; shown = 0
    for f in m['fields']:
        if f['type'] in g.models: continue
        a = f['attrs']; isfk = (n, f['name']) in fkinfo; ispk = '@id' in a; isuk = '@unique' in a
        if not (isfk or ispk or isuk): continue
        shown += 1
        badges = ''
        if ispk: badges += '<b class="pk">PK</b>'
        if isfk: badges += '<b class="fk">FK</b>'
        if isuk and not ispk: badges += '<b class="uk">UK</b>'
        tgt = ''
        attr = ''
        if isfk:
            r = fkinfo[(n, f['name'])]; tgt = f'<span class="t">&rarr; {g.tbl[r["parent"]]}.{r["ref"]}</span>'
            attr = f' data-fk="{g.tbl[r["parent"]]}" data-opt="{int(r["opt"])}" data-one="{int(r["one"])}"'
        rows += f'<div class="row{" fkrow" if isfk else ""}"{attr}>{badges}<span class="c">{f["name"]}</span><span class="ty">{f["type"]}{"?" if f["opt"] else ""}</span>{tgt}</div>'
    total = sum(1 for f in m['fields'] if f['type'] not in g.models)
    more = total - shown
    foot = f'<div class="more">+ {more} other columns</div>' if more else ''
    return f'<div class="card" id="c_{g.tbl[n]}" style="--col:{col};--tint:{tint}"><div class="h">{g.tbl[n]}</div>{rows}{foot}</div>'
panels = ''
for t, c, f, ns in MODS:
    panels += f'<div class="panel" style="--col:{c};--tint:{f}"><div class="ph">{html.escape(t)}</div><div class="cards">{"".join(card(n) for n in ns)}</div></div>'
legend = ''.join(f'<span class="lg"><i style="background:{f};border:5px solid {c}"></i>{html.escape(t)}</span>' for t, c, f, ns in MODS)
PAGE = f'''<html><head><style>
*{{box-sizing:border-box}}body{{margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#0b1220}}
#w{{position:relative;display:inline-block;padding:50px 60px;width:3000px;background:#fff}}
.top{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:8px solid #12994f;padding-bottom:20px;margin-bottom:26px}}
.top h1{{font-size:78px;margin:0;font-weight:900}}.top p{{font-size:34px;margin:8px 0 0;color:#2b3a4d;font-weight:700}}
.key{{font-size:30px;line-height:1.6;font-weight:700}}
.lgs{{display:flex;flex-wrap:wrap;gap:14px 40px;font-size:30px;font-weight:800;margin-bottom:36px}}.lg{{display:flex;align-items:center;gap:12px}}.lg i{{width:56px;height:36px;border-radius:6px;display:inline-block}}
.grid{{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);gap:44px;align-items:start}}
.panel{{background:var(--tint);border:8px solid var(--col);border-radius:18px;padding:22px}}
.ph{{background:var(--col);color:#fff;font-size:42px;font-weight:900;padding:12px 20px;border-radius:8px;margin-bottom:22px}}
.cards{{display:flex;flex-wrap:wrap;gap:22px}}
.card{{background:#fff;border:5px solid var(--col);border-radius:10px;width:calc(50% - 11px);min-width:380px;flex:1 1 380px;overflow:hidden;box-shadow:0 6px 0 rgba(0,0,0,.12)}}
.h{{background:var(--col);color:#fff;font-size:34px;font-weight:900;padding:10px 16px}}
.row{{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 14px;font-size:28px;font-weight:700;border-top:3px solid #e3e8ee}}
.fkrow{{background:var(--tint)}}
.c{{font-weight:800}}.ty{{color:#4b5b6e;font-size:23px;font-weight:600;margin-left:auto}}.t{{flex-basis:100%;color:#0b1220;font-size:25px;font-weight:800;font-family:Consolas,Menlo,monospace}}
b{{font-size:21px;font-weight:900;padding:2px 8px;border-radius:6px;color:#fff}}.pk{{background:#d49a00}}.fk{{background:#0b1220}}.uk{{background:#6a2fd0}}
.more{{padding:8px 14px;font-size:24px;color:#4b5b6e;font-weight:700;background:#f4f6f9;border-top:3px solid #e3e8ee;font-style:italic}}
svg#l{{position:absolute;left:0;top:0;z-index:1;pointer-events:none}}
</style></head><body><div id="w">
<div class="top"><div><h1>Fasal Dost - Database ERD</h1><p>PostgreSQL / Prisma &nbsp;|&nbsp; {len(g.models)} tables &nbsp;|&nbsp; {len(g.models)} primary keys &nbsp;|&nbsp; {len(g.rels)} foreign keys &nbsp;|&nbsp; key columns shown, full column list in docs/erd.mmd</p></div>
<div class="key"><b class="pk">PK</b> primary key &nbsp; <b class="fk">FK</b> foreign key &nbsp; <b class="uk">UK</b> unique<br>Each FK row names the parent table it points to</div></div>
<div class="lgs">{legend}</div>
<div class="grid">{panels}</div></div>
<script>
function draw(){{return;const w=document.getElementById('w').getBoundingClientRect();const s=document.getElementById('l');
s.setAttribute('width',w.width);s.setAttribute('height',w.height);let out='';
document.querySelectorAll('.fkrow').forEach(r=>{{const t=document.getElementById('c_'+r.dataset.fk);if(!t)return;
const own=r.closest('.card');const a=r.getBoundingClientRect(),b=t.querySelector('.h').getBoundingClientRect(),oc=own.getBoundingClientRect(),tc=t.getBoundingClientRect();
const col=getComputedStyle(own).getPropertyValue('--col');
let x1,y1=a.top+a.height/2-w.top,x2,y2=b.top+b.height/2-w.top,c1,c2;
const ocx=oc.left+oc.width/2,tcx=tc.left+tc.width/2;
if(Math.abs(ocx-tcx)<oc.width*0.9){{x1=oc.right-w.left;x2=tc.right-w.left;c1=x1+90;c2=x2+90;}}
else if(tcx>ocx){{x1=oc.right-w.left;x2=tc.left-w.left;c1=x1+(x2-x1)/2;c2=x2-(x2-x1)/2;}}
else{{x1=oc.left-w.left;x2=tc.right-w.left;c1=x1-(x1-x2)/2;c2=x2+(x1-x2)/2;}}
out+=`<path d="M${{x1}},${{y1}} C${{c1}},${{y1}} ${{c2}},${{y2}} ${{x2}},${{y2}}" fill="none" stroke="${{col}}" stroke-width="7" stroke-opacity="0.85"/>`;
out+=`<circle cx="${{x1}}" cy="${{y1}}" r="11" fill="${{col}}" stroke="#fff" stroke-width="3"/><rect x="${{x2-9}}" y="${{y2-9}}" width="18" height="18" fill="#0b1220" stroke="#fff" stroke-width="3" transform="rotate(45 ${{x2}} ${{y2}})"/>`;}});
s.innerHTML=out;}}
draw();
</script></body></html>'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 3200, 'height': 2000})
        await pg.set_content(PAGE); await pg.wait_for_timeout(300); await pg.evaluate('draw()')
        el = await pg.query_selector('#w'); bb = await el.bounding_box(); print('css size', bb['width'], bb['height'])
        sc = min(2.0, 7900 / max(bb['width'], bb['height']))
        await pg.close(); pg = await b.new_page(viewport={'width': 3200, 'height': int(bb['height']) + 50}, device_scale_factor=sc)
        await pg.set_content(PAGE); await pg.wait_for_timeout(300); await pg.evaluate('draw()')
        el = await pg.query_selector('#w'); await el.screenshot(path='docs/fasal-dost-erd-overview.png'); print('scale', sc); await b.close()
asyncio.run(main())
