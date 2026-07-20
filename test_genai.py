import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GOOGLE_API_KEY", "")
print("Testing with API Key starting with:", API_KEY[:5])

try:
    client = genai.Client(api_key=API_KEY)
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents='Di hola en 1 palabra.'
    )
    print("Response from gemini-2.0-flash:", response.text)
except Exception as e:
    print("Error with genai:", e)
