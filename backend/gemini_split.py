import requests
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY

def split_paragraphs_with_gemini(text, language='es'):
    prompt = (
        f"Eres un asistente experto en procesamiento de texto para TTS. "
        f"Divide el siguiente texto en una lista JSON de párrafos naturales, cada uno de máximo 400 caracteres, sin cortar frases ni ideas. "
        f"Cada elemento debe ser un párrafo completo, nunca cortes una frase a la mitad. Si un párrafo es muy largo, divídelo solo en puntos naturales (puntos, saltos de tema, etc). "
        f"No expliques nada, responde solo con la lista JSON.\n\nTexto:\n{text}"
    )
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    try:
        response = requests.post(GEMINI_API_URL, json=data, timeout=60)
        response.raise_for_status()
        result = response.json()
        import json as pyjson
        import re
        text_out = result['candidates'][0]['content']['parts'][0]['text']
        # Mejor extracción: busca la lista JSON más grande
        matches = re.findall(r'\[.*?\]', text_out, re.DOTALL)
        if matches:
            # Elige la lista más larga (más probable que sea la correcta)
            best = max(matches, key=len)
            return pyjson.loads(best)
        # Si no, intentar parsear todo
        return pyjson.loads(text_out)
    except Exception as e:
        print(f"Error usando Gemini: {e}")
        return None
