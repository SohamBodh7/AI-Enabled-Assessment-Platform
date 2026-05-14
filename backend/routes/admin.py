from flask import Blueprint, request, jsonify
import bcrypt
from models import db, User, Exam, ProctoringLog
from utils.decorators import role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/faculty', methods=['POST'])
@role_required('admin')
def create_faculty(current_user):
    """Create a new faculty account."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user = User(name=name, email=email, password_hash=password_hash, role='faculty')
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Faculty account created', 'user': user.to_dict()}), 201


@admin_bp.route('/users', methods=['GET'])
@role_required('admin')
def get_all_users(current_user):
    """Get all users with optional role filter."""
    role = request.args.get('role')
    query = User.query
    if role:
        query = query.filter_by(role=role)
    users = query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200


@admin_bp.route('/exams', methods=['GET'])
@role_required('admin')
def get_all_exams(current_user):
    """Get all exams."""
    exams = Exam.query.order_by(Exam.created_at.desc()).all()
    return jsonify({'exams': [e.to_dict() for e in exams]}), 200


@admin_bp.route('/proctoring-logs', methods=['GET'])
@role_required('admin')
def get_proctoring_logs(current_user):
    """Get all proctoring logs."""
    exam_id = request.args.get('exam_id', type=int)
    student_id = request.args.get('student_id', type=int)

    query = ProctoringLog.query
    if exam_id:
        query = query.filter_by(exam_id=exam_id)
    if student_id:
        query = query.filter_by(student_id=student_id)

    logs = query.order_by(ProctoringLog.timestamp.desc()).all()
    return jsonify({'logs': [l.to_dict() for l in logs]}), 200


@admin_bp.route('/stats', methods=['GET'])
@role_required('admin')
def get_stats(current_user):
    """Get dashboard stats."""
    total_users = User.query.count()
    total_students = User.query.filter_by(role='student').count()
    total_faculty = User.query.filter_by(role='faculty').count()
    total_exams = Exam.query.count()
    total_alerts = ProctoringLog.query.filter_by(severity='high').count()

    return jsonify({
        'total_users': total_users,
        'total_students': total_students,
        'total_faculty': total_faculty,
        'total_exams': total_exams,
        'total_alerts': total_alerts
    }), 200
