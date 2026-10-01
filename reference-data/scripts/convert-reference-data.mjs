import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const sourceDir = join(rootDir, 'source');
const outputDir = join(rootDir, 'processed');

const datasets = [
  {
    id: 'acetone-pnnl-2025',
    sample: { name: 'Acetone', cas: '67-64-1', phase: 'liquid' },
    sourceFile: 'NK.MIR.PUR.Acetone.LIQ.AlfaAesar.PNNL543226.txt',
    sourceFormat: 'PNNL three-column ASCII (wavenumber, n, k)',
    outputFile: 'acetone.json',
    parser: 'pnnl-nk-ascii',
    citation: 'Baker et al., PNNL Liquids Refractive Index (n/k) Dataset, 2025, DOI 10.25584/2997107',
    sourceUrl: 'https://doi.org/10.25584/2997107',
    license: 'CC0-1.0',
    measurement: {
      instrument: 'Bruker Vertex 70 FTIR (MIR); composite NIR/MIR spectrum',
      resolutionCm1: 2.0,
      sampleTemperatureC: 26,
      scansPerSingleChannel: 128,
      apodization: 'Norton-Beer, Medium',
      phaseCorrection: 'Mertz',
      sourceRangeCm1: [400.182104, 9997.903769],
    },
  },
  {
    id: 'ethanol-pnnl-2025',
    sample: { name: 'Ethanol', cas: '64-17-5', phase: 'liquid' },
    sourceFile: 'NK.MIR.PUR.Ethanol.LIQ.SigmaAldrich.PNNL559831.txt',
    sourceFormat: 'PNNL three-column ASCII (wavenumber, n, k)',
    outputFile: 'ethanol.json',
    parser: 'pnnl-nk-ascii',
    citation: 'Baker et al., PNNL Liquids Refractive Index (n/k) Dataset, 2025, DOI 10.25584/2997107',
    sourceUrl: 'https://doi.org/10.25584/2997107',
    license: 'CC0-1.0',
    measurement: {
      instrument: 'Bruker Tensor 27 FTIR (MIR) and Bruker Vertex 70 (NIR); composite spectrum',
      resolutionCm1: 2.0,
      sampleTemperatureC: 26,
      scansPerSingleChannel: 128,
      apodization: 'Norton-Beer, Medium',
      phaseCorrection: 'Mertz',
      sourceRangeCm1: [399.857941, 9996.944655],
    },
  },
  {
    id: 'polystyrene-pnnl-2017',
    sample: { name: 'Polystyrene (Styrene, oligomers)', cas: '9003-53-6', phase: 'liquid' },
    sourceFile: 'polystyrene-pnnl.jdx',
    sourceFormat: 'JCAMP-DX 4.24, compound file containing n and k blocks',
    outputFile: 'polystyrene.json',
    parser: 'jcamp-absorption-index-block',
    citation: 'Myers et al., IARPA/PNNL Liquid Phase IR Spectra, PNNL513043, March 2017',
    sourceUrl: 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C9003536&Index=0&Type=IR-SPEC',
    license: 'Public domain (declared in the source record and JCAMP header)',
    measurement: {
      instrument: 'Bruker Tensor 27 FTIR',
      resolutionCm1: 2.0,
      sampleTemperatureC: null,
      scansPerSingleChannel: 128,
      apodization: 'Norton-Beer, Medium',
      phaseCorrection: 'Mertz',
      sourceRangeCm1: [399.68954, 7797.4901],
    },
  },
];

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function parsePnnlNkAscii(text) {
  const points = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const columns = trimmed.split(/\s+/).map(Number);
    if (columns.length !== 3 || columns.some((value) => !Number.isFinite(value))) {
      throw new Error(`Invalid three-column data at line ${index + 1}`);
    }
    points.push([columns[0], columns[2]]);
  }
  return { points, declaredPointCount: null, headers: {} };
}

