"""Live exam monitoring routes — faculty monitors students, sends warnings, reopens exams."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Exam, ExamSession, ChatMessage
from utils.decorators import role_required

monitor_bp = Blueprint('monitor', __name__, url_prefix='/api/monitor')


@monitor_bp.route('/sessions/<int:exam_id>', methods=['GET'])
@role_required('faculty', 'admin')
def get_sessions(current_user, exam_id):
    """Get all exam sessions for a given exam."""
    sessions = ExamSession.query.filter_by(exam_id=exam_id).order_by(ExamSession.started_at.desc()).all()
    return jsonify({'sessions': [s.to_dict() for s in sessions]}), 200


@monitor_bp.route('/active-sessions/<int:exam_id>', methods=['GET'])
@role_required('faculty', 'admin')
def get_active_sessions(current_user, exam_id):
    """Get only active/reopened sessions for live monitoring."""
    sessions = ExamSession.query.filter(
        ExamSession.exam_id == exam_id,
        ExamSession.status.in_(['active', 'reopened'])
    ).order_by(ExamSession.started_at.desc()).all()
    return jsonify({'sessions': [s.to_dict() for s in sessions]}), 200


@monitor_bp.route('/start-session', methods=['POST'])
@jwt_required()
def start_session():
    """Student starts an exam session."""
    user_id = get_jwt_identity()
    data = request.json
    exam_id = data.get('exam_id')

    # Check for existing active/reopened session
    existing = ExamSession.query.filter_by(
        student_id=user_id, exam_id=exam_id
    ).filter(ExamSession.status.in_(['active', 'reopened'])).first()

    if existing:
        return jsonify({'session': existing.to_dict()}), 200

    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({'error': 'Exam not found'}), 404

    session = ExamSession(student_id=user_id, exam_id=exam_id, status='active')
    db.session.add(session)
    db.session.commit()
    return jsonify({'session': session.to_dict()}), 201


@monitor_bp.route('/end-session', methods=['POST'])
@jwt_required()
def end_session():
    """Student submits exam — mark session as submitted."""
    user_id = get_jwt_identity()
    data = request.json
    session_id = data.get('session_id')
    time_spent = data.get('time_spent', 0)

    session = ExamSession.query.get(session_id)
    if not session or session.student_id != user_id:
        return jsonify({'error': 'Session not found'}), 404

    session.status = 'submitted'
    session.time_spent = time_spent
    db.session.commit()
    return jsonify({'message': 'Session ended', 'session': session.to_dict()}), 200


@monitor_bp.route('/send-warning', methods=['POST'])
@role_required('faculty', 'admin')
def send_warning(current_user):
    """Faculty sends an official warning to a student. 4th warning = auto-terminate."""
    data = request.json
    session_id = data.get('session_id')
    message = data.get('message', 'You have received a warning from the faculty.')

    session = ExamSession.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    session.warnings += 1
    auto_terminated = False

    # Save chat message
    msg = ChatMessage(
        session_id=session_id,
        sender_id=current_user.id,
        sender_role='faculty',
        message=message,
        is_warning=True
    )
    db.session.add(msg)

    if session.warnings >= 4:
        session.status = 'terminated'
        auto_terminated = True

    db.session.commit()
    return jsonify({
        'message': 'Warning sent',
        'warnings': session.warnings,
        'auto_terminated': auto_terminated,
        'session': session.to_dict()
    }), 200


@monitor_bp.route('/terminate-session', methods=['POST'])
@role_required('faculty', 'admin')
def terminate_session(current_user):
    """Faculty manually terminates a student's exam."""
    data = request.json
    session_id = data.get('session_id')
    time_spent = data.get('time_spent', 0)

    session = ExamSession.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    session.status = 'terminated'
    session.time_spent = time_spent
    db.session.commit()
    return jsonify({'message': 'Session terminated', 'session': session.to_dict()}), 200


@monitor_bp.route('/reopen-session', methods=['POST'])
@role_required('faculty', 'admin')
def reopen_session(current_user):
    """Faculty reopens a terminated exam for a student with remaining time."""
    data = request.json
    session_id = data.get('session_id')

    session = ExamSession.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    if session.status != 'terminated':
        return jsonify({'error': 'Can only reopen terminated sessions'}), 400

    exam = Exam.query.get(session.exam_id)
    total_seconds = (exam.duration * 60) if exam else 0
    remaining = max(total_seconds - session.time_spent, 60)  # at least 1 min

    session.status = 'reopened'
    session.remaining_seconds = remaining
    session.warnings = 0  # reset warnings on reopen
    db.session.commit()
    return jsonify({'message': 'Session reopened', 'remaining_seconds': remaining, 'session': session.to_dict()}), 200


@monitor_bp.route('/chat/<int:session_id>', methods=['GET'])
@jwt_required()
def get_chat(session_id):
    """Get all chat messages for a session."""
    messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.sent_at.asc()).all()
    return jsonify({'messages': [m.to_dict() for m in messages]}), 200


@monitor_bp.route('/chat', methods=['POST'])
@jwt_required()
def send_chat():
    """Send a chat message (faculty or student)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.json

    msg = ChatMessage(
        session_id=data.get('session_id'),
        sender_id=user_id,
        sender_role=user.role if user else 'student',
        message=data.get('message', ''),
        is_warning=False
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({'message': msg.to_dict()}), 201


@monitor_bp.route('/check-session', methods=['GET'])
@jwt_required()
def check_session():
    """Student checks if they have an active/reopened session for an exam."""
    user_id = get_jwt_identity()
    exam_id = request.args.get('exam_id')
    session = ExamSession.query.filter_by(
        student_id=user_id, exam_id=exam_id
    ).filter(ExamSession.status.in_(['active', 'reopened'])).first()

    if session:
        return jsonify({'session': session.to_dict()}), 200
    return jsonify({'session': None}), 200
