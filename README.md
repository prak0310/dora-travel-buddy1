# Dora AI: Your Personal Travel Buddy

Dora AI is an interactive, multi-agent travel companion designed to help you with the messy parts of travel—menus, trains, customs, and the gut feeling that you might be missing something.

## Architecture
- **Frontend**: React + Vite (Port 5173)
- **Backend**: Python FastAPI (Port 8000)
- **Workflow Engine**: n8n (Port 5678)

---

## 🛠️ Setup Instructions

We have fully containerized the application so you **do not need to download or install any packages manually**. The Docker setup will automatically install everything listed in our `requirements.txt` and `package.json`.
Run the file locally if deployed version does not work (as below).

### Prerequisites
1. **Docker Desktop** installed and running on your machine.
2. The API keys provided to you separately by our team.

### Step-by-Step Local Deployment

**1. Clone the repository and navigate into it**
```bash
git clone https://github.com/prak0310/dora-travel-buddy1.git
cd dora-travel-buddy1
```

**2. Configure API Keys**
You should have received an `.env` file from us separately (to avoid committing private keys to GitHub). 
Place the `.env` file directly into the **root** of this folder.
It should contain keys like:
- `OPENAI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `REKA_API_KEY`

**3. Run the App using Docker Compose**
Run the following command in your terminal. This will build the containers and download all necessary packages internally:
```bash
docker-compose up -d --build
```

**4. Start the Frontend**
Open a new terminal window (keep the docker containers running), and start the React frontend:
```bash
npm install
npm run dev
```

**5. Access the Application**
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend (Swagger Docs)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **n8n Workflow Dashboard**: [http://localhost:5678](http://localhost:5678)

---

## 🧭 How to Use Dora

Dora is equipped with several features (Food Explorer, Transit Explorer, Fact-Check, Cultural Guide) and a global AI chat. Here are a few ways to test it out!

### 1. General Voice & Text Chat (Home Page)
- On the home page, type a question or **click the Mic icon** to ask something out loud.
- *Sample Query*: "What should I pack for a winter trip to Tokyo?"

### 2. Food Explorer
- Upload a photo of a menu, and Dora will translate and explain it.
- *Sample Usage*: Upload an image of a Japanese or Spanish menu and ask "What are the vegetarian options here?"

### 3. Transit Explorer
- Enter your starting point and destination to get smart transit routes.
- *Sample Usage*: 
  - Origin: `Shinjuku Station`
  - Destination: `Senso-ji Temple`

### 4. Cultural & Fact-Check Explorer
- Point your camera at a cultural site or type in a local custom to verify if it's true!
- *Sample Query*: "Is it rude to tip in restaurants in Japan?"

---

### Shutting Down
When you are done testing the application, you can shut down the backend services gracefully:
```bash
docker-compose down
```
