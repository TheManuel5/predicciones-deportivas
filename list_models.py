import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GOOGLE_API_KEY", "")

try:
    client = genai.Client(api_key=API_KEY)
    print("Available models:")
    for model in client.models.list():
        print(model.name)
except Exception as e:
    print("Error listing models:", e)
