from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'faculty', 'student', name='user_roles'), nullable=False, default='student')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Profile fields
    phone        = db.Column(db.String(20),  nullable=True)
    institute    = db.Column(db.String(200), nullable=True)
    department   = db.Column(db.String(100), nullable=True)
    roll_no      = db.Column(db.String(50),  nullable=True)   # students
    employee_id  = db.Column(db.String(50),  nullable=True)   # faculty
    year         = db.Column(db.String(20),  nullable=True)   # students: 1st/2nd/3rd/4th
    designation  = db.Column(db.String(100), nullable=True)   # faculty: Professor / Asst. Prof
    bio          = db.Column(db.Text,        nullable=True)
    profile_photo= db.Column(db.String(255), nullable=True)   # stored filename

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'phone': self.phone,
            'institute': self.institute,
            'department': self.department,
            'roll_no': self.roll_no,
            'employee_id': self.employee_id,
            'year': self.year,
            'designation': self.designation,
            'bio': self.bio,
            'profile_photo': self.profile_photo,
        }


class Exam(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    __tablename__ = 'exams'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    type = db.Column(db.Enum('mcq', 'coding', name='exam_types'), nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', backref='exams')
    mcq_questions = db.relationship('MCQQuestion', backref='exam', cascade='all, delete-orphan')
    coding_questions = db.relationship('CodingQuestion', backref='exam', cascade='all, delete-orphan')
    assignments = db.relationship('ExamAssignment', backref='exam', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'type': self.type,
            'duration': self.duration,
            'created_by': self.created_by,
            'creator_name': self.creator.name if self.creator else None,
            'is_active': self.is_active,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'question_count': len(self.mcq_questions) if self.type == 'mcq' else len(self.coding_questions)
        }


class MCQQuestion(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    __tablename__ = 'mcq_questions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(500), nullable=False)
    option_b = db.Column(db.String(500), nullable=False)
    option_c = db.Column(db.String(500), nullable=False)
    option_d = db.Column(db.String(500), nullable=False)
    correct_option = db.Column(db.Enum('A', 'B', 'C', 'D', name='option_choices'), nullable=False)

    def to_dict(self, include_answer=False):
        data = {
            'id': self.id,
            'exam_id': self.exam_id,
            'question_text': self.question_text,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
        }
        if include_answer:
            data['correct_option'] = self.correct_option
        return data


class CodingQuestion(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    __tablename__ = 'coding_questions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    problem_statement = db.Column(db.Text, nullable=False)
    input_format = db.Column(db.Text, nullable=True)
    output_format = db.Column(db.Text, nullable=True)
    constraints = db.Column(db.Text, nullable=True)

    test_cases = db.relationship('TestCase', backref='coding_question', cascade='all, delete-orphan')

    def to_dict(self, include_hidden=False):
        data = {
            'id': self.id,
            'exam_id': self.exam_id,
            'title': self.title,
            'problem_statement': self.problem_statement,
            'input_format': self.input_format,
            'output_format': self.output_format,
            'constraints': self.constraints,
            'test_cases': [tc.to_dict() for tc in self.test_cases if not tc.is_hidden or include_hidden]
        }
        return data


class TestCase(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    __tablename__ = 'test_cases'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    coding_question_id = db.Column(db.Integer, db.ForeignKey('coding_questions.id'), nullable=False)
    input_data = db.Column(db.Text, nullable=False)
    expected_output = db.Column(db.Text, nullable=False)
    is_hidden = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'coding_question_id': self.coding_question_id,
            'input_data': self.input_data,
            'expected_output': self.expected_output,
            'is_hidden': self.is_hidden
        }


class Submission(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    __tablename__ = 'submissions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    answers = db.Column(db.JSON, nullable=True)  # { question_id: selected_option }
    score = db.Column(db.Float, default=0)
    total = db.Column(db.Integer, default=0)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('User', backref='submissions')
    exam = db.relationship('Exam', backref='submissions')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'exam_id': self.exam_id,
            'exam_title': self.exam.title if self.exam else None,
            'score': self.score,
            'total': self.total,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }


class CodingSubmission(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    __tablename__ = 'coding_submissions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    coding_question_id = db.Column(db.Integer, db.ForeignKey('coding_questions.id'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    code_text = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(20), default='python')
    score = db.Column(db.Float, default=0)
    total_cases = db.Column(db.Integer, default=0)
    passed_cases = db.Column(db.Integer, default=0)
    execution_time = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), default='submitted')  # submitted, passed, failed, error, timeout
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('User', backref='coding_submissions')
    coding_question = db.relationship('CodingQuestion', backref='coding_submissions')
    exam = db.relationship('Exam', backref='coding_submissions')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'coding_question_id': self.coding_question_id,
            'question_title': self.coding_question.title if self.coding_question else None,
            'exam_id': self.exam_id,
            'code_text': self.code_text,
            'language': self.language,
            'score': self.score,
            'total_cases': self.total_cases,
            'passed_cases': self.passed_cases,
            'execution_time': self.execution_time,
            'status': self.status,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }


class ProctoringLog(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    __tablename__ = 'proctoring_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)  # no_face, multiple_faces, tab_switch
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    severity = db.Column(db.Enum('low', 'medium', 'high', name='severity_levels'), default='medium')

    student = db.relationship('User', backref='proctoring_logs')
    exam = db.relationship('Exam', backref='proctoring_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'exam_id': self.exam_id,
            'exam_title': self.exam.title if self.exam else None,
            'event_type': self.event_type,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'severity': self.severity
        }

class ExamAssignment(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    __tablename__ = 'exam_assignments'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('User', backref='assignments')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_id': self.exam_id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'student_email': self.student.email if self.student else None,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None
        }


class ExamSession(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    """Tracks a student's active exam session for live monitoring."""
    __tablename__ = 'exam_sessions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')  # active / submitted / terminated / reopened
    warnings = db.Column(db.Integer, default=0)
    time_spent = db.Column(db.Integer, default=0)  # seconds used before termination
    remaining_seconds = db.Column(db.Integer, nullable=True)  # set on reopen

    student = db.relationship('User', foreign_keys=[student_id])
    exam = db.relationship('Exam', foreign_keys=[exam_id])

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'exam_id': self.exam_id,
            'student_name': self.student.name if self.student else None,
            'student_email': self.student.email if self.student else None,
            'exam_title': self.exam.title if self.exam else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'status': self.status,
            'warnings': self.warnings,
            'time_spent': self.time_spent,
            'remaining_seconds': self.remaining_seconds,
        }


class ChatMessage(db.Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    """Faculty-student chat messages during an exam session."""
    __tablename__ = 'chat_messages'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.Integer, db.ForeignKey('exam_sessions.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sender_role = db.Column(db.String(10), nullable=False)  # faculty / student
    message = db.Column(db.Text, nullable=False)
    is_warning = db.Column(db.Boolean, default=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('User', foreign_keys=[sender_id])
    session = db.relationship('ExamSession', foreign_keys=[session_id])

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.name if self.sender else None,
            'sender_role': self.sender_role,
            'message': self.message,
            'is_warning': self.is_warning,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
        }
