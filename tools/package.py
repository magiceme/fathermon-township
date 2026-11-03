"""Package only explicit game/source artifacts; never include Git, caches or credentials."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil, hashlib, json
root=Path(__file__).resolve().parent.parent
release=root/'releases';release.mkdir(exist_ok=True)
standalone=release/'Fathermon_Township_v0.6.html'
shutil.copyfile(root/'dist/index.html',standalone)
shutil.copyfile(root/'dist/index.html',root/'index.html')
with ZipFile(release/'Fathermon_Township_v0.6_Netlify.zip','w',ZIP_DEFLATED,compresslevel=9) as z:
    z.write(root/'dist/index.html','index.html')
    z.writestr('_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n')
    z.writestr('netlify.toml','[build]\n  publish = "."\n')
with ZipFile(release/'Fathermon_Township_v0.6_Models.zip','w',ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted((release/'models').glob('*')):z.write(p,'models/'+p.name)
with ZipFile(release/'Fathermon_Township_v0.6_Source.zip','w',ZIP_DEFLATED,compresslevel=9) as z:
    for folder in ['src','tools','tests','docs']:
        for p in sorted((root/folder).rglob('*')):
            if p.is_file():z.write(p,p.relative_to(root))
    for file in ['README.md','package.json','package-lock.json','playwright.config.js','.gitignore']:z.write(root/file,file)
    for p in sorted((release/'models').glob('*')):z.write(p,'models/'+p.name)
    z.write(standalone,'dist/index.html')
files=[p for p in sorted(release.iterdir()) if p.is_file() and p.name!='SHA256SUMS.txt']
(release/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in files))
for p in files:
    if p.suffix=='.zip':
        with ZipFile(p) as z:
            assert z.testzip() is None
            assert not any(n.startswith(('/', '../')) for n in z.namelist())
    print(f'{p.name}: {p.stat().st_size:,} bytes')
