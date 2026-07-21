
import os
import json
from dotenv import load_dotenv

load_dotenv()

try:
    from supabase import create_client
except ImportError:
    print("supabase package not installed")
    exit(1)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SECRET_KEY")

print(f"Connecting to Supabase URL: {url}")
print(f"Key preview: {key[:20] if key else 'None'}...")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SECRET_KEY is missing in .env")
    exit(1)

if not os.path.exists("local_db.json"):
    print("Error: local_db.json does not exist")
    exit(1)

with open("local_db.json", "r", encoding="utf-8") as f:
    db_data = json.load(f)

matches_count = len(db_data.get("matches", []))
users_count = len(db_data.get("users", []))
print(f"Loaded local_db.json -> Matches: {matches_count}, Users: {users_count}")

try:
    client = create_client(url, key)
    res = client.table("kv_store").upsert({"key": "sports_predict_db", "value": db_data}).execute()
    print("SUCCESS: Successfully populated Supabase kv_store table!")
    print(res)
except Exception as e:
    print(f"ERROR connecting/writing to Supabase: {e}")
    import traceback
    traceback.print_exc()

