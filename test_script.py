import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = docx.Document()

# Margin 1 inch
for section in doc.sections:
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

def add_line(text, indent_level=0, bold=False, size_pt=12):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    indent_prefix = '  ' * indent_level
    prefix = '- ' if indent_level >= 0 else ''
    full_text = f'{indent_prefix}{prefix}{text}'
    run = p.add_run(full_text)
    run.font.name = 'Calibri'
    run.font.size = Pt(size_pt)
    run.bold = bold
    return p

print('Script template ready')
