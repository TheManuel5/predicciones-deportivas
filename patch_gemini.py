import os

# PATCH APP.PY
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import google.generativeai as genai', 'from google import genai\\nfrom google.genai import types')
content = content.replace('genai.configure(api_key=api_key)', '')

old_get_response = '''        model = genai.GenerativeModel("gemini-pro")
        
        if audio_data:
            # Procesar audio
            prompt_parts = [
                prompt_text,
                {
                    "inline_data": {
                        "mime_type": "audio/wav",
                        "data": audio_data
                    }
                }
            ]
            response = model.generate_content(prompt_parts)
        else:
            # Procesar solo texto
            full_prompt = f"{prompt_text}\\n\\nPregunta del usuario: {user_message}"
            response = model.generate_content(full_prompt)
        return response.text'''

new_get_response = '''        api_key = st.session_state.get("gemini_api_key")
        if not api_key:
            try:
                api_key = st.secrets.get("GOOGLE_API_KEY")
            except:
                pass
        
        client = genai.Client(api_key=api_key)
        
        if audio_data:
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=[
                    prompt_text,
                    types.Part.from_bytes(
                        data=audio_data,
                        mime_type="audio/wav"
                    )
                ]
            )
        else:
            full_prompt = f"{prompt_text}\\n\\nPregunta del usuario: {user_message}"
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=full_prompt
            )
        return response.text'''

content = content.replace(old_get_response, new_get_response)

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

# PATCH MAIN.PY
with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import google.generativeai as genai', 'from google import genai\\nfrom google.genai import types')

old_main_endpoint = '''    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-pro")
        
        prompt_text = "Eres un asistente experto en predicciones deportivas para SportsPredict Pro. Ayuda a los usuarios a interpretar predicciones y estadísticas."
        
        if audio:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio.split(",")[1] if "," in audio else audio)
            prompt_parts = [
                prompt_text,
                {
                    "inline_data": {
                        "mime_type": "audio/webm",
                        "data": audio_bytes
                    }
                }
            ]
            if message:
                prompt_parts.append(f"\\n\\nUsuario: {message}")
            response = model.generate_content(prompt_parts)
        else:
            full_prompt = f"{prompt_text}\\n\\nUsuario: {message}"
            response = model.generate_content(full_prompt)
            
        return {"response": response.text}'''

new_main_endpoint = '''    try:
        client = genai.Client(api_key=api_key)
        
        prompt_text = "Eres un asistente experto en predicciones deportivas para SportsPredict Pro. Ayuda a los usuarios a interpretar predicciones y estadísticas."
        
        if audio:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio.split(",")[1] if "," in audio else audio)
            
            contents = [
                prompt_text,
                types.Part.from_bytes(data=audio_bytes, mime_type="audio/webm")
            ]
            if message:
                contents.append(f"\\n\\nUsuario: {message}")
                
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=contents
            )
        else:
            full_prompt = f"{prompt_text}\\n\\nUsuario: {message}"
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=full_prompt
            )
            
        return {"response": response.text}'''

content = content.replace(old_main_endpoint, new_main_endpoint)

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch complete")
