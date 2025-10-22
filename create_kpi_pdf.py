#!/usr/bin/env python3
"""
Create KPI Definitions PDF using ReportLab
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import re

# Read markdown
with open('KPI_DEFINITIONS_GUIDE.md', 'r') as f:
    content = f.read()

# Create PDF
pdf_file = 'KPI_DEFINITIONS_GUIDE.pdf'
doc = SimpleDocTemplate(pdf_file, pagesize=letter,
                        rightMargin=72, leftMargin=72,
                        topMargin=72, bottomMargin=18)

# Container for the 'Flowable' objects
elements = []

# Define styles
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Justify', alignment=TA_JUSTIFY))

# Custom styles
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor('#2c3e50'),
    spaceAfter=30,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading1_style = ParagraphStyle(
    'CustomHeading1',
    parent=styles['Heading1'],
    fontSize=18,
    textColor=colors.HexColor('#2c3e50'),
    spaceAfter=12,
    spaceBefore=12,
    fontName='Helvetica-Bold',
    borderWidth=1,
    borderColor=colors.HexColor('#3498db'),
    borderPadding=5
)

heading2_style = ParagraphStyle(
    'CustomHeading2',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=colors.HexColor('#34495e'),
    spaceAfter=10,
    spaceBefore=10,
    fontName='Helvetica-Bold'
)

heading3_style = ParagraphStyle(
    'CustomHeading3',
    parent=styles['Heading3'],
    fontSize=12,
    textColor=colors.HexColor('#555555'),
    spaceAfter=6,
    spaceBefore=6,
    fontName='Helvetica-Bold'
)

body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['BodyText'],
    fontSize=10,
    alignment=TA_LEFT,
    spaceAfter=6
)

code_style = ParagraphStyle(
    'Code',
    parent=styles['Code'],
    fontSize=8,
    leftIndent=20,
    textColor=colors.HexColor('#c7254e'),
    backColor=colors.HexColor('#f4f4f4')
)

# Parse markdown and convert to PDF elements
lines = content.split('\n')
i = 0

while i < len(lines):
    line = lines[i].strip()

    # Skip empty lines
    if not line:
        elements.append(Spacer(1, 6))
        i += 1
        continue

    # H1 - Title
    if line.startswith('# '):
        text = line[2:].strip()
        elements.append(Paragraph(text, title_style))
        elements.append(Spacer(1, 12))

    # H2 - Major sections
    elif line.startswith('## '):
        text = line[3:].strip()
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(text, heading1_style))
        elements.append(Spacer(1, 6))

    # H3 - Subsections
    elif line.startswith('### '):
        text = line[4:].strip()
        elements.append(Paragraph(text, heading2_style))

    # H4 - Sub-subsections
    elif line.startswith('#### '):
        text = line[5:].strip()
        elements.append(Paragraph(text, heading3_style))

    # Horizontal rule
    elif line.startswith('---'):
        elements.append(Spacer(1, 12))

    # Code blocks
    elif line.startswith('```'):
        code_lines = []
        i += 1
        while i < len(lines) and not lines[i].strip().startswith('```'):
            code_lines.append(lines[i])
            i += 1

        code_text = '<br/>'.join([line.replace(' ', '&nbsp;') for line in code_lines])
        elements.append(Paragraph(code_text, code_style))
        elements.append(Spacer(1, 6))

    # Bold text (convert **text** to <b>text</b>)
    elif '**' in line:
        text = line
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        text = text.replace('`', '<font face="Courier" size="8" color="#c7254e">')
        text = text.replace('`', '</font>')
        elements.append(Paragraph(text, body_style))

    # Regular paragraph
    else:
        text = line
        # Convert inline code
        text = re.sub(r'`([^`]+)`', r'<font face="Courier" size="8" color="#c7254e">\1</font>', text)
        # Convert bold
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        elements.append(Paragraph(text, body_style))

    i += 1

# Build PDF
print(f"Building PDF: {pdf_file}")
doc.build(elements)
print(f"✅ PDF created successfully: {pdf_file}")

import os
print(f"File size: {os.path.getsize(pdf_file) / 1024:.2f} KB")
