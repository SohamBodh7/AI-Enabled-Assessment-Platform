from app import create_app
from models import db
from sqlalchemy import text
import traceback

app = create_app()
with app.app_context():
    queries = [
        "ALTER TABLE submissions ADD COLUMN score FLOAT DEFAULT 0",
        "ALTER TABLE submissions ADD COLUMN total INT DEFAULT 0",
        "ALTER TABLE submissions ADD COLUMN submitted_at DATETIME",
        "ALTER TABLE coding_submissions ADD COLUMN score FLOAT DEFAULT 0",
        "ALTER TABLE coding_submissions ADD COLUMN total_cases INT DEFAULT 0",
        "ALTER TABLE coding_submissions ADD COLUMN passed_cases INT DEFAULT 0",
        "ALTER TABLE coding_submissions ADD COLUMN execution_time FLOAT",
        "ALTER TABLE coding_submissions ADD COLUMN status VARCHAR(20)",
        "ALTER TABLE coding_submissions ADD COLUMN submitted_at DATETIME"
    ]
    
    for q in queries:
        try:
            db.session.execute(text(q))
            db.session.commit()
            print(f"Executed: {q}")
        except Exception as e:
            db.session.rollback()
            print(f"Failed (might already exist): {q}")
    
    print("Database columns fixed.")
