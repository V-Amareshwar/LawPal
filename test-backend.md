# Backend Connection Diagnostics

## Current Configuration
- Frontend: http://localhost:5173
- Vite Proxy: `/api/*` → `https://33823d127299.ngrok-free.app/*`
- API Client (dev): calls `/api/ask` → proxied to `https://33823d127299.ngrok-free.app/ask`

## Expected Colab Backend Requirements

Your Google Colab notebook MUST have:

1. **A Flask or FastAPI server running** (not just the data processing script)
2. **POST /ask endpoint** that accepts JSON: `{ "query": "user question" }`
3. **Returns JSON**: `{ "answer": "response text" }` or `{ "error": "error message" }`
4. **ngrok tunnel** pointing to the server port

## Test the Backend Directly (PowerShell)

Run this to check if your Colab backend is responding:

```powershell
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    query = "test question"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://33823d127299.ngrok-free.app" -Method POST -Headers $headers -Body $body
```

**Expected Success Response:**
- Status: 200
- Body: `{"answer": "..."}`

**Current Error (500):**
- Your Colab backend received the request
- Something inside the /ask handler is crashing
- Most common causes:
  1. GROQ_API_KEY not set in Colab environment
  2. Model/embedding not initialized before first request
  3. Chroma collection path issue
  4. Exception in retrieval or generation pipeline

## What to Check in Your Colab Notebook

### 1. Verify you have a Flask/FastAPI app:

**Flask Example:**
```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow frontend to call

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # Your RAG pipeline here
        answer = process_query(query)  # Call your existing functions
        
        return jsonify({"answer": answer})
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
```

**FastAPI Example:**
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ask")
async def ask(request: Request):
    try:
        data = await request.json()
        query = data.get("query", "")
        
        # Your RAG pipeline here
        answer = process_query(query)
        
        return {"answer": answer}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
```

### 2. Start ngrok in Colab:

```python
!pip install pyngrok flask flask-cors

from pyngrok import ngrok

# Start Flask in background
import threading
def run_app():
    app.run(port=5000)

thread = threading.Thread(target=run_app)
thread.start()

# Create ngrok tunnel
public_url = ngrok.connect(5000)
print(f"🌐 Public URL: {public_url}")
```

### 3. Check Colab Output

After sending a request from the frontend, check your Colab cell output for:
- The incoming POST request log
- Any Python exceptions or stack traces
- Print statements showing where it fails

## Next Steps

1. **Restart Vite dev server** (the proxy change requires restart):
   ```powershell
   # In the terminal running npm run dev, press Ctrl+C, then:
   npm run dev
   ```

2. **Send a message from the frontend**

3. **Check Colab output** for errors

4. **Copy the exact error/traceback** from Colab and share it

## Common Fixes

### If GROQ_API_KEY missing:
```python
import os
os.environ['GROQ_API_KEY'] = 'gsk_...'  # Paste your key
```

### If models not loaded:
Make sure these are initialized BEFORE app.run():
```python
embedding_model = SentenceTransformer("BAAI/bge-large-en-v1.5")
client = Groq(api_key=os.getenv('GROQ_API_KEY'))
# ... initialize your Chroma collection, BM25, etc.
```

### If ngrok URL changed:
Update `vite.config.ts` target to the new URL and restart Vite.
