import os

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('"id": "gemini-flash-latest",', '"id": "admin_user",')
content = content.replace("model='gemini-1.5-flash',", "model='gemini-flash-latest',")
with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("model='gemini-1.5-flash',", "model='gemini-flash-latest',")
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed")
