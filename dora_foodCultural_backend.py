# --- Standard Library ---
import os
import io
import re
import json
import base64
import asyncio
import tempfile
import traceback
from contextlib import asynccontextmanager
from typing import List, Optional

# --- Third-Party Frameworks & Utilities ---
import uvicorn
import httpx
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# --- AI & Media Processing ---
import whisper
from openai import AsyncOpenAI
from gtts import gTTS
from google.cloud import vision

'''Testing payloads:
1. Explore Tab (Text Search):
{
  "latitude": 33.59126906416694,
  "longitude": 130.41813782640003,
  "dietary_restrictions": [
    "no beef", "no seafood"
  ],
  "budget": "SGD 50",
  "cravings": "ramen",
  "radius_meters": 1500
}

2. Camera Tab (Image Upload via Multipart Form):
file: [binary image]
preferences: {"latitude": 33.59126906416694, "longitude": 130.41813782640003, "dietary_restrictions": ["no beef", "no seafood"], "budget": "SGD 50"}
'''

'''
==========================================
1. CONFIGURATION & SETUP

- initialise app, API keys for Google Places and Reka, base URLs 
- initialise reka client 
- we use ansynchronous API calls to OpenAI to ensure multiple API calls @ same time 
    - must use await before API call (to make sure server continues waits for response)

Sync: program blocks and waits for a response from the OpenAI server before proceeding to the next line of code.
Async: program initiates a request and continues executing other tasks while waiting for the server to reply.
==========================================
'''

# Load env variables FIRST before initializing clients
load_dotenv()

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
REKA_API_KEY = os.getenv("REKA_API_KEY")

print("REKA loaded:", bool(REKA_API_KEY))
print("Google loaded:", bool(GOOGLE_PLACES_API_KEY))

if not REKA_API_KEY:
    raise ValueError(
        "REKA_API_KEY not found. Check that your .env exists and contains REKA_API_KEY."
    )

GOOGLE_KEY_FILE_PATH = "/Users/vlsurya/Desktop/summerbuild/project-9488ae86-552a-416e-a85-06c497305993.json"

# ==========================================
# APP and CORS and LIFESPAN
# ==========================================

whisper_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global whisper_model
    print("Loading Whisper...")
    whisper_model = whisper.load_model("base")
    print("Whisper model loaded")
    yield # This tells FastAPI to start accepting requests now
    print("Shutting down...")

app = FastAPI(
    title="Dora Food & Menu Intelligence Agent",
    description="Unified endpoint for image-based menu translation, storefront exploration, and nearby discovery.",
    version="3.0.0",
    lifespan=lifespan
)

# This tells the browser: "Yes, the frontend is allowed to talk to me!"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, you'd put your exact frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# CLIENTS
# ==========================================
# Client 1: Reka Chat API (OpenAI-compatible) — for reka-flash text/multimodal chat
reka_client = AsyncOpenAI(
    base_url="https://api.reka.ai/v1",
    api_key=REKA_API_KEY
)

# Client 2: Reka Vision API — for managed video/image upload, search, and Q&A
# Uses X-Api-Key header auth, NOT the OpenAI SDK
REKA_VISION_BASE_URL = "https://vision-agent.api.reka.ai"
reka_vision_headers = {
    "X-Api-Key": REKA_API_KEY,
    "Content-Type": "application/json"
}

# ==========================================
# 2. Pydantic Schemas
# ==========================================
class SceneRequest(BaseModel):
    image_base64: str
    location: str

class SceneResponse(BaseModel):
    translation_and_context: str
    customs_and_etiquette: str
    slang_phrase: str
    slang_explanation: str
    slang_audio_base64: str

class VoiceChatResponse(BaseModel):
    user_transcript: str
    dora_text_response: str
    dora_audio_base64: str

class ExploreRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None # NEW: User can just type "Orchard Road" or postal code
    dietary_restrictions: List[str]
    budget: str
    cravings: Optional[str] = None
    radius_meters: int = 1500

class FoodAgentResponse(BaseModel):
    mode: str  # "menu_translation", "storefront_analysis", or "nearby_explore"
    primary_headline: str
    structured_recommendations: str  # Markdown text containing context, translation, and custom recommendations


