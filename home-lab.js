/* Optical-core opening shot. Coordinates come from FTIROptics; no lesson state. */
(function(){
  'use strict';
  window.mountFTIRHomeLab=function(host){
    const O=window.FTIROptics,T=window.THREE;
    if(!O||!T)return null;
    let renderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch(_){return null;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
    renderer.outputEncoding=T.sRGBEncoding;
    const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');host.appendChild(canvas);
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,80),items=[],materials=[],geometries=[];
    scene.add(new T.HemisphereLight(0x9ab8c9,0x111b25,1.15));
    const key=new T.DirectionalLight(0xe8f2f5,2.35);key.position.set(-5,9,-6);scene.add(key);
    const rim=new T.DirectionalLight(0x76aeca,1.15);rim.position.set(4,5,4);scene.add(rim);
    const metal=new T.MeshStandardMaterial({color:0x566d7c,metalness:.72,roughness:.34});
    const dark=new T.MeshStandardMaterial({color:0x17242e,metalness:.64,roughness:.46});
    const silver=new T.MeshStandardMaterial({color:0xb9d4df,metalness:.86,roughness:.17});
    const glass=new T.MeshPhysicalMaterial({color:0x8ecbd6,metalness:.1,roughness:.08,transparent:true,opacity:.43,depthWrite:false,side:T.DoubleSide});
    materials.push(metal,dark,silver,glass);
    function add(geometry,material,position,rotation){
      const o=new T.Mesh(geometry,material);if(position)o.position.set(...position);if(rotation)o.rotation.set(...rotation);
      scene.add(o);items.push(o);geometries.push(geometry);return o;
    }
    // A restrained optical bench establishes scale without exposing the full machine.
    const bench=new T.MeshBasicMaterial({color:0x10202a,transparent:true,opacity:.28,depthWrite:false});materials.push(bench);
    add(new T.BoxGeometry(8.3,.12,8.2),bench,[0,.03,-.35]);
    function cylinder(radius,length,position,axis,material){
      const o=add(new T.CylinderGeometry(radius,radius,length,40),material,position);
      o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...axis));return o;
    }
    function optic(position,normal,radius,material){
      add(new T.BoxGeometry(1,.13,.88),dark,[position[0],.26,position[2]]);
      cylinder(.075,.78,[position[0],.73,position[2]],[0,1,0],metal);
      cylinder(radius+.09,.12,position,normal,dark);
      cylinder(radius,.034,[position[0]+normal[0]*.075,position[1],position[2]+normal[2]*.075],normal,material);
    }
    optic(O.parts.splitter,O.bsNormal,.47,glass);
    optic(O.parts.fixed,[0,0,-1],.44,silver);
    optic(O.parts.moving,[-1,0,0],.44,silver);
    optic(O.parts.detector,[0,0,1],.37,metal);
    const beams=[];
    function beam(a,b,color,r){
      const va=new T.Vector3(...a),vb=new T.Vector3(...b),diff=vb.clone().sub(va);
      const material=new T.MeshBasicMaterial({color,transparent:true,opacity:0,depthWrite:false,toneMapped:false});materials.push(material);
      const o=cylinder(r,diff.length(),va.clone().add(vb).multiplyScalar(.5).toArray(),diff.normalize().toArray(),material);beams.push(material);return o;
    }
    const bs=O.parts.splitter;
    beam([-4.1,O.Y,0],bs,0xd9ab70,.021);
    beam(bs,O.parts.fixed,0xe5bc7d,.025);
    beam(bs,O.parts.moving,0x75baca,.025);
    beam(bs,O.parts.detector,0x89bac6,.02);
    const target=new T.Vector3(0,.95,-.4),start=new T.Vector3(8.1,7.35,-10.8),end=new T.Vector3(7.15,6.8,-10.2);
    let disposed=false,progress=0,raf=0;
    function draw(){raf=0;if(disposed)return;renderer.render(scene,camera);}
    function requestDraw(){if(!raf&&!disposed)raf=requestAnimationFrame(draw);}
    function setProgress(value){
      progress=Math.max(0,Math.min(1,value));
      const u=progress*progress*(3-2*progress);
      const aspect=host.clientWidth/Math.max(1,host.clientHeight);
      camera.position.copy(start).lerp(end,u).sub(target).multiplyScalar(Math.max(1,1.02/aspect)).add(target);camera.lookAt(target);
      beams.forEach((m,i)=>{m.opacity=(i===0?.27:.39)*u;});
      key.intensity=1.25+1.1*u;rim.intensity=.55+.6*u;requestDraw();
    }
    function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();setProgress(progress);}
    const observer=new ResizeObserver(resize);observer.observe(host);resize();setProgress(0);
    return {setProgress,dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();canvas.remove();}};
  };
})();
