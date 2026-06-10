"""Generate PDF from AI-Product-Shipping-Dimensions-Guide.md"""
from fpdf import FPDF
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent
md_path = DOCS / "AI-Product-Shipping-Dimensions-Guide.md"
pdf_path = DOCS / "AI-Product-Shipping-Dimensions-Guide.pdf"
text = md_path.read_text(encoding="utf-8")


def sanitize(s: str) -> str:
    s = (
        s.replace("\u2192", "->")
        .replace("\u2248", "~")
        .replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2026", "...")
        .replace("\u2022", "-")
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u00d7", "x")
    )
    return s.encode("latin-1", errors="replace").decode("latin-1")


class PDF(FPDF):
    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")


pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()
pdf.set_margins(20, 20, 20)
W = pdf.epw


def mc(txt: str, h: float, bold: bool = False, size: int = 10) -> None:
    pdf.set_font("Helvetica", "B" if bold else "", size)
    pdf.multi_cell(W, h, sanitize(txt))


def write_heading(line: str, level: int) -> None:
    pdf.ln(3 if level > 1 else 5)
    sizes = {1: 16, 2: 13, 3: 11}
    pdf.set_text_color(20, 60, 100) if level == 1 else pdf.set_text_color(40, 40, 40)
    mc(line, 7, bold=True, size=sizes.get(level, 11))
    pdf.ln(1)


def write_body(line: str) -> None:
    pdf.set_text_color(30, 30, 30)
    clean = line.replace("**", "")
    if clean.startswith("- "):
        clean = "  - " + clean[2:]
    mc(clean, 5.5, size=10)


for raw in text.splitlines():
    line = raw.rstrip()
    if line.startswith("---") and not line.strip("-").strip():
        pdf.ln(2)
        continue
    if line.startswith("# "):
        write_heading(line[2:], 1)
    elif line.startswith("## "):
        write_heading(line[3:], 2)
    elif line.startswith("### "):
        write_heading(line[4:], 3)
    elif line.startswith("|"):
        write_body(line.replace("|", "  ").strip())
    elif line and line[0].isdigit() and ". " in line[:4]:
        write_body(line)
    elif line.strip() == "":
        pdf.ln(2)
    elif line.startswith("*") and line.endswith("*"):
        pdf.set_text_color(100, 100, 100)
        mc(line.strip("*"), 5, size=9)
    else:
        write_body(line)

pdf.output(str(pdf_path))
print(f"PDF written: {pdf_path}")
print(f"Size bytes: {pdf_path.stat().st_size}")
