import pdfplumber
import io


def extract_text_from_pdf(pdf_bytes):
    text = ""

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

    return text