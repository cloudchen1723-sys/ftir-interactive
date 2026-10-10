"""Read the unmodified NASA workbook with bundled openpyxl; output raw x/k JSON.
No spreadsheet is authored, recalculated, normalized, smoothed or resampled.
"""
import hashlib
import json
import math
import pathlib
import sys
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')
root = pathlib.Path(__file__).resolve().parent.parent
path = root / 'source' / 'C3Hx_optical_constants_2020-05-29.xlsx'
book = openpyxl.load_workbook(path, read_only=True, data_only=False)
sheet = book['C3H4 - propyne']
assert sheet['A1'].value == 'Propyne at 8 K'
assert sheet['A2'].value == 'Amorphous form'
assert sheet['C1'].value == 'Wavenumber (cm-1)'
assert sheet['E1'].value == 'k'
x, y = [], []
for row in sheet.iter_rows(min_row=2, min_col=3, max_col=5):
    xv, yv = row[0].value, row[2].value
    if xv is None and yv is None:
        continue
    assert row[0].data_type != 'f' and row[2].data_type != 'f'
    assert isinstance(xv, (int, float)) and isinstance(yv, (int, float))
    assert math.isfinite(xv) and math.isfinite(yv)
    assert not x or xv < x[-1]
    x.append(xv)
    y.append(yv)
assert len(x) > 1000
result = {
    'x': x, 'y': y, 'pointCount': len(x),
    'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
    'sheet': sheet.title, 'columns': {'x': 'C', 'k': 'E'},
    'firstDataRow': 2, 'lastDataRow': len(x) + 1,
    'temperatureK': 8, 'phaseDetail': 'amorphous ice',
    'headers': {'A1': sheet['A1'].value, 'A2': sheet['A2'].value, 'C1': sheet['C1'].value, 'D1': sheet['D1'].value, 'E1': sheet['E1'].value},
    'negativeKCount': sum(v < 0 for v in y),
    'operation': 'Read original numeric C/E cells of the 8 K amorphous propyne block; preserve all source values including negative baseline/numerical-processing values.',
}
book.close()
print(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
