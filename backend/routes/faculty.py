from flask import Blueprint, request, jsonify
from models import db, Exam, MCQQuestion, CodingQuestion, TestCase, Submission, CodingSubmission, User, ExamAssignment
from utils.decorators import role_required

faculty_bp = Blueprint('faculty', __name__, url_prefix='/api/faculty')


# ─── EXAM CRUD ────────────────────────────────────────────────────────────────

@faculty_bp.route('/exams', methods=['POST'])
@role_required('faculty', 'admin')
def create_exam(current_user):
    """Create a new exam."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    title = data.get('title', '').strip()
    exam_type = data.get('type', '').strip()
    duration = data.get('duration')
    description = data.get('description', '').strip()
    is_public = data.get('is_public', True)

    if not title or not exam_type or not duration:
        return jsonify({'error': 'Title, type, and duration are required'}), 400

    if exam_type not in ['mcq', 'coding']:
        return jsonify({'error': 'Type must be mcq or coding'}), 400

    exam = Exam(
        title=title,
        description=description,
        type=exam_type,
        duration=int(duration),
        created_by=current_user.id,
        is_public=is_public
    )
    db.session.add(exam)
    db.session.commit()

    return jsonify({'message': 'Exam created', 'exam': exam.to_dict()}), 201


@faculty_bp.route('/exams', methods=['GET'])
@role_required('faculty', 'admin')
def get_my_exams(current_user):
    """Get exams created by the current faculty."""
    exams = Exam.query.filter_by(created_by=current_user.id).order_by(Exam.created_at.desc()).all()
    return jsonify({'exams': [e.to_dict() for e in exams]}), 200


@faculty_bp.route('/exams/<int:exam_id>', methods=['GET'])
@role_required('faculty', 'admin')
def get_exam(current_user, exam_id):
    """Get exam details."""
    exam = Exam.query.get_or_404(exam_id)
    data = exam.to_dict()
    if exam.type == 'mcq':
        data['questions'] = [q.to_dict(include_answer=True) for q in exam.mcq_questions]
    else:
        data['questions'] = [q.to_dict(include_hidden=True) for q in exam.coding_questions]
    return jsonify({'exam': data}), 200


@faculty_bp.route('/exams/<int:exam_id>', methods=['PUT'])
@role_required('faculty', 'admin')
def update_exam(current_user, exam_id):
    """Update an exam."""
    exam = Exam.query.get_or_404(exam_id)
    data = request.get_json()

    if data.get('title'):
        exam.title = data['title'].strip()
    if data.get('description') is not None:
        exam.description = data['description'].strip()
    if data.get('duration'):
        exam.duration = int(data['duration'])
    if data.get('is_active') is not None:
        exam.is_active = data['is_active']
    if data.get('is_public') is not None:
        exam.is_public = data['is_public']

    db.session.commit()
    return jsonify({'message': 'Exam updated', 'exam': exam.to_dict()}), 200


@faculty_bp.route('/exams/<int:exam_id>', methods=['DELETE'])
@role_required('faculty', 'admin')
def delete_exam(current_user, exam_id):
    """Delete an exam."""
    exam = Exam.query.get_or_404(exam_id)
    db.session.delete(exam)
    db.session.commit()
    return jsonify({'message': 'Exam deleted'}), 200


# ─── MCQ QUESTIONS ────────────────────────────────────────────────────────────

@faculty_bp.route('/exams/<int:exam_id>/mcq', methods=['POST'])
@role_required('faculty', 'admin')
def add_mcq_question(current_user, exam_id):
    """Add an MCQ question to an exam."""
    exam = Exam.query.get_or_404(exam_id)
    if exam.type != 'mcq':
        return jsonify({'error': 'This exam is not MCQ type'}), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    required = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    if data['correct_option'].upper() not in ['A', 'B', 'C', 'D']:
        return jsonify({'error': 'correct_option must be A, B, C, or D'}), 400

    question = MCQQuestion(
        exam_id=exam_id,
        question_text=data['question_text'],
        option_a=data['option_a'],
        option_b=data['option_b'],
        option_c=data['option_c'],
        option_d=data['option_d'],
        correct_option=data['correct_option'].upper()
    )
    db.session.add(question)
    db.session.commit()

    return jsonify({'message': 'Question added', 'question': question.to_dict(include_answer=True)}), 201


@faculty_bp.route('/mcq/<int:question_id>', methods=['DELETE'])
@role_required('faculty', 'admin')
def delete_mcq_question(current_user, question_id):
    """Delete an MCQ question."""
    question = MCQQuestion.query.get_or_404(question_id)
    db.session.delete(question)
    db.session.commit()
    return jsonify({'message': 'Question deleted'}), 200


# ─── CODING QUESTIONS ─────────────────────────────────────────────────────────

@faculty_bp.route('/exams/<int:exam_id>/coding', methods=['POST'])
@role_required('faculty', 'admin')
def add_coding_question(current_user, exam_id):
    """Add a coding question to an exam."""
    exam = Exam.query.get_or_404(exam_id)
    if exam.type != 'coding':
        return jsonify({'error': 'This exam is not coding type'}), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if not data.get('title') or not data.get('problem_statement'):
        return jsonify({'error': 'Title and problem_statement are required'}), 400

    question = CodingQuestion(
        exam_id=exam_id,
        title=data['title'],
        problem_statement=data['problem_statement'],
        input_format=data.get('input_format', ''),
        output_format=data.get('output_format', ''),
        constraints=data.get('constraints', '')
    )
    db.session.add(question)
    db.session.commit()

    return jsonify({'message': 'Coding question added', 'question': question.to_dict()}), 201


@faculty_bp.route('/coding/<int:question_id>', methods=['DELETE'])
@role_required('faculty', 'admin')
def delete_coding_question(current_user, question_id):
    """Delete a coding question."""
    question = CodingQuestion.query.get_or_404(question_id)
    db.session.delete(question)
    db.session.commit()
    return jsonify({'message': 'Question deleted'}), 200


# ─── TEST CASES ────────────────────────────────────────────────────────────────

@faculty_bp.route('/coding/<int:question_id>/testcases', methods=['POST'])
@role_required('faculty', 'admin')
def add_test_case(current_user, question_id):
    """Add a test case to a coding question."""
    question = CodingQuestion.query.get_or_404(question_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if not data.get('input_data') is not None and not data.get('expected_output'):
        return jsonify({'error': 'input_data and expected_output are required'}), 400

    test_case = TestCase(
        coding_question_id=question_id,
        input_data=data.get('input_data', ''),
        expected_output=data.get('expected_output', ''),
        is_hidden=data.get('is_hidden', False)
    )
    db.session.add(test_case)
    db.session.commit()

    return jsonify({'message': 'Test case added', 'test_case': test_case.to_dict()}), 201


@faculty_bp.route('/testcases/<int:tc_id>', methods=['DELETE'])
@role_required('faculty', 'admin')
def delete_test_case(current_user, tc_id):
    """Delete a test case."""
    tc = TestCase.query.get_or_404(tc_id)
    db.session.delete(tc)
    db.session.commit()
    return jsonify({'message': 'Test case deleted'}), 200


# ─── RESULTS ──────────────────────────────────────────────────────────────────

@faculty_bp.route('/exams/<int:exam_id>/results', methods=['GET'])
@role_required('faculty', 'admin')
def get_exam_results(current_user, exam_id):
    """Get results for a specific exam."""
    exam = Exam.query.get_or_404(exam_id)

    if exam.type == 'mcq':
        submissions = Submission.query.filter_by(exam_id=exam_id).all()
        return jsonify({
            'exam': exam.to_dict(),
            'results': [s.to_dict() for s in submissions]
        }), 200
    else:
        coding_subs = CodingSubmission.query.filter_by(exam_id=exam_id).all()
        return jsonify({
            'exam': exam.to_dict(),
            'results': [cs.to_dict() for cs in coding_subs]
        }), 200

# ─── ASSIGNMENTS ──────────────────────────────────────────────────────────────

@faculty_bp.route('/students', methods=['GET'])
@role_required('faculty', 'admin')
def get_students(current_user):
    """Get all students."""
    students = User.query.filter_by(role='student').all()
    return jsonify({'students': [s.to_dict() for s in students]}), 200

@faculty_bp.route('/exams/<int:exam_id>/assignments', methods=['GET'])
@role_required('faculty', 'admin')
def get_exam_assignments(current_user, exam_id):
    """Get student assignments for a specific exam."""
    exam = Exam.query.get_or_404(exam_id)
    assignments = ExamAssignment.query.filter_by(exam_id=exam_id).all()
    return jsonify({'assignments': [a.to_dict() for a in assignments]}), 200

@faculty_bp.route('/exams/<int:exam_id>/assign', methods=['POST'])
@role_required('faculty', 'admin')
def assign_exam_to_students(current_user, exam_id):
    """Assign specific students to a private exam."""
    exam = Exam.query.get_or_404(exam_id)
    data = request.get_json()
    student_ids = data.get('student_ids', [])
    
    ExamAssignment.query.filter_by(exam_id=exam_id).delete()
    for sid in student_ids:
        assignment = ExamAssignment(exam_id=exam_id, student_id=sid)
        db.session.add(assignment)
        
    db.session.commit()
    return jsonify({'message': 'Exam assignments updated successfully'}), 200
