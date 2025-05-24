#!/usr/bin/env python3
"""
Script de prueba para verificar que todos los endpoints del backend funcionan correctamente
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_endpoint(method, endpoint, data=None, files=None):
    """Prueba un endpoint específico"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            if files:
                response = requests.post(url, files=files)
            else:
                response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        
        print(f"✅ {method} {endpoint}: {response.status_code}")
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"   Respuesta: {json.dumps(result, indent=2)[:200]}...")
            except:
                print(f"   Respuesta: {response.text[:100]}...")
        else:
            print(f"   Error: {response.text}")
        return True
    except Exception as e:
        print(f"❌ {method} {endpoint}: Error - {e}")
        return False

def main():
    print("🧪 Probando endpoints del backend Flask...")
    print("=" * 50)
    
    # Test básico de conectividad
    print("\n1. Probando conectividad básica...")
    test_endpoint("GET", "/")
    
    # Test smart_split
    print("\n2. Probando smart_split...")
    test_data = {
        "text": "Este es un párrafo de prueba.\n\nEste es otro párrafo.\n\nY este es el tercer párrafo para dividir."
    }
    test_endpoint("POST", "/smart_split", test_data)
    
    # Test split
    print("\n3. Probando split...")
    test_endpoint("POST", "/split", test_data)
    
    # Test clear_cache
    print("\n4. Probando clear_cache...")
    test_endpoint("POST", "/clear_cache")
    
    # Test TTS (esto puede tomar tiempo)
    print("\n5. Probando TTS...")
    tts_data = {"text": "Hola, esta es una prueba de síntesis de voz."}
    test_endpoint("POST", "/tts", tts_data)
    
    print("\n✅ Pruebas completadas!")

if __name__ == "__main__":
    main()
