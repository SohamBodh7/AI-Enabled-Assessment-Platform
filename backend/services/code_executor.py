import subprocess
import tempfile
import os
import time


def execute_code(code, input_data, timeout=3):
    """
    Execute Python code with given input and return the output.
    Uses subprocess with timeout to prevent infinite loops.

    Returns:
        dict: {
            'output': str,
            'error': str or None,
            'execution_time': float,
            'status': 'success' | 'error' | 'timeout'
        }
    """
    # Create a temporary file for the code
    tmp_file = None
    try:
        tmp_file = tempfile.NamedTemporaryFile(
            mode='w', suffix='.py', delete=False, encoding='utf-8'
        )
        tmp_file.write(code)
        tmp_file.close()

        start_time = time.time()

        result = subprocess.run(
            ['python', tmp_file.name],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=tempfile.gettempdir(),
            env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'}
        )

        execution_time = round(time.time() - start_time, 3)

        if result.returncode != 0:
            return {
                'output': result.stdout.strip(),
                'error': result.stderr.strip(),
                'execution_time': execution_time,
                'status': 'error'
            }

        return {
            'output': result.stdout.strip(),
            'error': None,
            'execution_time': execution_time,
            'status': 'success'
        }

    except subprocess.TimeoutExpired:
        return {
            'output': '',
            'error': f'Time Limit Exceeded ({timeout}s)',
            'execution_time': timeout,
            'status': 'timeout'
        }
    except Exception as e:
        return {
            'output': '',
            'error': str(e),
            'execution_time': 0,
            'status': 'error'
        }
    finally:
        if tmp_file and os.path.exists(tmp_file.name):
            os.unlink(tmp_file.name)


def run_against_test_cases(code, test_cases, timeout=3):
    """
    Run code against multiple test cases and return results.

    Returns:
        dict: {
            'results': list of test case results,
            'passed': int,
            'total': int,
            'score': float (percentage)
        }
    """
    results = []
    passed = 0
    total = len(test_cases)

    for tc in test_cases:
        result = execute_code(code, tc['input_data'], timeout)

        expected = tc['expected_output'].strip()
        actual = result['output'].strip()
        is_passed = (result['status'] == 'success' and actual == expected)

        if is_passed:
            passed += 1

        results.append({
            'test_case_id': tc.get('id'),
            'input': tc['input_data'],
            'expected': expected,
            'actual': actual,
            'passed': is_passed,
            'status': result['status'],
            'error': result['error'],
            'execution_time': result['execution_time'],
            'is_hidden': tc.get('is_hidden', False)
        })

    score = round((passed / total) * 100, 2) if total > 0 else 0

    return {
        'results': results,
        'passed': passed,
        'total': total,
        'score': score
    }