function parseJcampBlocks(text) {
  const chunks = text.split(/(?=^##TITLE=)/m).filter((chunk) => chunk.trim());
  return chunks.map((chunk) => {
    const headers = {};
    for (const match of chunk.matchAll(/^##([^=]+)=(.*)$/gm)) {
      headers[match[1].trim().toUpperCase()] = match[2].trim();
    }
    const dataStart = chunk.search(/^##XYDATA=/m);
    if (dataStart < 0) return { headers, points: [] };
    const afterMarker = chunk.slice(dataStart).split(/\r?\n/).slice(1);
    const encodedY = [];
    for (const line of afterMarker) {
      if (line.startsWith('##END=')) break;
      const firstNumber = line.trim().match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/);
      if (!firstNumber) continue;
      const remainder = line.trim().slice(firstNumber[0].length);
      const values = remainder.match(/[+-](?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/g) || [];
      encodedY.push(...values.map(Number));
    }
    const firstX = Number(headers.FIRSTX);
    const deltaX = Number(headers.DELTAX);
    const xFactor = Number(headers.XFACTOR || 1);
    const yFactor = Number(headers.YFACTOR || 1);
    const declaredPointCount = Number(headers.NPOINTS);
    const points = encodedY.map((encoded, index) => [
      (firstX + index * deltaX) * xFactor,
      encoded * yFactor,
    ]);
    return { headers, points, declaredPointCount };
  });
}

function parseJcampAbsorptionIndex(text) {
  const blocks = parseJcampBlocks(text);
  const selected = blocks.find((block) =>
    String(block.headers.YUNITS || '').toLowerCase().includes('absorption index')
  );
  if (!selected) throw new Error('No JCAMP absorption-index block found');
  return selected;
}

function isStrictlyDescending(values) {
  return values.every((value, index) => index === 0 || value < values[index - 1]);
}

function extrema(values) {
  return { min: Math.min(...values), max: Math.max(...values) };
}

function localMaximum(points, low, high) {
  const candidates = points.filter(([x]) => x >= low && x <= high);
  if (!candidates.length) return null;
  return candidates.reduce((best, point) => point[1] > best[1] ? point : best);
}

const peakWindows = {
  'acetone-pnnl-2025': [[1680, 1750], [1200, 1240], [1340, 1380]],
  'ethanol-pnnl-2025': [[3100, 3700], [1020, 1080], [2850, 3000]],
  'polystyrene-pnnl-2017': [[3000, 3050], [1585, 1615], [1475, 1510], [735, 770], [680, 715]],
};

const report = { generatedAt: new Date().toISOString(), datasets: [] };

for (const dataset of datasets) {
  const sourcePath = join(sourceDir, dataset.sourceFile);
  const sourceBuffer = await readFile(sourcePath);
  const sourceText = sourceBuffer.toString('utf8');
  const parsed = dataset.parser === 'pnnl-nk-ascii'
    ? parsePnnlNkAscii(sourceText)
    : parseJcampAbsorptionIndex(sourceText);

  if (!parsed.points.length) throw new Error(`${dataset.id}: no points parsed`);
  if (parsed.declaredPointCount && parsed.points.length !== parsed.declaredPointCount) {
    throw new Error(`${dataset.id}: parsed ${parsed.points.length}, expected ${parsed.declaredPointCount}`);
  }

  const x = parsed.points.map((point) => point[0]);
  const y = parsed.points.map((point) => point[1]);
  if (!isStrictlyDescending(x)) throw new Error(`${dataset.id}: x axis is not strictly descending`);
  if (y.some((value) => !Number.isFinite(value))) throw new Error(`${dataset.id}: non-finite y value`);

  const output = {
    schemaVersion: '1.0.0',
    id: dataset.id,
    sample: dataset.sample,
    measurement: dataset.measurement,
    axes: {
      x: { quantity: 'wavenumber', unit: 'cm^-1', order: 'descending' },
      y: { quantity: 'imaginary refractive index', symbol: 'k', unit: 'dimensionless' },
    },
    source: {
      citation: dataset.citation,
      url: dataset.sourceUrl,
      license: dataset.license,
      originalFile: dataset.sourceFile,
      originalFormat: dataset.sourceFormat,
      sha256: sha256(sourceBuffer),
    },
    processing: {
      operation: dataset.parser === 'pnnl-nk-ascii'
        ? 'Selected columns 1 (wavenumber) and 3 (k) from the source ASCII file.'
        : 'Decoded the JCAMP block whose YUNITS is absorption index; applied declared XFACTOR and YFACTOR.',
      downsampling: false,
      smoothing: false,
      interpolation: false,
      baselineCorrection: false,
      unitConversion: false,
      normalization: false,
    },
    pointCount: parsed.points.length,
    x,
    y,
  };

  const outputPath = join(outputDir, dataset.outputFile);
  await writeFile(outputPath, `${JSON.stringify(output)}\n`, 'utf8');
  const reread = JSON.parse(await readFile(outputPath, 'utf8'));
  if (reread.x.length !== x.length || reread.y.length !== y.length) {
    throw new Error(`${dataset.id}: JSON round-trip point-count mismatch`);
  }
  for (let index = 0; index < x.length; index += 1) {
    if (reread.x[index] !== x[index] || reread.y[index] !== y[index]) {
      throw new Error(`${dataset.id}: JSON round-trip mismatch at point ${index}`);
    }
  }

  report.datasets.push({
    id: dataset.id,
    sourceFile: dataset.sourceFile,
    sourceSha256: output.source.sha256,
    outputFile: dataset.outputFile,
    outputSha256: sha256(await readFile(outputPath)),
    pointCount: x.length,
    xRange: extrema(x),
    yRange: extrema(y),
    sourceDeclaredPointCount: parsed.declaredPointCount,
    checks: {
      pointCountMatchesSource: parsed.declaredPointCount ? x.length === parsed.declaredPointCount : true,
      xStrictlyDescending: true,
      allValuesFinite: true,
      jsonRoundTripExact: true,
    },
    localMaximaForReview: peakWindows[dataset.id].map(([low, high]) => ({
      windowCm1: [low, high],
      point: localMaximum(parsed.points, low, high),
    })),
  });
}

await writeFile(join(rootDir, 'verification-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
