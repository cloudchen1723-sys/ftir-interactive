import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { definitions } from './lab-definitions.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = async path => JSON.parse((await readFile(join(root,path),'utf8')).replace(/^\uFEFF/,''));
const writeJson = async (path, value, pretty = false) => writeFile(join(root,path), `${JSON.stringify(value,null,pretty ? 2 : undefined)}\n`);
const manifest = await readJson('manifest.json');
const annotations = await readJson('annotations.json');
const originalManifest = structuredClone(manifest.datasets.slice(0,3));
const originalEightIds = new Set(definitions.slice(0,8).map(d=>d.id));
const originalEightManifest = structuredClone(manifest.datasets.filter(d=>originalEightIds.has(d.datasetId)));
const protectedFiles = originalEightManifest.flatMap(d => [d.original.file,d.local.file]);
const protectedHashes = await Promise.all(protectedFiles.map(async file => [file,sha(await readFile(join(root,file)))]));
const existingSourceHashChecks=[];
for (const d of originalManifest) {
  const actual = sha(await readFile(join(root,d.original.file)));
  existingSourceHashChecks.push({id:d.datasetId,file:d.original.file,declaredSha256:d.original.sha256,actualSha256:actual,matchesDeclaredHash:actual===d.original.sha256,note:actual===d.original.sha256?'':'Pre-existing source hash discrepancy discovered during this extension; source and existing metadata are preserved. Raw x/k values are checked against preserved processed arrays below.'});
  assert.equal(sha(await readFile(join(root,d.local.file))),d.local.sha256,`Frozen processed hash: ${d.datasetId}`);
}
const report = { schemaVersion:'1.0.0', checkedAt:'2026-10-10', note:'Checks read original arrays without smoothing, interpolation, baseline correction, normalization or synthesizing peaks.', existingSourceHashChecks, datasets:[] };