# ==========================================
# 3. Prompt Engineering & External APIs
# ==========================================
def generate_reka_prompt(places_data: List[dict], user_prefs: ExploreRequest) -> str:
    # Note: Curly braces for the JSON schema are double-escaped {{ }} so the f-string doesn't crash
    return f"""
    You are an expert local culinary guide and cultural assistant. 
    A user is at location {user_prefs.latitude}, {user_prefs.longitude}.
    They have the following dietary restrictions: {user_prefs.dietary_restrictions}.
    Their budget is {user_prefs.budget} and they are craving {user_prefs.cravings}.

    Here are nearby restaurants retrieved from Google Places:
    {json.dumps(places_data, indent=2)}

    Analyze these restaurants. Select the best 5 that fit the user's criteria, rank them based on their closeness to the user's criteria.
    For each selected restaurant, provide:
    1. A reason for recommending it based on their preferences.
    2. 2-3 specific local dishes they should try.
    3. For each dish, explain any unfamiliar local ingredients.
    4. For each dish, explicitly verify that it complies with their dietary restrictions.
    5. Provide cultural context or local etiquette related to ordering or eating these dishes.

    Return the output STRICTLY as a clean Markdown list of restaurants. For each restaurant, use this structure exactly:
    ### [Restaurant Name]
    - **Navigation**: [📍 Open in Google Maps](Use the exact "maps_url" string provided in the data for this restaurant)
    - **Address**: [Address]
    - **Rating**: [Rating]/5
    - **Why We Recommend**: [Reason]
    - **Must-Try Dishes**:
      * **[Dish Name]**
        - *Ingredients*: [Ingredients, especially unfamiliar ones]
        - *Dietary Verification*: [Safety Check]
        - *Price*: [price]
        - *How to Eat This Like a Local*: [Provide specific instructions on etiquette, mixing requirements, dipping sauces, or hand styling if any]
        - *What to Ask the Staff*: [Provide a helpful phrase or question to ask the waiter if unsure about ingredients, preparation, or spice adjustments]
        - *Local Slang / Ordering Tidbit*: [Provide a fun micro-phrase, shorthand nickname, or local slang context for ordering this dish]

    DO NOT use JSON curly braces or brackets. Just use headers and bullets.
    DO NOT append price ranges or currency text inside the "dish_name" strings.
    Ensure every quote opens and closes cleanly without random spaces.
    """

async def call_reka_api(prompt: str) -> str:
    if not REKA_API_KEY:
        raise HTTPException(status_code=500, detail="Reka API key is missing.")

    client = AsyncOpenAI(
        base_url="https://api.reka.ai/v1",
        api_key=REKA_API_KEY
    )

    try:
        completion = await client.chat.completions.create(
            model="reka-flash-research", 
            messages=[{"role": "user", "content": prompt}],
            # FORCE Reka to speak strictly in JSON objects
            # response_format={"type": "json_object"} 
        )

        raw_text = completion.choices[0].message.content
        print("REKA RETURNED")
        return raw_text
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
async def fetch_nearby_restaurants(lat: float, lng: float, radius: int, query: Optional[str] = None) -> List[dict]:
    if not GOOGLE_PLACES_API_KEY:
        print("Warning: GOOGLE_PLACES_API_KEY missing.")
        return []
    
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    search_query = f"{query} restaurant" if query else "restaurant"
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "query": search_query,
        "key": GOOGLE_PLACES_API_KEY
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=10)
        if response.status_code != 200:
            return []
        results = response.json().get("results", [])[:5]  # Limit to top 5 to keep token context concise
        
        print("GOOGLE API RETURNED")
        places = []
        for r in results:
            places.append({
                "name": r.get("name"),
                "address": r.get("formatted_address"),
                "rating": r.get("rating"),
                "maps_url": f"https://www.google.com/maps/place/?q=place_id:{r.get('place_id')}"
            })
        return places

async def geocode_address(address: str) -> tuple[float, float]:
    """Converts a text address or postal code into Latitude and Longitude."""
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google API Key missing.")
    
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": address, "key": GOOGLE_PLACES_API_KEY}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        
        if data.get("status") == "OK" and data.get("results"):
            loc = data["results"][0]["geometry"]["location"]
            return loc["lat"], loc["lng"]
        else:
            raise HTTPException(status_code=400, detail=f"Google Geocoding Failed: {data.get('status')}")

