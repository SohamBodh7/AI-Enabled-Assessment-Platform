from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Exam, MCQQuestion, CodingQuestion, TestCase, Submission, CodingSubmission, ExamAssignment
from services.code_executor import execute_code, run_against_test_cases
from services.proctoring import process_frame
from utils.decorators import role_required

student_bp = Blueprint('student', __name__, url_prefix='/api/student')


@student_bp.route('/exams', methods=['GET'])
@role_required('student')
def get_available_exams(current_user):
    """Get all active exams for students."""
    # Get public active exams
    public_exams = Exam.query.filter_by(is_active=True, is_public=True).all()
    
    # Get private exams assigned to the student
    assigned_records = ExamAssignment.query.filter_by(student_id=current_user.id).all()
    assigned_exam_ids = [r.exam_id for r in assigned_records]
    private_assigned_exams = Exam.query.filter(Exam.is_active == True, Exam.is_public == False, Exam.id.in_(assigned_exam_ids) if assigned_exam_ids else False).all()
    
    all_exams = list({e.id: e for e in (public_exams + private_assigned_exams)}.values())
    all_exams.sort(key=lambda x: x.created_at, reverse=True)

    # Mark exams that have already been submitted
    exam_list = []
    for exam in all_exams:
        data = exam.to_dict()
        if exam.type == 'mcq':
            existing = Submission.query.filter_by(
                student_id=current_user.id, exam_id=exam.id
            ).first()
            data['submitted'] = existing is not None
        else:
            existing = CodingSubmission.query.filter_by(
                student_id=current_user.id, exam_id=exam.id
            ).first()
            data['submitted'] = existing is not None
        exam_list.append(data)

    return jsonify({'exams': exam_list}), 200


@student_bp.route('/exams/<int:exam_id>', methods=['GET'])
@role_required('student')
def get_exam_details(current_user, exam_id):
    """Get exam details with questions (without answers for MCQ)."""
    exam = Exam.query.get_or_404(exam_id)
    data = exam.to_dict()

    if exam.type == 'mcq':
        data['questions'] = [q.to_dict(include_answer=False) for q in exam.mcq_questions]
    else:
        data['questions'] = [q.to_dict(include_hidden=False) for q in exam.coding_questions]

    return jsonify({'exam': data}), 200


@student_bp.route('/exams/<int:exam_id>/submit-mcq', methods=['POST'])
@role_required('student')
def submit_mcq_exam(current_user, exam_id):
    """Submit MCQ exam answers and auto-evaluate."""
    exam = Exam.query.get_or_404(exam_id)
    if exam.type != 'mcq':
        return jsonify({'error': 'This is not an MCQ exam'}), 400

    # Check duplicate submission
    existing = Submission.query.filter_by(
        student_id=current_user.id, exam_id=exam_id
    ).first()
    if existing:
        return jsonify({'error': 'You have already submitted this exam'}), 409

    data = request.get_json()
    answers = data.get('answers', {})  # { "question_id": "A" }

    # Auto-evaluate
    questions = MCQQuestion.query.filter_by(exam_id=exam_id).all()
    correct = 0
    total = len(questions)

    for q in questions:
        student_answer = answers.get(str(q.id), '').upper()
        if student_answer == q.correct_option:
            correct += 1

    submission = Submission(
        student_id=current_user.id,
        exam_id=exam_id,
        answers=answers,
        score=correct,
        total=total
    )
    db.session.add(submission)
    db.session.commit()

    return jsonify({
        'message': 'Exam submitted successfully',
        'result': {
            'score': correct,
            'total': total,
            'percentage': round((correct / total) * 100, 2) if total > 0 else 0
        }
    }), 201


@student_bp.route('/code/run', methods=['POST'])
@role_required('student')
def run_code(current_user):
    """Run code against sample test cases (not hidden)."""
    data = request.get_json()
    code = data.get('code', '')
    question_id = data.get('question_id')
    input_data = data.get('input_data', '')

    if not code:
        return jsonify({'error': 'Code is required'}), 400

    # If question_id provided, run against sample test cases
    if question_id:
        question = CodingQuestion.query.get_or_404(question_id)
        sample_cases = [tc.to_dict() for tc in question.test_cases if not tc.is_hidden]
        if sample_cases:
            result = run_against_test_cases(code, sample_cases)
            return jsonify(result), 200

    # Otherwise run with manual input
    result = execute_code(code, input_data)
    return jsonify(result), 200


