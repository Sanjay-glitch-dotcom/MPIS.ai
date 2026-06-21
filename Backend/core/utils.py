import os
import cv2
import numpy as np
from deepface import DeepFace
from django.conf import settings

def extract_face_embedding(image_path):
    """
    Extract facial embedding from an image using DeepFace.
    Returns a list of floats representing the embedding, or None if no face found.
    """
    try:
        # We use Facenet model which produces 128D embeddings.
        result = DeepFace.represent(img_path=image_path, model_name="Facenet", enforce_detection=True)
        if len(result) > 0:
            return result[0]["embedding"]
    except Exception as e:
        print(f"Error extracting embedding: {e}")
    return None

def cosine_similarity(vec1, vec2):
    """
    Compute cosine similarity between two vectors.
    """
    if vec1 is None or vec2 is None:
        return 0.0
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    dot_product = np.dot(vec1, vec2)
    norm_a = np.linalg.norm(vec1)
    norm_b = np.linalg.norm(vec2)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def process_video_for_faces(video_path, max_frames_to_analyze=10):
    """
    Extracts frames from a video and attempts to find faces.
    Returns a list of dicts: [{'embedding': [...], 'frame': numpy_array, 'timestamp_sec': float}]
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30 # fallback

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    # Step to grab frames evenly across the video
    step = max(1, total_frames // max_frames_to_analyze)

    extracted_faces = []
    
    current_frame = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if current_frame % step == 0:
            timestamp = current_frame / fps
            try:
                # DeepFace can accept numpy arrays. Enforce_detection ensures we only process if a face exists.
                result = DeepFace.represent(img_path=frame, model_name="Facenet", enforce_detection=True)
                if len(result) > 0:
                    extracted_faces.append({
                        'embedding': result[0]["embedding"],
                        'frame': frame,
                        'timestamp_sec': round(timestamp, 2)
                    })
            except Exception as e:
                # No face detected in this frame
                pass
                
        current_frame += 1
        
        # Stop early if we have reached our quota (to save CPU)
        if len(extracted_faces) >= max_frames_to_analyze:
            break

    cap.release()
    return extracted_faces

# Lazy load sentence transformer to avoid blocking startup
_nlp_model = None

def get_nlp_model():
    global _nlp_model
    if _nlp_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _nlp_model = SentenceTransformer('all-MiniLM-L6-v2')
        except ImportError:
            print("SentenceTransformer not installed.")
    return _nlp_model

def extract_text_embedding(text):
    """
    Extract NLP embedding for description matching.
    """
    if not text:
        return None
    model = get_nlp_model()
    if model:
        # returns numpy array
        return model.encode(text).tolist()
    return None

def calculate_geo_score(lat1, lon1, lat2, lon2):
    """
    Returns a normalized geo score from 0.0 to 1.0 based on distance.
    If coordinates are missing, returns 0.0.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0.0
    try:
        from geopy.distance import geodesic
        dist_km = geodesic((lat1, lon1), (lat2, lon2)).kilometers
        
        # Scoring logic: 
        # < 10 km = very high match (0.9 - 1.0)
        # 10-50 km = high match (0.7 - 0.9)
        # 50-200 km = moderate match (0.4 - 0.7)
        # > 200 km = low match (< 0.4)
        if dist_km <= 0:
            return 1.0
        
        # Exponential decay for score based on distance
        score = np.exp(-dist_km / 100.0) 
        return float(max(0.0, min(1.0, score)))
    except Exception as e:
        print(f"Error calculating geo score: {e}")
        return 0.0

def calculate_composite_score(face1, face2, text1, text2, lat1, lon1, lat2, lon2):
    """
    Calculates final composite matching score.
    Returns a dictionary with the final score and the breakdown.
    """
    face_score = cosine_similarity(face1, face2)
    text_score = cosine_similarity(text1, text2)
    geo_score = calculate_geo_score(lat1, lon1, lat2, lon2)
    
    # Weighting scheme
    # Face is most important, then Text, then Geo
    # If face is missing entirely, we rely heavily on text
    has_face = face1 is not None and face2 is not None
    
    if has_face:
        final_score = (face_score * 0.60) + (text_score * 0.30) + (geo_score * 0.10)
    else:
        # If no face, text is highly weighted
        final_score = (text_score * 0.80) + (geo_score * 0.20)
        
    return {
        "final_score": float(final_score),
        "breakdown": {
            "face_score": float(face_score),
            "text_score": float(text_score),
            "geo_score": float(geo_score)
        }
    }
