"""Mẫu thử giấy chứng nhận ghi nhiều khoá trên một tờ.

Lấy trang PDF bên trong file .ai của GCN lớp TKNC DDKH (01/2026), xoá phần chữ
đổi theo học viên (khối khoá học, ngày ký, số hiệu), rồi đặt chữ mới bằng đúng
font của mẫu cũ. Khung, nền, watermark, quốc hiệu, họ tên mẫu, người ký giữ nguyên.

Chạy: python media/certificate/mockup/build.py
"""
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "assets/RUỘT GCN lớp TKNC DDKH_Folder"
OUT = Path(__file__).resolve().parent
FONTS = {
    "lob": SRC / "Fonts/Lobster-Regular.ttf",
    "asi": SRC / "Fonts/Asap-Italic.otf",
}
NAVY = (1 / 255, 22 / 255, 77 / 255)  # 0x01164d, màu chữ của mẫu cũ
RED = (212 / 255, 30 / 255, 35 / 255)  # 0xd41e23, màu tên khoá của mẫu cũ

# Tâm và bề rộng chữ tối đa của từng nửa (khung EN 19.9-408.4, VN 439.6-826.2).
HALVES = {"en": (214.2, 360), "vi": (632.9, 360)}

COURSES = {
    1: ("Phân tích dữ liệu với R cơ bản", "08-10/01/2027", "08/01/2027", "10/01/2027",
        "Basic Data Analysis with R", "January 8-10, 2027", "January 8, 2027", "January 10, 2027"),
    2: ("Phân tích chi phí - hiệu quả trong y tế", "12-13/01/2027", "12/01/2027", "13/01/2027",
        "Cost-Effectiveness Analysis in Health Care", "January 12-13, 2027", "January 12, 2027", "January 13, 2027"),
    3: ("Phân tích dữ liệu chuỗi thời gian", "15-17/01/2027", "15/01/2027", "17/01/2027",
        "Time Series Data Analysis", "January 15-17, 2027", "January 15, 2027", "January 17, 2027"),
}
SERIES_VI = "Phân tích định lượng với R: Từ cơ bản đến chuyên sâu"
SERIES_EN = "Quantitative Analysis with R: From Basic to Advanced"

# Mỗi dòng: danh sách đoạn (chữ, font, cỡ, màu) đặt liền nhau, căn giữa; kèm baseline.
def block(lang, courses):
    vi = lang == "vi"
    lines = []
    if len(courses) == 1:
        c = COURSES[courses[0]]
        lines += [
            [("đã hoàn thành chương trình của khoá học chuyên gia" if vi else
              "has successfully completed the curriculum for the course titled", "lob", 15, NAVY)],
            [(f"“{c[0] if vi else c[4]}”", "lob", 15, RED)],
            [(f"Từ ngày {c[2]} đến ngày {c[3]}" if vi else f"From {c[6]} to {c[7]}", "lob", 15, NAVY)],
            [(f"thuộc chuỗi khoá học {SERIES_VI}" if vi else f"part of the course series {SERIES_EN}", "asi", 10.5, NAVY)],
        ]
        gaps = [24.75, 24.75, 22]
    elif len(courses) == 2:
        lines.append([("đã hoàn thành chương trình của các khoá học chuyên gia" if vi else
                       "has successfully completed the curriculum for the courses", "lob", 15, NAVY)])
        for n in courses:
            c = COURSES[n]
            lines.append([(f"“{c[0] if vi else c[4]}” ", "lob", 15, RED),
                          (f"({c[1] if vi else c[5]})", "lob", 13, NAVY)])
        lines.append([(f"thuộc chuỗi khoá học {SERIES_VI}" if vi else f"part of the course series {SERIES_EN}", "asi", 10.5, NAVY)])
        gaps = [24.75, 24.75, 22]
    else:
        lines += [
            [("đã hoàn thành chương trình của chuỗi khoá học chuyên gia" if vi else
              "has successfully completed the curriculum for the course series", "lob", 15, NAVY)],
            [(f"“{SERIES_VI if vi else SERIES_EN}”", "lob", 15, RED)],
        ]
        for n in courses:
            c = COURSES[n]
            lines.append([(f"{c[0] if vi else c[4]} ({c[1] if vi else c[5]})", "lob", 13, NAVY)])
        gaps = [24, 23, 20.5, 20.5]
    return lines, gaps


def width(runs, fonts):
    return sum(fonts[f].text_length(t, fontsize=s) for t, f, s, _ in runs)


def build(courses, name):
    doc = fitz.open(SRC / "RUỘT GCN lớp TKNC DDKH.ai")
    page = doc[0]
    doc.xref_set_key(page.xref, "PieceInfo", "null")  # bỏ dữ liệu riêng của Illustrator cho file nhẹ

    # Xoá chữ cũ: khối khoá học, dòng ngày ký, số hiệu (hai nửa). Không đụng ảnh và nét vẽ.
    for r in [(28, 323, 400, 400), (448, 323, 818, 400),
              (230, 434, 392, 451), (612, 434, 818, 451),
              (225, 553, 392, 569), (618, 553, 808, 569)]:
        page.add_redact_annot(fitz.Rect(r), fill=False)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                          graphics=fitz.PDF_REDACT_LINE_ART_NONE)

    fonts = {k: fitz.Font(fontfile=str(p)) for k, p in FONTS.items()}
    for k, p in FONTS.items():
        page.insert_font(fontname=k, fontfile=str(p))

    def put(x, y, runs):
        for t, f, s, col in runs:
            missing = [ch for ch in t if not fonts[f].has_glyph(ord(ch))]
            assert not missing, f"{f} thiếu glyph {missing} trong {t!r}"
            page.insert_text((x, y), t, fontname=f, fontsize=s, color=col)
            x += fonts[f].text_length(t, fontsize=s)

    for lang, (cx, maxw) in HALVES.items():
        lines, gaps = block(lang, courses)
        total = sum(gaps)
        y = 330 + (95 - total) / 2  # baseline đầu, khối nằm giữa dòng năm sinh (304) và ngày ký (446)
        for i, runs in enumerate(lines):
            w = width(runs, fonts)
            assert w <= maxw, f"{name}/{lang} dòng {i + 1} rộng {w:.0f}pt > {maxw}pt: {runs[0][0]!r}"
            put(cx - w / 2, y, runs)
            y += gaps[i] if i < len(gaps) else 0

        # Ngày ký và số hiệu: căn phải theo mép chữ của mẫu cũ.
        vi = lang == "vi"
        for text, right, base, size in [
            ("TP. Hồ Chí Minh, ngày 17 tháng 01 năm 2027" if vi else "Ho Chi Minh City, January 17, 2027",
             813.1 if vi else 387.0, 446.4, 10),
            ("Số hiệu chứng nhận:             /2027/GCN/[mã]" if vi else "Serial number:             /2027/GCN/[code]",
             803.8 if vi else 388.1, 564.6, 9.21),
        ]:
            run = [(text, "asi", size, NAVY)]
            put(right - width(run, fonts), base, run)

    doc.save(OUT / f"{name}.pdf", garbage=4, deflate=True)
    page.get_pixmap(dpi=200).save(OUT / f"{name}.png")
    print(f"{name}: ok")


if __name__ == "__main__":
    build([2], "GCN-1-khoa_goi-5")
    build([1, 3], "GCN-2-khoa_goi-3")
    build([1, 2, 3], "GCN-3-khoa_goi-1")
