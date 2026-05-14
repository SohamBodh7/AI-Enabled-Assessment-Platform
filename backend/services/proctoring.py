import cv2
import numpy as np
import base64
from datetime import datetime
from models import db, ProctoringLog

# Load the Haar cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')


def detect_faces_from_base64(image_base64):
    """
    Detect faces in a base64-encoded image.

    Returns:
        dict: {
            'face_count': int,
            'event_type': str or None,
            'severity': str or None
        }
    """
    try:
        # Decode base64 image
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        img_bytes = base64.b64decode(image_base64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {'face_count': 0, 'event_type': 'invalid_frame', 'severity': 'low'}

        # Convert to grayscale for detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )

        face_count = len(faces)

        if face_count == 0:
            return {'face_count': 0, 'event_type': 'no_face', 'severity': 'high'}
        elif face_count > 1:
            return {'face_count': face_count, 'event_type': 'multiple_faces', 'severity': 'high'}
        else:
            return {'face_count': 1, 'event_type': None, 'severity': None}

    except Exception as e:
        return {'face_count': 0, 'event_type': 'detection_error', 'severity': 'low'}


def log_proctoring_event(student_id, exam_id, event_type, severity='medium'):
    """Log a proctoring event to the database."""
    log = ProctoringLog(
        student_id=student_id,
        exam_id=exam_id,
        event_type=event_type,
        severity=severity,
        timestamp=datetime.utcnow()
    )
    db.session.add(log)
    db.session.commit()
    return log.to_dict()


def process_frame(student_id, exam_id, image_base64):
    """
    Process a webcam frame: detect faces and log suspicious events.

    Returns:
        dict with detection results and any logged event
    """
    detection = detect_faces_from_base64(image_base64)

    logged_event = None
    if detection['event_type']:
        logged_event = log_proctoring_event(
            student_id=student_id,
            exam_id=exam_id,
            event_type=detection['event_type'],
            severity=detection['severity']
        )

    return {
        'face_count': detection['face_count'],
        'event_type': detection['event_type'],
        'severity': detection['severity'],
        'logged': logged_event is not None
    }
