# ⚽ Predicciones Deportivas AI 🧠📊
Plataforma inteligente de predicción y análisis estadístico de eventos deportivos combinando modelos de **Machine Learning** y la API de **Google Gemini 2.0 Flash**.
---
## 🚀 Tecnologías
* **Backend:** FastAPI / Python 3.10+
* **Inteligencia Artificial:** Google Gemini AI (`gemini-2.0-flash`)
* **Machine Learning:** Scikit-Learn, Pandas, NumPy, Joblib
* **Base de Datos & Storage:** Supabase / PostgreSQL
* **Despliegue:** Render
---
## 📂 Estructura del Proyecto
* `main.py` / `app.py`: Servidor API y endpoints principales.
* `train_models.py` & `models/`: Entrenamiento y serialización de modelos predictivos.
* `feature_engineering.py`: Procesamiento de datos y métricas deportivas.
* `estadisticas.py` & `reports.py`: Generación de análisis y métricas de desempeño.
* `frontend/`: Interfaz de usuario para visualización de predicciones.
---
## 🛠️ Instalación y Uso Local
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TheManuel5/predicciones-deportivas.git
   cd predicciones-deportivas
Crear y activar entorno virtual:

bash
python -m venv venv
# En Windows:
venv\Scripts\activate
Instalar dependencias:

bash
pip install -r requirements.txt
Variables de entorno: Configura tu archivo .env con las claves requeridas:

env
GEMINI_API_KEY=tu_api_key
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_key
Iniciar el servidor:

bash
uvicorn main:app --reload
👤 Autor
Manuel - @TheManuel5
