"""One QR PNG per learner, named by learner code, from the Điểm danh tab downloaded as CSV.

    python apps-script/attendance/qr.py hoc-vien.csv qr-out

Needs segno (pip install segno). Runs offline, so learner links never leave the machine.
Keep the CSV and the PNGs outside the repo: they list learners.
"""
import csv
import re
import sys
from pathlib import Path

import segno


def main(src, out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    made, skipped = 0, []
    with open(src, encoding='utf-8-sig', newline='') as f:
        for n, row in enumerate(csv.DictReader(f), start=2):
            code = (row.get('Mã học viên') or '').strip().upper()
            link = (row.get('Link QR') or '').strip()
            # The Sáng/Chiều row and learners still waiting for a code have neither.
            if not code and not link:
                continue
            # The code becomes a file name, so only letters, digits and dashes pass.
            if not re.fullmatch(r'[A-Z0-9-]+', code) or not link.startswith('https://script.google.com/'):
                skipped.append(f'dòng {n} ({code or "chưa có Mã"})')
                continue
            segno.make(link, error='m').save(out / f'{code}.png', scale=10, border=4)
            made += 1
    print(f'Đã tạo {made} ảnh QR trong {out}.')
    if skipped:
        print('Bỏ qua vì thiếu Mã hoặc Link QR: ' + ', '.join(skipped))


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