@student_bp.route('/code/submit', methods=['POST'])
@role_required('student')
def submit_code(current_user):
    """Submit code – run against ALL test cases (including hidden) and save score."""
    data = request.get_json()
    code = data.get('code', '')
    question_id = data.get('question_id')
    exam_id = data.get('exam_id')

    if not code or not question_id or not exam_id:
        return jsonify({'error': 'code, question_id, and exam_id are required'}), 400

    question = CodingQuestion.query.get_or_404(question_id)
    all_cases = [tc.to_dict() for tc in question.test_cases]

    if not all_cases:
        return jsonify({'error': 'No test cases found for this question'}), 400

    result = run_against_test_cases(code, all_cases)

    # Save submission
    submission = CodingSubmission(
        student_id=current_user.id,
        coding_question_id=question_id,
        exam_id=exam_id,
        code_text=code,
        language='python',
        score=result['score'],
        total_cases=result['total'],
        passed_cases=result['passed'],
        execution_time=sum(r['execution_time'] for r in result['results']),
        status='passed' if result['passed'] == result['total'] else 'partial'
    )
    db.session.add(submission)
    db.session.commit()

    # Filter hidden test case details from response
    visible_results = []
    for r in result['results']:
        if not r.get('is_hidden'):
            visible_results.append(r)
        else:
            visible_results.append({
                'test_case_id': r['test_case_id'],
                'passed': r['passed'],
                'is_hidden': True,
                'status': r['status']
            })

    return jsonify({
        'message': 'Code submitted successfully',
        'passed': result['passed'],
        'total': result['total'],
        'score': result['score'],
        'results': visible_results,
        'submission_id': submission.id
    }), 201


@student_bp.route('/results', methods=['GET'])
@role_required('student')
def get_my_results(current_user):
    """Get all results for the current student."""
    mcq_results = Submission.query.filter_by(student_id=current_user.id).all()
    coding_results = CodingSubmission.query.filter_by(student_id=current_user.id).all()

    return jsonify({
        'mcq_results': [s.to_dict() for s in mcq_results],
        'coding_results': [cs.to_dict() for cs in coding_results]
    }), 200


@student_bp.route('/results/<int:exam_id>/answer-key', methods=['GET'])
@role_required('student')
def get_answer_key(current_user, exam_id):
    """Get answer key for a submitted exam — only available after submission."""
    exam = Exam.query.get_or_404(exam_id)

    if exam.type == 'mcq':
        # Verify student has submitted
        submission = Submission.query.filter_by(
            student_id=current_user.id, exam_id=exam_id
        ).first()
        if not submission:
            return jsonify({'error': 'You must submit the exam first'}), 403

        questions = MCQQuestion.query.filter_by(exam_id=exam_id).all()
        student_answers = submission.answers or {}

        answer_key = []
        for q in questions:
            answer_key.append({
                'id': q.id,
                'question_text': q.question_text,
                'option_a': q.option_a,
                'option_b': q.option_b,
                'option_c': q.option_c,
                'option_d': q.option_d,
                'correct_option': q.correct_option,
                'student_answer': student_answers.get(str(q.id), None),
                'is_correct': student_answers.get(str(q.id), '').lower() == q.correct_option.lower()
            })

        return jsonify({
            'exam': exam.to_dict(),
            'type': 'mcq',
            'score': submission.score,
            'total': submission.total,
            'answer_key': answer_key
        }), 200

    else:  # coding
        submissions = CodingSubmission.query.filter_by(
            student_id=current_user.id, exam_id=exam_id
        ).all()
        if not submissions:
            return jsonify({'error': 'You must submit the exam first'}), 403

        questions = CodingQuestion.query.filter_by(exam_id=exam_id).all()
        sub_map = {s.coding_question_id: s for s in submissions}

        answer_key = []
        for q in questions:
            sub = sub_map.get(q.id)
            answer_key.append({
                'id': q.id,
                'title': q.title,
                'problem_statement': q.problem_statement,
                'submitted_code': sub.code_text if sub else None,
                'passed_cases': sub.passed_cases if sub else 0,
                'total_cases': sub.total_cases if sub else 0,
                'status': sub.status if sub else 'not_submitted',
                'score': sub.score if sub else 0,
            })

        return jsonify({
            'exam': exam.to_dict(),
            'type': 'coding',
            'answer_key': answer_key
        }), 200


@student_bp.route('/proctor', methods=['POST'])
@role_required('student')
def proctor_frame(current_user):
    """Process a proctoring frame from the student's webcam."""
    data = request.get_json()
    exam_id = data.get('exam_id')
    image = data.get('image') or data.get('frame')

    if not exam_id or not image:
        return jsonify({'error': 'exam_id and image are required'}), 400

    result = process_frame(current_user.id, exam_id, image)
    return jsonify(result), 200
