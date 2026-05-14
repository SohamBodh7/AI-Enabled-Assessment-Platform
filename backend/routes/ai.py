"""AI-powered question generation using Google Gemini API."""
import os
import json
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dotenv import load_dotenv

load_dotenv()

from google import genai

from models import db, User, Exam, MCQQuestion, CodingQuestion, TestCase

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# Configure Gemini client (new SDK)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)


def _parse_json_from_response(text):
    """Extract JSON array from Gemini response, handling markdown code fences."""
    fence_match = re.search(r'```(?:json)?\s*\n?(.*?)```', text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()
    bracket_match = re.search(r'\[.*\]', text, re.DOTALL)
    if bracket_match:
        return json.loads(bracket_match.group(0))
    return json.loads(text)


@ai_bp.route('/generate-questions', methods=['POST'])
@jwt_required()
def generate_questions():
    """Generate questions using Gemini AI. Returns preview, does NOT save to DB."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role not in ('faculty', 'admin'):
        return jsonify({'error': 'Unauthorized'}), 403

    if not client:
        return jsonify({'error': 'Gemini API key not configured'}), 500

    data = request.json
    exam_type = data.get('exam_type', 'mcq')
    topic = data.get('topic', '')
    difficulty = data.get('difficulty', 'medium')
    count = min(int(data.get('count', 5)), 15)

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    if exam_type == 'mcq':
        prompt = f"""Generate exactly {count} multiple choice questions about "{topic}" at {difficulty} difficulty level.

IMPORTANT: Return ONLY a valid JSON array with no extra text. Each item must have exactly these keys:
- "question_text": the question string
- "option_a": option A text
- "option_b": option B text
- "option_c": option C text
- "option_d": option D text
- "correct_option": lowercase letter "a", "b", "c", or "d"

Make the questions educational, clear, and unambiguous. Make sure exactly one option is correct.
Return ONLY the JSON array, nothing else."""

    else:
        prompt = f"""Generate exactly {count} Python coding problems about "{topic}" at {difficulty} difficulty level.

IMPORTANT: Return ONLY a valid JSON array with no extra text. Each item must have exactly these keys:
- "title": short problem title
- "problem_statement": detailed problem description
- "input_format": description of input format
- "output_format": description of output format
- "constraints": input constraints
- "test_cases": array of 3 test cases, each with:
  - "input_data": the input string
  - "expected_output": the expected output string
  - "is_hidden": boolean (first one false, rest true)

Make the problems solvable in Python. The test cases must be correct.
Return ONLY the JSON array, nothing else."""

    try:
        models_to_try = ['gemini-2.5-flash', 'gemini-flash-latest']
        response = None

        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                break
            except Exception as model_err:
                err_str = str(model_err).lower()
                if 'quota' in err_str or 'rate' in err_str or '429' in err_str or 'resource' in err_str or 'exhausted' in err_str:
                    continue
                else:
                    raise model_err

        if response is None:
            return jsonify({
                'error': 'API quota exceeded. Please wait a few minutes or get a new API key from https://aistudio.google.com/apikey'
            }), 429

        questions = _parse_json_from_response(response.text)
        return jsonify({'questions': questions, 'count': len(questions)}), 200

    except json.JSONDecodeError:
        return jsonify({'error': 'AI returned invalid format. Please try again.', 'raw': response.text[:500] if response else ''}), 422
    except Exception as e:
        err_msg = str(e).lower()
        if 'quota' in err_msg or 'rate' in err_msg or '429' in err_msg or 'resource' in err_msg or 'exhausted' in err_msg:
            return jsonify({
                'error': 'API quota exceeded. Please wait a few minutes or get a new API key from https://aistudio.google.com/apikey'
            }), 429
        print(f"[AI ERROR] {str(e)}")
        return jsonify({'error': f'AI generation failed: {str(e)}'}), 500


@ai_bp.route('/save-questions', methods=['POST'])
@jwt_required()
def save_questions():
    """Save AI-generated questions to the database."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role not in ('faculty', 'admin'):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json
    exam_id = data.get('exam_id')
    questions = data.get('questions', [])
    exam_type = data.get('exam_type', 'mcq')

    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({'error': 'Exam not found'}), 404

    saved = 0
    try:
        for q in questions:
            if exam_type == 'mcq':
                mcq = MCQQuestion(
                    exam_id=exam_id,
                    question_text=q.get('question_text', ''),
                    option_a=q.get('option_a', ''),
                    option_b=q.get('option_b', ''),
                    option_c=q.get('option_c', ''),
                    option_d=q.get('option_d', ''),
                    correct_option=q.get('correct_option', 'A').upper()
                )
                db.session.add(mcq)
                saved += 1
            else:
                cq = CodingQuestion(
                    exam_id=exam_id,
                    title=q.get('title', ''),
                    problem_statement=q.get('problem_statement', ''),
                    input_format=q.get('input_format', ''),
                    output_format=q.get('output_format', ''),
                    constraints=q.get('constraints', '')
                )
                db.session.add(cq)
                db.session.flush()

                for tc in q.get('test_cases', []):
                    test_case = TestCase(
                        coding_question_id=cq.id,
                        input_data=tc.get('input_data', ''),
                        expected_output=tc.get('expected_output', ''),
                        is_hidden=tc.get('is_hidden', True)
                    )
                    db.session.add(test_case)
                saved += 1

        db.session.commit()
        return jsonify({'message': f'{saved} questions saved successfully', 'saved': saved}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save: {str(e)}'}), 500
