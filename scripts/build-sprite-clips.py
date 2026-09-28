"""Read atlas alpha to build rendering boundaries; original art is never changed."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
clips={};report=[]
for path in sorted((ROOT/'dist/assets/generated').glob('*.webp')):
 if not path.stem.startswith(('role-','sprite-','wardrobe-')): continue
 alpha=np.asarray(Image.open(path).getchannel('A'),dtype=float)
 h,w=alpha.shape; frame=w//3; seams=[]
 for center in (frame,frame*2):
  lo=center-100;hi=center+101
  cost=(alpha[:,lo:hi]/255)**2*100+np.abs(np.arange(lo,hi)-center)[None,:]*.0005
  dp=cost[0].copy();backs=np.zeros((h,hi-lo),dtype=np.int16)
  for y in range(1,h):
   options=np.stack([np.pad(dp,(3,3),constant_values=1e12)[3+d:3+d+len(dp)]+abs(d)*.03 for d in range(-3,4)])
   step=np.argmin(options,axis=0);backs[y]=step-3;dp=cost[y]+options[step,np.arange(len(dp))]
  seam=np.empty(h,dtype=int);x=int(np.argmin(dp))
  for y in range(h-1,-1,-1):seam[y]=x+lo;x+=int(backs[y,x])
  seams.append(seam)
 lefts=[np.zeros(h,dtype=int),seams[0],seams[1]];rights=[seams[0],seams[1],np.full(h,w,dtype=int)]
 # Every source row has an exact boundary. SVG clipping prevents adjacent-cut bleed.
 for i in range(3):
  points=[(int(lefts[i][y]),y) for y in range(h)]+[(int(rights[i][y]),y) for y in range(h-1,-1,-1)]
  simplified=[]
  for point in points:
   while len(simplified)>=2:
    a,b=simplified[-2:]
    if (b[0]-a[0])*(point[1]-b[1])!=(b[1]-a[1])*(point[0]-b[0]):break
    simplified.pop()
   simplified.append(point)
  clips[path.stem+'-'+str(i)]=' '.join(f'{x},{y}' for x,y in simplified)
 report.append({'atlas':path.name,'maxBoundaryShift':[int(np.max(np.abs(s-c))) for s,c in zip(seams,(frame,frame*2))],'opaqueSeamRows':[int(np.sum(alpha[np.arange(h),s]>32)) for s in seams]})
(ROOT/'dist/sprite-clips.js').write_text('window.SPRITE_CLIPS='+json.dumps(clips,separators=(',',':'))+';\n')
(ROOT/'references/sprite-boundary-audit.json').write_text(json.dumps(report,indent=2))
print('Generated SVG rendering boundaries for',len(clips),'cuts; source images unchanged')
