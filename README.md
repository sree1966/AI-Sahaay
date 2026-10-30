# AI-Powered Government Policy & Welfare Assistant (AI Sahaay)

## About the Project

AI Sahaay is an AI-powered chatbot designed to help people discover and understand government welfare schemes and policies. It allows users to ask questions in natural language and receive relevant information about available schemes, eligibility criteria, benefits, and application procedures.

The system uses Natural Language Processing (NLP), semantic search, and Generative AI to make government scheme information easier to access and understand. It aims to simplify the process of finding suitable welfare schemes based on users' queries and profile details.

## Key Features

- **AI-Powered Chatbot:** Provides responses to users' questions about government welfare schemes.
- **Semantic Search:** Retrieves relevant scheme information based on the meaning of a query.
- **Eligibility Assistance:** Helps users understand scheme eligibility requirements.
- **Personalized Assistance:** Uses available user profile information to support relevant scheme discovery.
- **Bilingual Support:** Supports queries and responses in English and Tamil.
- **Contextual Responses:** Uses retrieved information to generate relevant answers.
- **User-Friendly Interface:** Provides an interactive web-based experience.

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI

### AI and NLP
- Sentence Transformers
- Google Gemini API
- Natural Language Processing
- Semantic Search

### Vector Database
- ChromaDB

### Data Processing
- Pandas
- CSV-based scheme dataset

## System Architecture

1. The user enters a question through the React-based interface.
2. The frontend sends the query to the FastAPI backend.
3. The backend processes the query and extracts relevant profile information when available.
4. Sentence Transformers convert the query into vector embeddings.
5. ChromaDB retrieves semantically relevant government scheme information.
6. The retrieved context is passed to the Gemini model.
7. Gemini generates a contextual response based on the retrieved information.
8. The response is returned to the frontend and displayed to the user.

## Project Structure

```text
AI-Sahaay/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── main.py
│   ├── ingest.py
│   ├── local_embeddings.py
│   ├── gemini_models.py
│   ├── network.py
│   ├── requirements.txt
│   └── data/
│       ├── schemes.csv
│       └── chroma_db/
│
└── README.md
```

*Note: Adjust the folder structure above to match the actual files in your repository.*

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd AI-Sahaay
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Setup

Open a new terminal:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/macOS:**
```bash
source venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

### 4. Configure API Key

Configure your Google Gemini API key using the environment variable expected by the backend code. Do not upload API keys or other secrets to GitHub.

### 5. Prepare the Scheme Dataset

Place the government scheme dataset in the expected location:

```text
backend/data/schemes.csv
```

Run the ingestion script to process the dataset and create the vector database, following the project's configuration:

```bash
python ingest.py
```

### 6. Run the Backend

```bash
uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Root endpoint |
| GET | `/health` | Checks backend health |
| GET | `/filters` | Retrieves available filters |
| POST | `/ask` | Processes user questions |

## Future Enhancements

- Expand the government scheme database.
- Improve personalized scheme recommendations.
- Add support for more regional languages.
- Integrate official government portals and verified scheme sources.
- Improve retrieval accuracy and response evaluation.
- Develop a mobile-friendly application.
- Add multilingual voice-based interaction.

## Project Domain

Artificial Intelligence, Natural Language Processing, Computational Linguistics, Information Retrieval, and Generative AI.

## Academic Project

**Project Title:** AI-Powered Government Policy & Welfare Assistant  
**Application Name:** AI Sahaay  
**Course:** CSI4001 – Natural Language Processing and Computational Linguistics

---

**AI Sahaay – Making Government Welfare Information Easier to Access.**
