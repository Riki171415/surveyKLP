import zipfile
import xml.etree.ElementTree as ET
import sys

sys.stdout.reconfigure(encoding='utf-8')

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            
            # The namespace for WordprocessingML
            word_ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
            
            # Find all paragraphs
            paragraphs = []
            for p in tree.iter(word_ns + 'p'):
                texts = [node.text for node in p.iter(word_ns + 't') if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
                    
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {docx_path}: {e}"

if __name__ == '__main__':
    for file in sys.argv[1:]:
        print(f"--- CONTENT OF {file} ---")
        print(extract_text_from_docx(file))
        print("\n")