function parseJcamp(text) {
  const blocks = text.split(/(?=^##TITLE=)/m).filter(chunk => chunk.trim());
  const candidates = blocks.map(chunk => {
    const headers = Object.fromEntries([...chunk.matchAll(/^##([^=]+)=(.*)$/gm)].map(m => [m[1].trim().toUpperCase(),m[2].trim()]));
    return { chunk, headers };
  });
  const selected = candidates.filter(b => b.headers.YUNITS === 'absorption index');
  assert.equal(selected.length,1,'Exactly one measured k block required');
  const {chunk,headers:h} = selected[0];
  assert.equal(h.OWNER,'Public domain');
  assert.equal(h.STATE,'liquid');
  assert.equal(h.XUNITS,'1/cm');
  const n = Number(h.NPOINTS), first = Number(h.FIRSTX), delta = Number(h.DELTAX);
  const xf = Number(h.XFACTOR || 1), yf = Number(h.YFACTOR || 1);
  const y = [];
  const lines = chunk.slice(chunk.search(/^##XYDATA=/m)).split(/\r?\n/).slice(1);
  for (const line of lines) {
    if (line.startsWith('##END=')) break;
    if (!line.trim()) continue;
    const numbers = line.trim().match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/g)?.map(Number);
    assert.ok(numbers && numbers.length > 1,'Expected AFFN numeric XYDATA line');
    assert.ok(Math.abs(numbers[0] - (first+y.length*delta)) < 0.02,'X anchor must agree with declared grid within source printed precision');
    y.push(...numbers.slice(1).map(v => v*yf));
  }
  assert.equal(y.length,n,'Source NPOINTS');
  const x = y.map((_,i) => (first+i*delta)*xf);
  assert.ok(Math.abs(x.at(-1) - Number(h.LASTX)*xf) < 0.02,'Source LASTX within printed precision');
  return {x,y,headers:h,allHeaders:candidates.map(b=>b.headers)};
}

const catalog = {schemaVersion:'1.0.0', updatedAt:'2026-10-10', titleZh:'真实参考光谱 · 官能团读谱实验室', noteZh:'曲线是由实测光谱取得的光学常数 k（无量纲），不是吸光度 A 或透过率 T。请核对每个样本的相态与温度。标注是独立解释层；窄带位置取所选区间的原始 k 最大值，宽带只解释包络。不同样本峰高不能直接比较浓度。官能团区间不是唯一鉴定规则。', samples:[]};

for (const def of definitions) {
  let dataset = manifest.datasets.find(d=>d.datasetId===def.id);
  const isNew = !originalManifest.some(d=>d.datasetId===def.id);
  let spectrum;
  let declaredPointCount = null;
  if (def.parser === 'nasa-propyne-workbook') {
    const python = process.env.FTIR_REFERENCE_PYTHON || (process.platform === 'win32'
      ? 'C:/Users/Chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' : 'python3');
    const parsed = JSON.parse(execFileSync(python,[join(root,'scripts/extract-propyne-workbook.py')],{encoding:'utf8',maxBuffer:20*1024*1024}));
    const measurement = {mode:'Imaginary refractive index derived by publisher from normal-incidence transmission FTIR measurements and optical-constants analysis',instrument:'FTIR; paper identifies Thermo iS50 for phase checks; selected workbook does not separately name the optical-constants acquisition instrument',resolutionCm1:0.5,scansPerSpectrum:200,sampleTemperatureK:8,phaseDetail:'amorphous ice',conditionsZh:'8 K 非晶固体；气相沉积在预冷 CsI 或 KBr 基底，正入射透射 FTIR 后由作者计算光学常数。不是室温液体谱。',substrate:'CsI or KBr; selected workbook block does not specify which substrate',sampleThicknessUm:null,thicknessNote:'Paper reports multiple ice thicknesses ~0.25–2 µm for intensity measurements. No unique thickness assigned to this optical-constants workbook block.',sourceRangeCm1:[parsed.x.at(-1),parsed.x[0]],spectralIntervalCm1:Math.abs(parsed.x[0]-parsed.x[1]),resolutionNote:'~0.0603 cm^-1 source grid spacing is not the 0.5 cm^-1 instrumental resolution.',supplier:'Sigma Aldrich',statedPurity:'≥99%',publisherProcessing:'Optical constants derived by publisher from measured transmission spectra using updated iterative optical-constants analysis with substrate effects and refractive-index measurements. Source contains negative baseline/numerical-processing values, which are retained and do not represent physical negative absorption.',knownContaminants:'Paper reports small features from ~0.1% CO2 at 2338 cm^-1 and ~1% allene at 1948 cm^-1 in amorphous propyne; no peaks are removed here.'};
    const source = {citation:'Hudson, Gerakines, Yarnall and Coones (2021), Infrared spectra and optical constants of astronomical ices: III. Propane, propylene, and propyne, Icarus 354, 114033, DOI 10.1016/j.icarus.2020.114033. Data: NASA Goddard Cosmic Ice Laboratory.',url:'https://science.gsfc.nasa.gov/691/cosmicice/constants.html',downloadUrl:'https://science.gsfc.nasa.gov/691/cosmicice/constants/C3_hydrocarbons/C3Hx_optical_constants_2020-05-29.xlsx',publicationUrl:'https://doi.org/10.1016/j.icarus.2020.114033',assignmentUrl:'https://science.gsfc.nasa.gov/691/cosmicice/reprints/Hudson-2021-2746.pdf',license:'NASA Open Access Data Policy (OCdb Data Redistribution terms); attribution requested',licenseUrl:'https://ocdb.smce.nasa.gov/page/toc',licenseNote:'Retain attribution to the NASA Cosmic Ice Laboratory and Hudson et al. Data redistribution is described by NASA OCdb policy; this is not a CC0 declaration and does not license reproduction of the publisher article.',originalFile:'C3Hx_optical_constants_2020-05-29.xlsx',originalFormat:'XLSX optical-constants workbook',sha256:parsed.sourceSha256,sheet:parsed.sheet,columns:parsed.columns,firstDataRow:parsed.firstDataRow,lastDataRow:parsed.lastDataRow,workbookHeaders:parsed.headers};
    spectrum={schemaVersion:'1.0.0',id:def.id,sample:{name:def.name,cas:def.cas,phase:'solid',phaseDetail:'amorphous ice',supplier:'Sigma Aldrich',statedPurity:'≥99%'},measurement,axes:{x:{quantity:'wavenumber',unit:'cm^-1',order:'descending'},y:{quantity:'imaginary refractive index',symbol:'k',unit:'dimensionless',absorptionDirection:'up'}},source,processing:{operation:parsed.operation,noteZh:'保留作者从透射实验导出的原始 k 列，包括源文件中的负基线/数值处理值；这些数值不表示物理上的负吸收，不能裁零、补峰或改标为透过率。',downsampling:false,smoothing:false,interpolation:false,baselineCorrection:false,unitConversion:false,normalization:false,negativeKCount:parsed.negativeKCount},pointCount:parsed.pointCount,x:parsed.x,y:parsed.y};
    await writeJson('processed/propyne.json',spectrum);
    dataset={sample:def.name,cas:def.cas,datasetId:def.id,source:'NASA Goddard Cosmic Ice Laboratory, C3 hydrocarbon optical constants (2021 publication)',sourceUrl:source.url,phase:'solid',phaseDetail:'amorphous ice',measurement:structuredClone(measurement),x:{quantity:'wavenumber',unit:'cm^-1',range:[parsed.x.at(-1),parsed.x[0]],order:'descending'},y:{quantity:'imaginary refractive index',symbol:'k',unit:'dimensionless',absorptionDirection:'up'},original:{format:source.originalFormat,file:`source/${source.originalFile}`,sha256:source.sha256,downloadUrl:source.downloadUrl,sheet:source.sheet,columns:source.columns,firstDataRow:source.firstDataRow,lastDataRow:source.lastDataRow},local:{format:'JSON arrays',file:'processed/propyne.json',pointCount:parsed.pointCount,sha256:sha(await readFile(join(root,'processed/propyne.json')))},license:source.license,licenseUrl:source.licenseUrl,redistribution:source.licenseNote,provenance:source.citation};
    const found=manifest.datasets.findIndex(d=>d.datasetId===def.id);
    if(found<0) manifest.datasets.push(dataset); else manifest.datasets[found]=dataset;
    declaredPointCount=parsed.pointCount;
  } else if (isNew) {
    const provenance = await readJson(`source/${def.slug}-provenance.json`);
    const sourceBytes = await readFile(join(root,'source',provenance.jcampFile));
    const parsed = parseJcamp(sourceBytes.toString('utf8'));
    const h = parsed.headers;
    declaredPointCount = Number(h.NPOINTS);
    assert.equal(h['CAS REGISTRY NO'],def.cas,'CAS must match interpretation definition');
    const metadataFile = `source/${provenance.metadataFile}`;
    const metadataSha256 = sha(await readFile(join(root,metadataFile)));
    const measurement = {
      mode:'Optical constants derived from multiple path-length transmission absorbance measurements',
      instrument:h['SPECTROMETER/DATA SYSTEM'], resolutionCm1:Number.parseFloat(h['INSTRUMENT RESOLUTION']),
      sampleTemperatureC:26, sampleTemperatureUncertaintyC:1, pathLengthsUm:def.pathLengthsUm,
      cellWindowMaterial:'KBr', preparation:def.preparation || 'None', purge:'UHP nitrogen',
      scansPerSingleChannel:Number(h['NUMBER OF INTERFEROGRAMS AVERAGED PER SINGLE CHANNEL SPECTRUM']),
      apodization:h.APODIZATION, phaseCorrection:h['PHASE CORRECTION'], zeroFill:h['INTERFEROGRAM ZEROFILL'],
      spectralIntervalCm1:Math.abs(Number(h.DELTAX)), sourceRangeCm1:[parsed.x.at(-1),parsed.x[0]],
      scannerVelocity:h['SCANNER SPEED'], aperture:h.APERTURE, detector:h.DETECTOR,
      beamSplitter:h.BEAMSPLITTER, irSource:h['IR SOURCE'], foldingLimits:h['FOLDING LIMITS'],
      publisherProcessing:'Multiple-path-length absorbance composites; reflective-loss correction; weighted linear fits; Kramers-Kronig calculation of n; source frequency correction already applied. Full sample-specific processing remains in original metadata PDF.',
      resolutionNote:'Instrument resolution is 2.0 cm^-1; ~0.482 cm^-1 is the sampled grid after 4x zero filling, not improved instrument resolution.',
    };
    spectrum = {schemaVersion:'1.0.0',id:def.id,sample:{name:def.name,cas:def.cas,phase:'liquid',supplier:def.supplier,statedPurity:def.purity,lot:def.lot},measurement,
      axes:{x:{quantity:'wavenumber',unit:'cm^-1',order:'descending'},y:{quantity:'imaginary refractive index',symbol:'k',unit:'dimensionless',absorptionDirection:'up'}},
      source:{citation:'Myers et al., IARPA/PNNL Liquid Phase IR Spectra, March 2017; optical-constants methods: Appl. Spectrosc. 2018, 72, 535–550, DOI 10.1177/0003702817742848',url:provenance.recordUrl,downloadUrl:provenance.downloadUrl,license:'Public domain (explicit source OWNER declaration)',owner:h.OWNER,originalFile:provenance.jcampFile,originalFormat:'JCAMP-DX 4.24 compound n/k blocks',sha256:sha(sourceBytes),metadataFile,metadataUrl:provenance.metadataUrl,metadataSha256,jcampHeaders:parsed.allHeaders},
      processing:{operation:'Decoded only source YUNITS=absorption index (k) block; applied declared XFACTOR and YFACTOR, reconstructing the declared FIRSTX/DELTAX grid.',downsampling:false,smoothing:false,interpolation:false,baselineCorrection:false,unitConversion:false,normalization:false},pointCount:parsed.x.length,x:parsed.x,y:parsed.y};
    await writeJson(`processed/${def.slug}.json`,spectrum);
    dataset = {sample:def.name,cas:def.cas,datasetId:def.id,source:'IARPA/PNNL Liquid Phase IR Spectra, March 2017',sourceUrl:provenance.recordUrl,phase:'liquid',measurement:structuredClone(measurement),
      x:{quantity:'wavenumber',unit:'cm^-1',range:[spectrum.x.at(-1),spectrum.x[0]],order:'descending'},y:{quantity:'imaginary refractive index',symbol:'k',unit:'dimensionless',absorptionDirection:'up'},
      original:{format:spectrum.source.originalFormat,file:`source/${provenance.jcampFile}`,metadata:metadataFile,sha256:spectrum.source.sha256,metadataSha256,downloadUrl:provenance.downloadUrl,metadataUrl:provenance.metadataUrl},
      local:{format:'JSON arrays',file:`processed/${def.slug}.json`,pointCount:spectrum.pointCount,sha256:sha(await readFile(join(root,`processed/${def.slug}.json`)))},
      license:spectrum.source.license,redistribution:'Allowed for this PNNL record; retain source provenance. Does not waive NIST compilation copyright for other records.',provenance:`PNNL ${h['$NIST DOC FILE'].match(/PNNL\d+/)[0]}; ${def.supplier}, ${def.purity}, lot ${def.lot}; measured 26 ± 1 C; original metadata PDF retained in full.`};
    const found = manifest.datasets.findIndex(d=>d.datasetId===def.id);
    if(found<0) manifest.datasets.push(dataset); else manifest.datasets[found]=dataset;
  } else {
    spectrum = await readJson(dataset.local.file);
    const sourceText = await readFile(join(root,dataset.original.file),'utf8');
    const parsed = dataset.original.format.startsWith('three-column')
      ? { x:sourceText.trim().split(/\r?\n/).map(line=>Number(line.trim().split(/\s+/)[0])), y:sourceText.trim().split(/\r?\n/).map(line=>Number(line.trim().split(/\s+/)[2])) }
      : parseJcamp(sourceText);
    assert.deepEqual(parsed.x,spectrum.x,`Existing source x matches preserved array: ${def.id}`);
    assert.deepEqual(parsed.y,spectrum.y,`Existing source k matches preserved array: ${def.id}`);
    existingSourceHashChecks.find(c=>c.id===def.id).rawXKMatchesPreservedProcessedExactly=true;
  }
  assert.equal(spectrum.x.length,spectrum.y.length);
  assert.equal(spectrum.pointCount,spectrum.x.length);
  assert.ok(spectrum.x.every((x,i)=>Number.isFinite(x) && (!i || x<spectrum.x[i-1])));
  assert.ok(spectrum.y.every(y=>Number.isFinite(y)));
  assert.equal(spectrum.axes.y.symbol,'k');
  const reread = await readJson(dataset.local.file);
  assert.deepEqual(reread.x,spectrum.x); assert.deepEqual(reread.y,spectrum.y);
  const features = def.features.map(feature=>{
    const [low,high]=feature.rangeCm1;
    const candidates=spectrum.x.map((x,i)=>({x,y:spectrum.y[i],i})).filter(p=>p.x>=low && p.x<=high);
    assert.ok(candidates.length>2,`${def.id}/${feature.id}: populated window`);
    const max=candidates.reduce((a,b)=>b.y>a.y ? b:a);
    const interior=max.x>low && max.x<high && max.i>0 && max.i<spectrum.x.length-1;
    const local=interior && max.y>=spectrum.y[max.i-1] && max.y>=spectrum.y[max.i+1];
    assert.ok(feature.broad || local,`${def.id}/${feature.id}: sharp feature must be an actual interior local maximum`);
    return {...feature,observedCm1:max.x,observedK:max.y,observedKind:feature.broad?'maximum of overlapping/broad envelope within selected window':'local maximum of raw k within selected window',assignmentSource:feature.assignmentUrl.includes('nasa.gov')?'Hudson et al. 2021, Table 8 (amorphous propyne at 8 K); approximate assignments separate from measured k array':feature.assignmentUrl.includes('nist.gov')?'NIST Chemistry WebBook vibrational mode compilation (interpretation only; phase-specific frequencies are not substituted for measured data)':feature.assignmentUrl.includes('rsc.org')?'Published polystyrene vibrational assignment; qualified fingerprint interpretation':'Official university functional-group correlation reference; approximate, qualified interpretation'};
  });
  const metadata={...structuredClone(dataset),measurementDetails:structuredClone(spectrum.measurement),sourceDetails:structuredClone(spectrum.source),processing:structuredClone(spectrum.processing)};
  if(!isNew) metadata.sourceHashValidation=structuredClone(existingSourceHashChecks.find(c=>c.id===def.id));
  const sample={id:def.id,labelZh:def.labelZh,file:dataset.local.file,familyZh:def.familyZh,readingIntroZh:def.readingIntroZh,readingOrder:features.map(f=>f.id),features,metadata};
  if(def.slug==='polystyrene') sample.limitationZh='PNNL 样品为液态苯乙烯低聚物，不代表室温固态聚苯乙烯薄膜；该曲线与 SRM 1921b 认证峰位表是两个对象。';
  if(def.slug==='propyne') sample.limitationZh='8 K 非晶丙炔冰的光学常数，不能代表室温气态或液态丙炔。源谱含作者报告的 CO₂ / 丙二烯杂质与负基线/数值处理值，均原样保留；负值不代表物理上的负吸收。';
  if(def.slug==='styrene') sample.limitationZh='这是液态苯乙烯单体；供应商添加 4-tert-butylcatechol 稳定剂。与液态苯乙烯低聚物（polystyrene）是不同样品。';
  catalog.samples.push(sample);
  if(isNew) annotations.samples[def.id]={note:'独立教学解释层；实际位置读取原始 k 数组。宽包络最大值不是纯单模式峰位。',teachingPeaks:features.map(f=>({...f,fromFinalReferenceDataset:true,mainSceneDefault:false})),referenceDetails:[]};
  report.datasets.push({id:def.id,pointCount:spectrum.pointCount,sourceDeclaredPointCount:declaredPointCount,sourceSha256:sha(await readFile(join(root,dataset.original.file))),outputSha256:sha(await readFile(join(root,dataset.local.file))),xRangeCm1:[spectrum.x.at(-1),spectrum.x[0]],yRange:[Math.min(...spectrum.y),Math.max(...spectrum.y)],checks:{finite:true,xStrictlyDescending:true,pointCountMatchesSource:!declaredPointCount || declaredPointCount===spectrum.pointCount,jsonRoundTripExact:true,yIsK:true,sharpFeaturesAreActualLocalMaxima:true},features:features.map(f=>({id:f.id,rangeCm1:f.rangeCm1,observedCm1:f.observedCm1,observedK:f.observedK,broad:f.broad}))});
  if(def.parser==='nasa-propyne-workbook') {
    const entry=report.datasets.at(-1);
    assert.equal(entry.sourceSha256,spectrum.source.sha256,'Workbook hash must match directly extracted cells');
    entry.workbookSelection={file:dataset.original.file,sheet:spectrum.source.sheet,columns:spectrum.source.columns,firstDataRow:spectrum.source.firstDataRow,lastDataRow:spectrum.source.lastDataRow,temperatureK:8,phaseDetail:'amorphous ice'};
    entry.negativeKCount=spectrum.processing.negativeKCount;
    entry.minimumKAtCm1=spectrum.x[spectrum.y.indexOf(entry.yRange[0])];
    entry.checks.workbookColumnsReadExactly=true;
    entry.checks.originalWorkbookSha256Matches=true;
    entry.note='Negative baseline/numerical-processing values are preserved; no non-negativity assumption is imposed on the published source column.';
  }
}
assert.deepEqual(manifest.datasets.slice(0,3),originalManifest,'Existing manifest records remain unchanged');
assert.deepEqual(manifest.datasets.filter(d=>originalEightIds.has(d.datasetId)),originalEightManifest,'All eight pre-existing manifest records remain unchanged');
for(const [file,hash] of protectedHashes) assert.equal(sha(await readFile(join(root,file))),hash,`Protected existing data unchanged: ${file}`);
report.protectedExistingFiles=protectedHashes.map(([file,sha256])=>({file,sha256,unchanged:true}));
report.sampleCount=catalog.samples.length;
report.featureCount=catalog.samples.reduce((sum,s)=>sum+s.features.length,0);
await writeJson('manifest.json',manifest,true);
await writeJson('annotations.json',annotations,true);
await writeJson('lab-catalog.json',catalog,true);
await writeJson('lab-validation-report.json',report,true);
console.log(JSON.stringify({samples:report.sampleCount,features:report.featureCount,datasets:report.datasets.map(d=>({id:d.id,points:d.pointCount,peaks:d.features.map(f=>[f.id,f.observedCm1])})),protectedExistingFilesUnchanged:true,existingSourceHashMismatches:existingSourceHashChecks.filter(c=>!c.matchesDeclaredHash).map(c=>c.id),existingRawXKMatchesPreservedProcessedExactly:true},null,2));