def generate_free_audio(text: str, lang_code: str = 'en') -> str:
    try:
        tts = gTTS(text=text, lang=lang_code, slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return f"data:audio/mp3;base64,{base64.b64encode(fp.read()).decode('utf-8')}"
    except Exception as e:
        print(f"TTS Error: {e}")
        return ""

def get_google_landmark_sync(clean_b64: str) -> str:
    """Agent 1: Synchronous Google Vision extraction via Service Account key file."""
    try:
        if not os.path.exists(GOOGLE_KEY_FILE_PATH):
            print(f"Warning: Key file not found at {GOOGLE_KEY_FILE_PATH}. Skipping Google Vision.")
            return "Unknown Landmark"

        # Explicitly loading credentials directly from your local file
        client = vision.ImageAnnotatorClient.from_service_account_file(GOOGLE_KEY_FILE_PATH)
        image = vision.Image(content=base64.b64decode(clean_b64))
        
        response = client.landmark_detection(image=image)
        landmarks = response.landmark_annotations
        
        if landmarks:
            return landmarks[0].description
        return "Unknown Landmark"
    except Exception as e:
        print(f"Google Vision internal exception: {str(e)}")
        return "Unknown Landmark"

async def analyze_scene_with_reka(image_input: str, location: str) -> dict:
    """The Multi-Agent Orchestrator: Google (Identity) + Reka (OCR/Context) -> Reka (Brain)"""
    
    # 1. Image Processing
    if os.path.exists(image_input):
        with open(image_input, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            image_b64 = f"data:image/jpeg;base64,{encoded_string}"
    else:
        image_b64 = image_input

    if not image_b64.startswith("data:image"):
        image_b64 = f"data:image/jpeg;base64,{image_b64}"

    clean_b64 = image_b64.split(",")[1] if "," in image_b64 else image_b64

    # ==========================================
    # STEP 1: PARALLEL EXTRACTION (Google + Reka)
    # ==========================================
    extraction_prompt = f"""
    You are an expert visual extractor. The user is in {location}. Look at this image:
    1. Transcribe ALL visible text perfectly (especially characters on banners, plaques, or signs).
    2. Describe the exact distinct physical features, shapes, and materials of the statue, monument, or scene.
    Do not guess the historical context yet, just tell me exactly what is physically there and what the text says.
    """

    # Wrap the synchronous Google call in an executor so it runs concurrently with Reka
    loop = asyncio.get_event_loop()
    google_task = loop.run_in_executor(None, get_google_landmark_sync, clean_b64)
    
    reka_vision_task = reka_client.chat.completions.create(
        model="reka-flash",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": extraction_prompt},
                    {"type": "image_url", "image_url": {"url": image_b64}}
                ]
            }
        ]
    )
    
    landmark_name, vision_response = await asyncio.gather(google_task, reka_vision_task)
    visual_evidence = vision_response.choices[0].message.content
    
    print(f"\n--- AGENT 1 (GOOGLE DETECTED): {landmark_name} ---")
    print(f"--- AGENT 2 (REKA OCR EVIDENCE):\n{visual_evidence}\n---------------------------------------\n")

    # ==========================================
    # STEP 2: THE "BRAIN" (Factual Grounding)
    # ==========================================
    research_prompt = f"""
    You are an expert local historian, cultural guide, and translator. 
    A user traveling in {location} is looking at a scene.
    Google Vision has factually identified this exact location as: "{landmark_name}".
    The user's camera shows this exact text and imagery: "{visual_evidence}".
    
    Using the verified location name and visual evidence, provide a highly accurate cultural guide. 
    
    Return your response strictly as a FLAT JSON object. The values MUST be simple text strings. DO NOT use nested objects or arrays. Use these exact keys:
    - "translation_and_context": State the EXACT name of the monument/place. Explain the history and cultural significance of {landmark_name}. Translate any text found in the visual evidence.
    - "customs_and_etiquette": Local customs, behavioral expectations, and strict taboos relevant to this SPECIFIC place (e.g., if it's a solemn memorial, mention silence and dress codes). Be highly sensitive to the tone of the location.
    - "slang_phrase": ONE short, respectful, and highly relevant local phrase or greeting to use here (in the local language). Provide the phonetic respelling in English for tourists to read alongside the audio.
    - "slang_explanation": What that phrase means in English.
    
    Descriptions must be direct, concise and readable on-the-go. 
    """

    research_response = await reka_client.chat.completions.create(
        model="reka-flash",
        messages=[
            {"role": "user", "content": research_prompt}
        ]
    )
    
    raw_content = research_response.choices[0].message.content
    
    # ==========================================
    # STEP 3: BULLETPROOF REGEX & FLATTENER PARSER
    # ==========================================
    try:
        json_match = re.search(r'\{.*\}', raw_content, re.DOTALL)
        clean_json_string = json_match.group(0) if json_match else raw_content
        parsed_data = json.loads(clean_json_string)

        for key in ["translation_and_context", "customs_and_etiquette", "slang_phrase", "slang_explanation"]:
            if key in parsed_data and isinstance(parsed_data[key], dict):
                parsed_data[key] = " ".join([str(v) for v in parsed_data[key].values()])
            elif key in parsed_data and isinstance(parsed_data[key], list):
                parsed_data[key] = " ".join([str(v) for v in parsed_data[key]])

        return parsed_data

    except json.JSONDecodeError:
        print(f"Failed to parse Agentic output: {raw_content}")
        raise HTTPException(status_code=500, detail="Agentic AI failed to output valid JSON.")

