from PyPDF2 import PdfReader
import io

def extract_text_from_pdf(pdf_bytes):

    pdf_stream = io.BytesIO(pdf_bytes)
    reader = PdfReader(pdf_stream)

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text

    return text