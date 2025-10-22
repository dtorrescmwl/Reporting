#!/usr/bin/env python3
"""
Convert KPI Definitions Markdown to PDF
"""

import markdown
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import os

# Read the markdown file
with open('/home/cmwldaniel/Reporting/KPI_DEFINITIONS_GUIDE.md', 'r') as f:
    md_content = f.read()

# Convert markdown to HTML
html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'codehilite'])

# Create a styled HTML document
styled_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Healthcare KPI Dashboard - Definitions Guide</title>
    <style>
        @page {{
            size: A4;
            margin: 2cm;
            @bottom-center {{
                content: counter(page) " of " counter(pages);
                font-size: 10pt;
                color: #666;
            }}
        }}

        body {{
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
        }}

        h1 {{
            color: #2c3e50;
            font-size: 28pt;
            margin-top: 0;
            margin-bottom: 20pt;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10pt;
            page-break-after: avoid;
        }}

        h2 {{
            color: #2c3e50;
            font-size: 20pt;
            margin-top: 30pt;
            margin-bottom: 15pt;
            border-bottom: 2px solid #3498db;
            padding-bottom: 8pt;
            page-break-after: avoid;
        }}

        h3 {{
            color: #34495e;
            font-size: 16pt;
            margin-top: 20pt;
            margin-bottom: 12pt;
            page-break-after: avoid;
        }}

        h4 {{
            color: #555;
            font-size: 13pt;
            margin-top: 15pt;
            margin-bottom: 10pt;
            page-break-after: avoid;
        }}

        p {{
            margin: 8pt 0;
            text-align: justify;
        }}

        strong {{
            color: #2c3e50;
            font-weight: 600;
        }}

        code {{
            background-color: #f4f4f4;
            padding: 2pt 4pt;
            border-radius: 3pt;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            color: #c7254e;
        }}

        pre {{
            background-color: #f8f9fa;
            padding: 12pt;
            border-left: 4px solid #3498db;
            border-radius: 4pt;
            overflow-x: auto;
            page-break-inside: avoid;
            margin: 12pt 0;
        }}

        pre code {{
            background-color: transparent;
            padding: 0;
            color: #333;
            font-size: 9pt;
            line-height: 1.4;
        }}

        ul, ol {{
            margin: 10pt 0;
            padding-left: 25pt;
        }}

        li {{
            margin: 5pt 0;
        }}

        hr {{
            border: none;
            border-top: 1px solid #ddd;
            margin: 20pt 0;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15pt 0;
            page-break-inside: avoid;
        }}

        th, td {{
            border: 1px solid #ddd;
            padding: 8pt;
            text-align: left;
        }}

        th {{
            background-color: #3498db;
            color: white;
            font-weight: 600;
        }}

        tr:nth-child(even) {{
            background-color: #f8f9fa;
        }}

        .section {{
            page-break-inside: avoid;
        }}

        /* Ensure headers stay with their content */
        h1, h2, h3, h4, h5, h6 {{
            page-break-inside: avoid;
            page-break-after: avoid;
        }}

        /* Keep code blocks together */
        pre {{
            page-break-inside: avoid;
        }}

        /* Cover page styling */
        .cover {{
            text-align: center;
            padding: 100pt 0;
        }}

        .cover h1 {{
            font-size: 36pt;
            border: none;
            margin-bottom: 30pt;
        }}

        .cover p {{
            font-size: 14pt;
            color: #7f8c8d;
            margin: 10pt 0;
        }}

        .metadata {{
            background-color: #f8f9fa;
            padding: 12pt;
            border-radius: 5pt;
            margin: 20pt 0;
            border-left: 4px solid #3498db;
        }}
    </style>
</head>
<body>
    {html_content}
</body>
</html>
"""

# Configure fonts
font_config = FontConfiguration()

# Generate PDF
output_path = '/home/cmwldaniel/Reporting/KPI_DEFINITIONS_GUIDE.pdf'
HTML(string=styled_html).write_pdf(
    output_path,
    font_config=font_config
)

print(f"PDF successfully created: {output_path}")
print(f"File size: {os.path.getsize(output_path) / 1024:.2f} KB")
