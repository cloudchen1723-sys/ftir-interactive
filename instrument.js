/* Parametric teaching assembly. Optical coordinates are shared with optics.js.
 * Supports, enclosure and electronics are generic functional illustrations. */
(function(){
  'use strict';
  window.FTIRInstrument=function(host,callbacks={}){
    if(!window.THREE||!THREE.OrbitControls||!window.FTIROptics)return null;
    const T=THREE,O=FTIROptics;let renderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch(_){return null;}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
    renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    const canvas=renderer.domElement;host.appendChild(canvas);canvas.tabIndex=0;
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label','FTIR 仪器模型。拖动空白旋转；点选部件；拖动移动镜改变光程差。键盘用户可用部件菜单和位移滑块。');
    const scene=new T.Scene(),assembly=new T.Group();scene.add(assembly);
    const camera=new T.PerspectiveCamera(36,1,.1,100);
    const controls=new T.OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=false;
    controls.minDistance=4;controls.maxDistance=60;controls.minPolarAngle=.08;controls.maxPolarAngle=1.38;
    const objects={},pickables=[],labels=[],geometries=new Set(),materials=new Set();
    const mat=(color,extra={})=>{const m=new T.MeshStandardMaterial({color,metalness:.65,roughness:.34,...extra});m.color.convertSRGBToLinear();if(extra.emissive)m.emissive.convertSRGBToLinear();materials.add(m);return m;};
    const metal=mat(0x87959c),dark=mat(0x17212d),black=mat(0x080f16,{metalness:.2,roughness:.55}),shellMat=mat(0x566878,{roughness:.32});
    const silver=mat(0xc3dce2,{metalness:.9,roughness:.17}),glass=mat(0x78d9e9,{metalness:.15,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false});
    const boardMat=mat(0x174348,{roughness:.65}),ceramic=mat(0xc88d52,{emissive:0x603418,metalness:.1});
    function mesh(geo,m,parent=assembly){geometries.add(geo);const a=new T.Mesh(geo,m);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
    function box(w,h,d,x,y,z,m=metal,parent=assembly){const a=mesh(new T.BoxGeometry(w,h,d),m,parent);a.position.set(x,y,z);return a;}
    function cylinder(r,len,pos,axis,m,parent=assembly){const a=mesh(new T.CylinderGeometry(r,r,len,40),m,parent);a.position.fromArray(pos);a.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...axis));return a;}
    function ring(r,t,pos,axis,m,parent){const a=mesh(new T.TorusGeometry(r,t,12,56),m,parent);a.position.fromArray(pos);a.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...axis));return a;}
    function plate(w,d,h,x,y,z,m,parent=assembly){
      const r=.16,s=new T.Shape(),l=-w/2,b=-d/2;
      s.moveTo(l+r,b);s.lineTo(l+w-r,b);s.quadraticCurveTo(l+w,b,l+w,b+r);s.lineTo(l+w,b+d-r);s.quadraticCurveTo(l+w,b+d,l+w-r,b+d);
      s.lineTo(l+r,b+d);s.quadraticCurveTo(l,b+d,l,b+d-r);s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);
      const a=mesh(new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:2,steps:1,curveSegments:8}),m,parent);
      a.rotation.x=-Math.PI/2;a.position.set(x,y,z);return a;
    }
    function group(name){const g=new T.Group();g.userData.part=name;assembly.add(g);objects[name]=g;return g;}
    function screws(g,w,d,y){for(const x of [-w/2+.14,w/2-.14])for(const z of [-d/2+.14,d/2-.14]){cylinder(.045,.045,[x,y,z],[0,1,0],silver,g);box(.055,.009,.01,x,y+.026,z,black,g);}}
    function optic(name,normal,m,r=.46){
      const p=O.parts[name],g=group(name);g.position.set(p[0],0,p[2]);
      plate(1.2,.95,.12,0,.25,0,dark,g);screws(g,1.2,.95,.41);
      cylinder(.10,.42,[0,.6,0],[0,1,0],metal,g);
      ring(r+.10,.11,[0,O.Y,0],normal,dark,g);
      ring(r+.10,.018,[0,O.Y,0],normal,silver,g);
      if(m)cylinder(r,.035,[0,O.Y,0],normal,m,g);
      g.children.forEach((o,i)=>{o.userData.detailLayer=i<10?0:(m&&i===12?2:1);});
      // Adjustment screws belong to the mount, not the optical surface.
      const n=new T.Vector3(...normal),u=new T.Vector3().crossVectors(n,new T.Vector3(0,1,0)).normalize();
      for(const angle of [0,2.1,4.2]){
        const p=u.clone().multiplyScalar(Math.cos(angle)*(r+.16)).add(new T.Vector3(0,Math.sin(angle)*(r+.16),0)).addScaledVector(n,-.15);
        p.y+=O.Y;cylinder(.055,.18,p.toArray(),normal,silver,g);
        p.addScaledVector(n,-.1);cylinder(.085,.06,p.toArray(),normal,black,g);
      }
      g.children.forEach((o,i)=>{if(i>=(m?13:12))o.userData.detailLayer=1;});
      // Retaining lip is a mount, not a separately removable optical coating.
      const lip=ring(r+.025,.024,new T.Vector3(0,O.Y,0).addScaledVector(n,.06).toArray(),normal,silver,g);
      lip.userData.detailLayer=1;
      for(const sign of [-1,1])cylinder(.055,.12,[sign*.4,.76,.1],[0,1,0],silver,g);
      return g;
    }
    scene.add(new T.HemisphereLight(0xccedff,0x101420,1.0));
    const key=new T.DirectionalLight(0xd9f2ff,2.1);key.position.set(-4,10,-6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
    Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.5,far:30});key.shadow.bias=-.001;scene.add(key);
    const rim=new T.DirectionalLight(0x6ddbcf,1.6);rim.position.set(5,5,4);scene.add(rim);
    const warm=new T.DirectionalLight(0xf9d4a6,.7);warm.position.set(-6,3,3);scene.add(warm);
    plate(10,10,.24,0,-.18,-.5,dark);plate(9.6,9.6,.09,0,.1,-.5,mat(0x38434b));
    for(const x of [-4.05,4.05])for(const z of [-4.4,3.5])cylinder(.36,.28,[x,-.35,z],[0,1,0],black);
    // Optical-bench mounting holes: sparse, subordinate to the functional components.
    for(let x=-4;x<=4;x+=1)for(let z=-4;z<=3;z+=1)cylinder(.022,.008,[x,.25,z],[0,1,0],black);
    const shadowMaterial=new T.ShadowMaterial({opacity:.25});materials.add(shadowMaterial);
    const floor=mesh(new T.PlaneGeometry(70,70),shadowMaterial,scene);floor.castShadow=false;
    floor.rotation.x=-Math.PI/2;floor.position.y=-.52;
    const shell=group('housing');
    plate(9.9,9.9,.17,0,2.08,-.5,shellMat,shell);
    box(9.8,1.85,.13,0,1.05,4.32,shellMat,shell);
    box(.13,1.85,9.7,-4.83,1.05,-.5,shellMat,shell);box(.13,1.85,9.7,4.83,1.05,-.5,shellMat,shell);
    box(9.8,1.65,.14,0,.95,-5.3,shellMat,shell);
    for(let i=0;i<12;i++)box(.032,.46,.025,-3.8+i*.14,1.1,-5.38,black,shell);
    box(1.2,.17,.025,3.05,1.13,-5.39,black,shell);box(.08,.035,.015,3.45,1.14,-5.41,mat(0x6cf4cf,{emissive:0x45aa88}),shell);
    shell.visible=false;
    // Independent sample access hatch and service seams; not a commercial CAD replica.
    plate(2.5,2.5,.06,0,2.3,-2.15,dark,shell);
    box(.8,.07,.13,0,2.39,-3.05,metal,shell);
    for(const x of [-3.8,3.8])for(const z of [-4.5,3.4])cylinder(.05,.015,[x,2.31,z],[0,1,0],black,shell);
    const source=group('source');source.position.set(-3.7,0,0);
    plate(1.3,1.15,.12,0,.25,0,dark,source);
    cylinder(.48,1.05,[-.15,O.Y,0],[1,0,0],dark,source);
    for(let i=0;i<7;i++)cylinder(.53,.025,[-.6+i*.11,O.Y,0],[1,0,0],metal,source);
    cylinder(.30,.03,[.4,O.Y,0],[1,0,0],ceramic,source);
    ring(.37,.05,[.41,O.Y,0],[1,0,0],silver,source);
    optic('collimator',[1,0,0],null,.32);
    optic('splitter',O.bsNormal,glass,.53);
    optic('fixed',[0,0,-1],silver,.46);
    const moving=optic('moving',[-1,0,0],silver,.46);
    const railGroup=new T.Group();assembly.add(railGroup);
    for(const z of [-.58,.58]){cylinder(.075,2.45,[3,.4,z],[1,0,0],silver,railGroup);box(.2,.3,.24,1.8,.34,z,dark,railGroup);box(.2,.3,.24,4.2,.34,z,dark,railGroup);}
    // Carriage travels as one object, including mirror mount and optical surface.
    box(1.1,.17,1.42,0,.38,0,metal,moving);
    cylinder(.23,.4,[4.38,.47,0],[1,0,0],dark);
    for(const z of [-.58,.58])box(.6,.25,.25,0,.42,z,black,moving);
    cylinder(.08,1.2,[3.8,.47,0],[1,0,0],silver,railGroup);
    for(let i=0;i<20;i++)box(.018,.008,i%5===0?.15:.07,2+i*.105,.27,-.86,silver,railGroup);
    const sample=group('sample');sample.position.set(0,0,-2.15);
    plate(1.65,1.35,.1,0,.25,0,dark,sample);
    for(const x of [-.63,.63])box(.10,1.5,1.0,x,1.05,0,metal,sample);
    box(1.36,.10,.15,0,1.75,-.48,metal,sample);box(1.36,.10,.15,0,1.75,.48,metal,sample);
    const sampleInsert=new T.Group();sample.add(sampleInsert);
    ring(.37,.06,[0,O.Y,0],[0,0,1],silver,sampleInsert);
    const film=cylinder(.31,.025,[0,O.Y,0],[0,0,1],mat(0xe6a975,{transparent:true,opacity:.55,side:T.DoubleSide}),sampleInsert);
    box(.14,.35,.12,.48,.7,0,metal,sampleInsert);
    box(.46,.10,.13,0,1.75,0,black,sampleInsert);
    const compartment=new T.Group();sample.add(compartment);
    // Cutaway chamber: front/back apertures remain physically open around the beam.
    for(const z of [-.75,.75]){
      for(const x of [-.78,.78])box(.34,1.65,.09,x,1.05,z,dark,compartment);
      box(1.9,.30,.09,0,.38,z,dark,compartment);box(1.9,.22,.09,0,1.98,z,dark,compartment);
      ring(.49,.065,[0,O.Y,z],[0,0,1],metal,compartment);
      ring(.42,.025,[0,O.Y,z],[0,0,1],black,compartment);
      cylinder(.40,.015,[0,O.Y,z],[0,0,1],glass,compartment);
    }
    box(.10,1.8,1.6,.97,1.1,0,dark,compartment);
    optic('collector',[0,0,1],null,.30);
    const detector=group('detector');detector.position.set(0,0,-4.1);
    plate(1.35,1.2,.13,0,.25,0,dark,detector);
    cylinder(.48,.8,[0,O.Y,-.1],[0,0,1],metal,detector);
    ring(.34,.075,[0,O.Y,.31],[0,0,1],black,detector);
    cylinder(.25,.025,[0,O.Y,.32],[0,0,1],mat(0x274757,{metalness:.3,roughness:.1}),detector);
    for(let i=0;i<5;i++)ring(.49,.024,[0,O.Y,-.38+i*.11],[0,0,1],dark,detector);
    cylinder(.13,.18,[.47,.95,-.22],[1,0,0],black,detector);
    const laser=group('laser');laser.position.set(-3.35,0,2.35);
    plate(1.7,.85,.1,0,.25,0,dark,laser);cylinder(.21,1.4,[0,.7,0],[1,0,0],mat(0x7b4a49),laser);
    ring(.18,.035,[.72,.7,0],[1,0,0],metal,laser);
    const electronics=group('electronics');electronics.position.set(2.75,0,-3.35);
    plate(2,1.7,.07,0,.32,0,boardMat,electronics);
    box(.7,.15,.65,0,.47,0,black,electronics);
    for(let i=0;i<8;i++){box(.025,.025,.15,-.29+i*.083,.43,.42,silver,electronics);box(.025,.025,.15,-.29+i*.083,.43,-.42,silver,electronics);}
    for(let i=0;i<4;i++)cylinder(.075,.22,[.7,.49,-.5+i*.32],[0,1,0],dark,electronics);
    for(let i=0;i<5;i++)box(.024,.012,1.15,-.65+i*.1,.41,0,mat(0x709c89),electronics);
    source.children.forEach((o,i)=>{o.userData.detailLayer=i===0?0:i===9?2:1;});
    sample.children.forEach((o,i)=>{o.userData.detailLayer=i===5?2:i===6?1:0;});
    detector.children.forEach((o,i)=>{o.userData.detailLayer=i===0?0:(i===2||i===3)?2:1;});
    laser.children.forEach((o,i)=>{o.userData.detailLayer=i;});
    electronics.children.forEach((o,i)=>{o.userData.detailLayer=i===0?0:i===1?2:1;});
    function wire(points,color){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(new T.TubeGeometry(curve,24,.025,8,false),mat(color,{metalness:.15,roughness:.8}));}
    wire([[.3,.66,-4.25],[1,.48,-4.3],[1.4,.48,-3.6],[1.75,.46,-3.35]],0x254047);
    wire([[-3.2,.64,2.4],[-3,.38,3.8],[3.8,.38,3.8],[4.1,.4,-3],[3.75,.44,-3.35]],0x313e48);
    // Translucent beam envelopes emphasize paths. Color is not IR wavelength.
    const beams=new T.Group();assembly.add(beams);const beamObjects={};
    function beam(a,b,color,r=.035){
      const v=new T.Vector3(...b).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5);
      const bm=new T.MeshBasicMaterial({color,transparent:true,opacity:.6,depthWrite:false,toneMapped:false});bm.color.convertSRGBToLinear();materials.add(bm);
      const o=mesh(new T.CylinderGeometry(r,r,1,12),bm,beams);o.position.copy(mid);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());o.scale.y=v.length();o.castShadow=false;return o;
    }
    beamObjects.input=beam(O.parts.source,O.parts.splitter,0xf3b875,.055);
    beamObjects.fixed=beam(O.parts.splitter,O.parts.fixed,0xf5c680,.045);
    beamObjects.moving=beam(O.parts.splitter,O.parts.moving,0x6be3db,.045);
    beamObjects.output=beam(O.parts.splitter,O.parts.collector,0x9ae0e5,.045);
    beamObjects.detect=beam(O.parts.collector,O.parts.detector,0x9ae0e5,.028);
    const selection=mesh(new T.TorusGeometry(.75,.014,8,64),mat(0x83f3df,{emissive:0x4dc8b7,emissiveIntensity:.8}),assembly);
    selection.rotation.x=-Math.PI/2;selection.visible=false;selection.castShadow=false;
    // Non-occluding DOM hotspots are keyboard/touch alternatives to mesh picking.
    const names={source:'红外光源',collimator:'准直组件',splitter:'分束器',fixed:'固定镜',moving:'移动镜',sample:'样品仓',collector:'收集光学',detector:'探测器',laser:'参考激光',electronics:'信号采集'};
    let selected='',closed=false,mode='inside',disposed=false,mm=0,drag=null,down=null,raf=0,detail=null;
    function inspect(id){
      if(!objects[id]||!window.FTIRPartDetail)return;
      detail?.dispose();
      callbacks.onInspect?.();
      detail=window.FTIRPartDetail(objects[id],id,names[id],()=>{detail=null;});
    }
    for(const [id,g] of Object.entries(objects)){
      if(id==='housing')continue;
      g.traverse(o=>{if(o.isMesh){o.userData.part=id;pickables.push(o);}});
      const b=document.createElement('button');b.className='model-hotspot';b.dataset.part=id;b.setAttribute('aria-label','查看'+names[id]);
      b.innerHTML='<i></i><span>'+names[id]+'</span>';host.appendChild(b);
      b.addEventListener('click',()=>{select(id);inspect(id);});labels.push({id,el:b});
    }
    const ray=new T.Raycaster(),pointer=new T.Vector2(),dragPlane=new T.Plane(new T.Vector3(0,1,0),-O.Y);
    function rayAt(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
    function hit(e){if(closed)return null;rayAt(e);const hits=ray.intersectObjects(pickables,false).filter(h=>{for(let p=h.object;p;p=p.parent)if(!p.visible)return false;return true;});return hits[0]?.object.userData.part||null;}
    function draw(){
      if(disposed)return;renderer.render(scene,camera);
      const w=host.clientWidth,h=host.clientHeight,used=[];
      for(const {id,el} of labels){
        const g=objects[id],p=new T.Vector3();g.getWorldPosition(p);p.y=O.Y+.74;p.project(camera);
        const x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
        const outside=closed||!g.visible||p.z>1||x<35||x>w-35||y<45||y>h-90;
        el.hidden=outside;el.style.left=x+'px';el.style.top=y+'px';el.classList.toggle('selected',selected===id);
        const collision=used.some(a=>Math.abs(a.x-x)<90&&Math.abs(a.y-y)<27);
        el.classList.toggle('compact',collision&&selected!==id);if(!outside&&!collision)used.push({x,y});
      }
    }
    function requestDraw(){if(raf||disposed)return;raf=requestAnimationFrame(()=>{raf=0;draw();});}
    function setMirror(value){
      mm=value;moving.position.x=O.mirrorX(value);
      const a=O.parts.splitter,b=[O.mirrorX(value),O.Y,0],o=beamObjects.moving;
      o.position.set((a[0]+b[0])/2,O.Y,0);o.scale.y=b[0];
      if(selected==='moving')selection.position.x=moving.position.x;requestDraw();
    }
    function select(id,notify=true){
      if(!objects[id]||id==='housing')return;
      if(closed)setMode('inside');selected=id;const p=objects[id].position;
      selection.visible=true;selection.position.set(p.x,.47,p.z);
      callbacks.onSelect?.(id,notify);requestDraw();
    }
    function view(kind='overview',id=selected){
      const aspect=host.clientWidth/host.clientHeight;
      if(kind==='detail'&&objects[id]){
        const p=objects[id].position;controls.target.set(p.x,.9,p.z);
        camera.position.set(p.x-3.3,.9+3.1,p.z-4.5);
      }else{
        controls.target.set(0,.7,-.55);
        const distance=Math.max(1.12,1.1/aspect);
        camera.position.set(-8*distance,11*distance,-12*distance);
        if(kind==='top')camera.position.set(-.01,22*distance,-.56);
      }
      camera.updateProjectionMatrix();controls.update();requestDraw();
    }
    function setMode(next){
      mode=next;closed=next==='exterior';shell.visible=closed;beams.visible=!closed;
      const opticalOnly=next==='optical';
      for(const id of ['laser','electronics'])objects[id].visible=!opticalOnly;
      railGroup.visible=!opticalOnly;selection.visible=!!selected&&!closed;
      compartment.visible=!opticalOnly;
      if(closed){selected='';selection.visible=false;callbacks.onSelect?.('');view();}
      callbacks.onMode?.(next);requestDraw();
    }
    function resize(){if(!host.clientWidth||!host.clientHeight)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();requestDraw();}
    function pointerDown(e){
      const id=hit(e);down={x:e.clientX,y:e.clientY,id};
      if(id==='moving'&&e.button===0){
        e.stopImmediatePropagation();controls.enabled=false;rayAt(e);const p=new T.Vector3();
        if(ray.ray.intersectPlane(dragPlane,p)){drag={x:p.x,mm,pointer:e.pointerId};canvas.setPointerCapture(e.pointerId);select('moving');}
      }
    }
    function pointerMove(e){
      if(drag){if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5)return;rayAt(e);const p=new T.Vector3();if(ray.ray.intersectPlane(dragPlane,p)){const value=Math.max(-.02,Math.min(.02,drag.mm+(p.x-drag.x)*.02/.58));setMirror(value);callbacks.onMirror?.(value);}return;}
      const id=hit(e);canvas.style.cursor=id==='moving'?'ew-resize':id?'pointer':'grab';
      labels.forEach(l=>l.el.classList.toggle('hovered',l.id===id));
    }
    function pointerUp(e){
      const clicked=e.type!=='pointercancel'&&down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5&&down.id;
      if(drag){drag=null;controls.enabled=true;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}
      if(clicked){select(down.id);inspect(down.id);}down=null;
    }
    canvas.addEventListener('pointerdown',pointerDown,true);canvas.addEventListener('pointermove',pointerMove);
    canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
    canvas.addEventListener('keydown',e=>{if(e.key==='Escape'){selected='';selection.visible=false;view();callbacks.onSelect?.('');}if(selected==='moving'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const v=Math.max(-.02,Math.min(.02,mm+(e.key==='ArrowRight'?.00025:-.00025)));setMirror(v);callbacks.onMirror?.(v);}});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.add('unavailable');callbacks.onUnavailable?.();});
    controls.addEventListener('change',requestDraw);
    const observer=new ResizeObserver(resize);observer.observe(host);resize();view();
    return {
      setMirror,focus:id=>select(id,false),inspect:id=>{select(id,false);inspect(id);},setMode,view,
      setSample(visible){sampleInsert.visible=visible;requestDraw();},
      trace(step){Object.entries(beamObjects).forEach(([id,o])=>{const groups=[['input'],['fixed','moving'],['output','detect']];o.material.opacity=(step<0||groups[step]?.includes(id)) ? .7 : .07;});requestDraw();},
      reset(){selected='';selection.visible=false;view();callbacks.onSelect?.('');},
      dispose(){detail?.dispose();disposed=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();labels.forEach(l=>l.el.remove());canvas.remove();}
    };
  };
})();
