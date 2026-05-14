from app import create_app
from models import db
from sqlalchemy import text
import traceback

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE exams ADD COLUMN is_public BOOLEAN DEFAULT TRUE"))
        db.session.commit()
        print("is_public column added to exams.")
    except Exception as e:
        db.session.rollback()
        print("is_public column might already exist.")

    try:
        db.create_all()
        print("Missing tables created successfully.")
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
