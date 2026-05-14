from app import create_app
from models import db, User, Exam, MCQQuestion, CodingQuestion, TestCase

app = create_app()

with app.app_context():
    faculty = User.query.filter_by(role='faculty').first()
    if not faculty:
        print("No faculty found! Cannot seed exams.")
        exit(1)
        
    print(f"Seeding exams for faculty ID: {faculty.id} | Email: {faculty.email}")
    
    # 1. MCQ Exam
    mcq_exam = Exam(
        title="Python Basics Quiz",
        description="A simple quiz to test basic Python knowledge. Good luck!",
        type="mcq",
        duration=15,
        created_by=faculty.id
    )
    db.session.add(mcq_exam)
    db.session.flush()
    
    q1 = MCQQuestion(
        exam_id=mcq_exam.id,
        question_text="What is the output of `print(2 ** 3)`?",
        option_a="5",
        option_b="6",
        option_c="8",
        option_d="9",
        correct_option="C"
    )
    q2 = MCQQuestion(
        exam_id=mcq_exam.id,
        question_text="Which keyword is used to define a function in Python?",
        option_a="func",
        option_b="def",
        option_c="function",
        option_d="define",
        correct_option="B"
    )
    q3 = MCQQuestion(
        exam_id=mcq_exam.id,
        question_text="What data type is the object `L = [1, 23, 'hello', 1]`?",
        option_a="List",
        option_b="Dictionary",
        option_c="Tuple",
        option_d="Array",
        correct_option="A"
    )
    db.session.add_all([q1, q2, q3])
    
    # 2. Coding Exam
    coding_exam = Exam(
        title="Data Structures & Algorithms Challenge",
        description="Write python code to solve data structure problems. Ensure your logic handles edge cases.",
        type="coding",
        duration=60,
        created_by=faculty.id
    )
    db.session.add(coding_exam)
    db.session.flush()
    
    cq1 = CodingQuestion(
        exam_id=coding_exam.id,
        title="Two Sum",
        problem_statement="Given an array of integers nums and an integer target, print the indices of the two numbers such that they add up to target.",
        input_format="First line: integer n. Second line: n space-separated integers. Third line: target integer.",
        output_format="Two space-separated integers representing the indices (0-based) in ascending order.",
        constraints="2 <= nums.length <= 10^4"
    )
    db.session.add(cq1)
    db.session.flush()
    
    tc1 = TestCase(coding_question_id=cq1.id, input_data="4\n2 7 11 15\n9", expected_output="0 1", is_hidden=False)
    tc2 = TestCase(coding_question_id=cq1.id, input_data="3\n3 2 4\n6", expected_output="1 2", is_hidden=True)
    tc3 = TestCase(coding_question_id=cq1.id, input_data="2\n3 3\n6", expected_output="0 1", is_hidden=True)
    db.session.add_all([tc1, tc2, tc3])
    
    cq2 = CodingQuestion(
        exam_id=coding_exam.id,
        title="Palindrome String",
        problem_statement="Write a program to check if a given string is a palindrome. Ignore case and spaces.",
        input_format="A single string s on one line.",
        output_format="Print 'True' if it is a palindrome, else 'False'.",
        constraints="1 <= s.length <= 1000"
    )
    db.session.add(cq2)
    db.session.flush()
    
    tc4 = TestCase(coding_question_id=cq2.id, input_data="racecar", expected_output="True", is_hidden=False)
    tc5 = TestCase(coding_question_id=cq2.id, input_data="hello", expected_output="False", is_hidden=False)
    tc6 = TestCase(coding_question_id=cq2.id, input_data="A man a plan a canal Panama", expected_output="True", is_hidden=True)
    db.session.add_all([tc4, tc5, tc6])
    
    db.session.commit()
    print("Successfully seeded dummy MCQ and Coding exams for the faculty.")
