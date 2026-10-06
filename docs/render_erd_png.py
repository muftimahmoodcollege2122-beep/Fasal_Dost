import asyncio,sys,os
sys.path.insert(0,'docs')
import generate_erd as g
from playwright.async_api import async_playwright
S=sys.argv[1]
mer=open(f'{S}/mm/node_modules/mermaid/dist/mermaid.min.js').read()
MODS=[('Identity & Access','#1d6fe0','#dcebff',['User','Account','Organization','OrganizationMember']),
('Farmer & Farm','#17984f','#d9f5e4',['FarmerProfile','Farm','Crop','CropCycle']),
('Marketplace','#f07a12','#ffe8d1',['Listing','ListingImage','Offer']),
('Orders & Logistics','#7a3fe0','#eadcff',['Order','OrderItem','Shipment','DeliveryEvent','LogisticsProvider']),
('Inventory & Warehouse','#0e9fc2','#d3f3fb',['Warehouse','InventoryLot','StockMovement']),
('Finance & Settlements','#d92b2b','#ffdada',['WalletAccount','LedgerTransaction','LedgerEntry','Settlement','Payout']),
('Verification & Trust','#d19a00','#fff1bd',['Verification','Dispute','AuditLog']),
('Existing App Tables','#4b5b6e','#e3e9f0',['DiagnosticScan','MarketplaceListing','JobExecution']),
('Reference Tables','#7b8794','#eef1f4',['CropCategory','Unit','RoleRef','Country'])]
dia=g.diagram()
extra=[]
for i,(t,c,f,ns) in enumerate(MODS):
    extra.append(f'    classDef m{i} fill:{f},stroke:{c},stroke-width:5px,color:#0b1220')
    extra.append(f'    class {",".join(g.tbl[n] for n in ns)} m{i}')
dia+='\n'+'\n'.join(extra)
legend=''.join(f'<div class="lg"><span style="background:{f};border:4px solid {c}"></span>{t}</div>' for t,c,f,ns in MODS)
html=f'''<html><body style="margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif">
<div id="w" style="display:inline-block;padding:48px 56px;background:#fff">
<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:60px;margin-bottom:28px;border-bottom:6px solid #17984f;padding-bottom:18px">
<div><div style="font-size:64px;font-weight:800;color:#0b1220">Fasal Dost - Database ERD</div>
<div style="font-size:30px;color:#334155;margin-top:6px">PostgreSQL / Prisma - 34 tables - 34 primary keys - 38 foreign keys</div></div>
<div style="font-size:26px;color:#0b1220;line-height:1.5"><b>PK</b> primary key &nbsp; <b>FK</b> foreign key &nbsp; <b>UK</b> unique<br>Crow's foot lines: <b>||</b> one, <b>o{{</b> many</div></div>
<div style="display:flex;flex-wrap:wrap;gap:14px 36px;margin-bottom:30px;font-size:28px;font-weight:700;color:#0b1220">{legend}</div>
<div id="o"></div></div>
<style>.lg{{display:flex;align-items:center;gap:12px}}.lg span{{width:44px;height:30px;border-radius:5px;display:inline-block}}</style>
</body></html>'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':1800,'height':1200})
        await pg.set_content(html)
        await pg.add_script_tag(content=mer)
        svg=await pg.evaluate('''async (d)=>{mermaid.initialize({startOnLoad:false,theme:'base',maxTextSize:900000,er:{useMaxWidth:false,fontSize:20},
          themeVariables:{fontSize:'22px',fontFamily:'Arial, Helvetica, sans-serif',lineColor:'#1f2937',primaryTextColor:'#0b1220',
          attributeBackgroundColorOdd:'rgba(255,255,255,0.55)',attributeBackgroundColorEven:'rgba(255,255,255,0.0)',tertiaryColor:'#ffffff'}});
          const r=await mermaid.render('g',d);document.getElementById('o').innerHTML=r.svg;
          const s=document.querySelector('#o svg');
          const st=document.createElement('style');
          st.textContent='.relationshipLine{stroke:#1f2937 !important;stroke-width:3.5px !important}.relationshipLabel,.edgeLabel{fill:#0b1220 !important;color:#0b1220 !important}.edgeLabel .label rect,.edgeLabel rect{fill:#ffffff !important;opacity:1 !important}.edgeLabel p{background:#fff !important}';
          s.prepend(st);return s.outerHTML;}''',dia)
        el=await pg.query_selector('#w')
        bb=await el.bounding_box();print('size',bb['width'],bb['height'])
        sc=min(2.0,7900/max(bb['width'],bb['height']))
        await pg.close()
        pg=await b.new_page(viewport={'width':int(bb['width'])+10,'height':int(bb['height'])+10},device_scale_factor=sc)
        await pg.set_content(html)
        await pg.add_script_tag(content=mer)
        await pg.evaluate('''async ([d,svg])=>{document.getElementById('o').innerHTML=svg;}''',[dia,svg])
        st=await pg.evaluate("()=>1")
        await pg.evaluate('''()=>{const s=document.querySelector('#o svg');}''')
        el=await pg.query_selector('#w')
        await el.screenshot(path=f'{S}/out/fasal-dost-erd-color.png')
        open(f'{S}/out/fasal-dost-erd-color.svg','w').write(svg)
        print('scale',sc)
        await b.close()
asyncio.run(main())
