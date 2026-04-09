#!/usr/bin/env python3
"""
Script para generar PDF de la documentación de la API Tech Guard Pro
Requiere: pip install markdown pdfkit
"""

import markdown
import pdfkit
import os
from pathlib import Path

def generar_pdf():
    # Rutas de archivos
    md_file = "DOCUMENTACION_API_TECH_GUARD_PRO.md"
    html_file = "DOCUMENTACION_API_TECH_GUARD_PRO.html"
    pdf_file = "DOCUMENTACION_API_TECH_GUARD_PRO.pdf"
    
    # Verificar que el archivo markdown existe
    if not os.path.exists(md_file):
        print(f"❌ Error: No se encontró el archivo {md_file}")
        return False
    
    try:
        # Leer el archivo markdown
        print(f"📖 Leyendo {md_file}...")
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Convertir markdown a HTML
        print("🔄 Convirtiendo Markdown a HTML...")
        html_content = markdown.markdown(
            md_content, 
            extensions=['tables', 'fenced_code', 'codehilite']
        )
        
        # Crear HTML completo con estilos
        full_html = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Documentación API Tech Guard Pro</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #fff;
                }}
                
                h1 {{
                    color: #2563eb;
                    border-bottom: 3px solid #2563eb;
                    padding-bottom: 10px;
                    margin-top: 40px;
                }}
                
                h2 {{
                    color: #1e40af;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 8px;
                    margin-top: 30px;
                }}
                
                h3 {{
                    color: #374151;
                    margin-top: 25px;
                }}
                
                h4 {{
                    color: #4b5563;
                    margin-top: 20px;
                }}
                
                code {{
                    background: #f3f4f6;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                }}
                
                pre {{
                    background: #1f2937;
                    color: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin: 15px 0;
                }}
                
                pre code {{
                    background: none;
                    padding: 0;
                    color: inherit;
                }}
                
                blockquote {{
                    border-left: 4px solid #2563eb;
                    margin: 20px 0;
                    padding: 10px 20px;
                    background: #f8fafc;
                }}
                
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }}
                
                th, td {{
                    border: 1px solid #d1d5db;
                    padding: 12px;
                    text-align: left;
                }}
                
                th {{
                    background: #f3f4f6;
                    font-weight: 600;
                }}
                
                .endpoint {{
                    background: #f0f9ff;
                    border: 1px solid #0ea5e9;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                }}
                
                .method {{
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 0.8em;
                    margin-right: 10px;
                }}
                
                .method.post {{
                    background: #10b981;
                    color: white;
                }}
                
                .method.get {{
                    background: #3b82f6;
                    color: white;
                }}
                
                .method.put {{
                    background: #f59e0b;
                    color: white;
                }}
                
                .method.delete {{
                    background: #ef4444;
                    color: white;
                }}
                
                .url {{
                    font-family: 'Courier New', monospace;
                    font-size: 1.1em;
                    color: #1e40af;
                }}
                
                .response {{
                    background: #f0fdf4;
                    border: 1px solid #22c55e;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                }}
                
                .warning {{
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                }}
                
                .success {{
                    background: #d1fae5;
                    border: 1px solid #10b981;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                }}
                
                .checklist {{
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }}
                
                .checklist ul {{
                    list-style: none;
                    padding-left: 0;
                }}
                
                .checklist li {{
                    padding: 5px 0;
                    position: relative;
                    padding-left: 25px;
                }}
                
                .checklist li:before {{
                    content: "☐";
                    position: absolute;
                    left: 0;
                    color: #6b7280;
                }}
                
                @media print {{
                    body {{
                        margin: 0;
                        padding: 15px;
                    }}
                    
                    h1, h2, h3, h4 {{
                        page-break-after: avoid;
                    }}
                    
                    .endpoint, .response, .warning, .success {{
                        page-break-inside: avoid;
                    }}
                }}
            </style>
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """
        
        # Guardar HTML
        print(f"💾 Guardando {html_file}...")
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(full_html)
        
        # Configuración para PDF
        options = {
            'page-size': 'A4',
            'margin-top': '0.75in',
            'margin-right': '0.75in',
            'margin-bottom': '0.75in',
            'margin-left': '0.75in',
            'encoding': "UTF-8",
            'no-outline': None,
            'enable-local-file-access': None
        }
        
        # Convertir HTML a PDF
        print("📄 Generando PDF...")
        pdfkit.from_string(full_html, pdf_file, options=options)
        
        print(f"✅ ¡PDF generado exitosamente: {pdf_file}")
        print(f"📁 Archivos creados:")
        print(f"   - {html_file}")
        print(f"   - {pdf_file}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generando PDF: {str(e)}")
        print("\n💡 Soluciones posibles:")
        print("   1. Instalar wkhtmltopdf: https://wkhtmltopdf.org/downloads.html")
        print("   2. Instalar dependencias: pip install markdown pdfkit")
        print("   3. Verificar permisos de escritura")
        return False

if __name__ == "__main__":
    print("🚀 Generando documentación PDF de Tech Guard Pro...")
    print("=" * 50)
    
    if generar_pdf():
        print("\n🎉 ¡Documentación generada exitosamente!")
        print("📋 El archivo PDF contiene toda la documentación de la API")
        print("🔗 Incluye endpoints, ejemplos, guías de implementación y más")
    else:
        print("\n❌ Error en la generación del PDF")
        print("💡 Revisa los mensajes de error arriba para solucionarlo")
