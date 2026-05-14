"""
Seed Demo Proctoring Logs
Run: python seed_proctoring.py
Inserts realistic proctoring events for all students & exams already in the DB.
"""

from app import create_app
from models import db, User, Exam, ProctoringLog
from datetime import datetime, timedelta
import random

app = create_app()

with app.app_context():

    # ── Fetch existing students and exams ─────────────────────────────────────
    students = User.query.filter_by(role='student').all()
    exams    = Exam.query.all()

    if not students:
        print("❌  No students found. Register at least one student first, then re-run.")
        exit()

    if not exams:
        print("❌  No exams found. Create at least one exam first, then re-run.")
        exit()

    # ── Delete old demo logs so we don't double-up ───────────────────────────
    deleted = ProctoringLog.query.delete()
    db.session.commit()
    print(f"[CLEARED] {deleted} old proctoring logs.")

    # ── Event pattern: realistic sequence for one exam session ───────────────
    # Simulates ~60 minutes of exam: mostly face_detected, a few violations
    def make_session_events(student_id, exam_id, base_time):
        events = []

        timeline = [
            # (minutes_offset, event_type, severity)
            (0,   'face_detected',   'low'),
            (10,  'face_detected',   'low'),
            (20,  'face_detected',   'low'),
            (22,  'no_face',         'high'),   # looked away
            (24,  'face_detected',   'low'),
            (30,  'face_detected',   'low'),
            (35,  'multiple_faces',  'high'),   # someone walked behind
            (36,  'face_detected',   'low'),
            (40,  'face_detected',   'low'),
            (45,  'no_face',         'high'),   # phone check
            (46,  'face_detected',   'low'),
            (50,  'face_detected',   'low'),
            (55,  'multiple_faces',  'high'),   # person behind again
            (56,  'face_detected',   'low'),
            (58,  'no_face',         'high'),
            (60,  'face_detected',   'low'),
        ]

        for (offset, event_type, severity) in timeline:
            # Add slight random jitter (+-30 sec) to make it look natural
            jitter = timedelta(seconds=random.randint(-30, 30))
            ts = base_time + timedelta(minutes=offset) + jitter
            events.append(ProctoringLog(
                student_id=student_id,
                exam_id=exam_id,
                event_type=event_type,
                severity=severity,
                timestamp=ts
            ))
        return events

    # ── Seed logs for every student x every exam ────────────────────────────
    total = 0
    base_date = datetime.now() - timedelta(days=1)   # "yesterday's exam"

    for student in students:
        for exam in exams:
            logs = make_session_events(student.id, exam.id, base_date)
            db.session.add_all(logs)
            total += len(logs)
            print(f"[OK] {len(logs)} events  ->  Student: {student.name}  |  Exam: {exam.title}")

    db.session.commit()
    print(f"\n[DONE] Inserted {total} proctoring log entries.")
    print("       Open the Admin panel -> Proctoring Logs to see them.")