# ==========================================
# 4. Unified Core Agent Flow (API Routes)
# ==========================================

@app.post("/api/v1/analyze-scene", response_model=SceneResponse)
async def process_scene(req: SceneRequest):
    print("IMAGE START:")
    print(req.image_base64[:200])
    print("IMAGE END")
    """Analyzes an inline base64 image using Reka Chat (reka-flash)."""
    try:
        reka_data = await analyze_scene_with_reka(req.image_base64, req.location)
        audio_b64 = generate_free_audio(reka_data.get("slang_phrase", ""), lang_code='en')
        return SceneResponse(
            translation_and_context=reka_data.get("translation_and_context", ""),
            customs_and_etiquette=reka_data.get("customs_and_etiquette", ""),
            slang_phrase=reka_data.get("slang_phrase", ""),
            slang_explanation=reka_data.get("slang_explanation", ""),
            slang_audio_base64=audio_b64
        )
    except Exception as e:
        # If an unhandled exception bubbles up, it logs out the full text for testing
        print(f"ROUTE CRASHED. Stack trace detail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server Exception: {str(type(e).__name__)} - {str(e)}")


@app.post(
    "/api/v1/voice-chat",
    response_model=VoiceChatResponse
)
async def process_voice_chat(
    audio_file: UploadFile = File(...),
    location: str = "Unknown"
):

    global whisper_model

    if whisper_model is None:
        raise HTTPException(
            status_code=503,
            detail="Whisper still loading"
        )

    temp_path = None

    try:

        audio_bytes = await audio_file.read()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".wav"
        ) as tmp:

            tmp.write(audio_bytes)
            temp_path = tmp.name

        result = whisper_model.transcribe(
            temp_path,
            fp16=False
        )

        user_text = (
            result["text"]
            .strip()
        )

        print("TRANSCRIPT:", user_text)

        response = (
            await reka_client.chat.completions.create(
                model="reka-flash",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"You are Dora, a helpful travel companion "
                            f"in {location}. "
                            f"Keep responses under 3 sentences."
                        ),
                    },
                    {
                        "role": "user",
                        "content": user_text,
                    },
                ],
            )
        )

        dora_text = (
            response
            .choices[0]
            .message
            .content
        )

        return VoiceChatResponse(
            user_transcript=user_text,
            dora_text_response=dora_text,
            dora_audio_base64=generate_free_audio(
                dora_text
            ),
        )

    except Exception as e:

        print("VOICE ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail="Voice processing failed"
        )

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/api/v1/explore", response_model=FoodAgentResponse)
async def explore_nearby(req: ExploreRequest):
    """Tab 1: Traditional nearby search & discovery (No image upload)."""
    try:
        lat, lng = req.latitude, req.longitude
        if lat is None or lng is None or (lat == 0 and lng == 0):
            if req.address:
                lat, lng = await geocode_address(req.address)
            else:
                raise HTTPException(status_code=400, detail="Must provide either coordinates or an address.")
            
        raw_places = await fetch_nearby_restaurants(
            lat=lat,
            lng=lng,
            radius=req.radius_meters,
            query=req.cravings
        )
        
        if not raw_places:
            raise HTTPException(status_code=404, detail="No matching restaurants found nearby.")

        # Integrated original prompt and research call logic
        prompt = generate_reka_prompt(raw_places, req)
        enriched_data = await call_reka_api(prompt)
        
        return FoodAgentResponse(
            mode="nearby_explore",
            primary_headline=f"Top culinary spots near your location matching '{req.cravings or 'local flavor'}'",
            structured_recommendations=enriched_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/camera-intel", response_model=FoodAgentResponse)
async def process_camera_upload(
    file: UploadFile = File(...),
    preferences: str = Form(...)  # Expected to be a JSON string from frontend/n8n containing coordinates & preferences
):
    """Tab 2: Camera intelligence pipeline. Automatically classifies if image is a menu/dish or storefront."""
    try:
        # 1. Parse preferences JSON string safely
        try:
            prefs_dict = json.loads(preferences)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in 'preferences' form field.")

        lat = prefs_dict.get("latitude")
        lng = prefs_dict.get("longitude")
        address = prefs_dict.get("address")
        
        # Determine coordinates
        if lat is None or lng is None or (lat == 0 and lng == 0):
            if address:
                lat, lng = await geocode_address(address)
            else:
                raise HTTPException(status_code=400, detail="Must provide either coordinates or an address.")
            
        dietary = prefs_dict.get("dietary_restrictions", [])
        budget = prefs_dict.get("budget", "Flexible")

        # 2. Read and encode file bytes to Base64
        file_bytes = await file.read()
        encoded_image = base64.b64encode(file_bytes).decode('utf-8')
        image_url = f"data:{file.content_type};base64,{encoded_image}"

        # ==========================================
        # STEP 1: CLASSIFICATION & DATA EXTRACTION
        # ==========================================
        router_prompt = """
        Analyze this image uploaded by a traveler. You must perform two distinct tasks:
        1. Classify this image into exactly one of two categories:
            1a) "MENU_OR_DISH": If the image shows a physical food menu, order sheet, food item, or individual dish.
            1b) "STOREFRONT_OR_SIGN": If the image shows a restaurant exterior, building facade, street sign, or indoor entryway.
        2. Execute data extraction based on classification:
           2a) If MENU_OR_DISH: Transcribe and translate all items, descriptions, and structural headers into English.
           2b) If STOREFRONT_OR_SIGN: Extract the exact text, name, or branding visible on the building or signage. 

        Output your response strictly as a clean JSON object with two fields: "classification" and "extracted_content".
        """

        classification_resp = await reka_client.chat.completions.create(
            model="reka-flash",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": router_prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ]
        )
        
        # Parse routing metadata safely
        raw_meta = classification_resp.choices[0].message.content
        json_match = re.search(r'\{.*\}', raw_meta, re.DOTALL)
        meta_data = json.loads(json_match.group(0)) if json_match else {"classification": "MENU_OR_DISH", "extracted_content": raw_meta}
        
        img_type = meta_data.get("classification", "MENU_OR_DISH")
        extracted_text = meta_data.get("extracted_content", "")
        
        print(f"Classfication done: {img_type}")

        # ==========================================
        # STEP 2: CONTEXTUAL ROUTING & ENRICHMENT
        # ==========================================
        if img_type == "MENU_OR_DISH":
            # Flow A: The user is looking directly at a menu. Translate and match to diet.
            final_prompt = f"""
            You are a menu interpreter. A traveler has uploaded a menu image.
            Here is the raw extracted/translated text content found on the menu:
            "{extracted_text}"

            Cross-reference this menu against the user's constraints:
            - Dietary Restrictions: {', '.join(dietary) if dietary else 'None'}
            - Target Budget: {budget}

            Tasks:
            1. Render a clean English translation map of the menu options.
            2. Flags safe items that match their dietary criteria. Explicitly warn against items containing allergens or restricted ingredients.
            3. Recommend the top 3 standout choices on this menu tailored to them.

            Format your response in structured Markdown text.
            """
            headline = "Menu Live-Translation & Dietary Safety Check"
            
        else:
            # Flow B: The user is standing outside a restaurant. Find what it is, then pull recommendations.
            nearby_context = await fetch_nearby_restaurants(lat=lat, lng=lng, radius=200, query=extracted_text)
            
            final_prompt = f"""
            You are a local culinary tracker. The traveler took a photo of a restaurant exterior/signage.
            Signage Text Extracted: "{extracted_text}"
            Potential physical matches near their GPS location: {json.dumps(nearby_context, indent=2)}
            
            Traveler Profile:
            - Dietary Constraints: {', '.join(dietary) if dietary else 'None'}
            - Budget: {budget}

            Tasks:
            1. Identify which restaurant they are standing in front of using the signage text and nearby context matches. Translate the name.
            2. Provide an insider culinary summary of this specific restaurant.
            3. Suggest exactly what dishes they should order here that align perfectly with their dietary profile. Include an explanation of local food concepts.

            Format your response in structured Markdown text.
            """
            headline = "Restaurant Storefront Identity & Custom Dish Selection Guide"

        # Final generation execution
        final_enrichment_resp = await reka_client.chat.completions.create(
            model="reka-flash-research",
            messages=[{"role": "user", "content": final_prompt}]
        )
        print("REKA RESPONSE RETURNED")

        return FoodAgentResponse(
            mode=img_type.lower(),
            primary_headline=headline,
            structured_recommendations=final_enrichment_resp.choices[0].message.content
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("dora_foodCultural_backend:app", host="0.0.0.0", port=8000, reload=True)