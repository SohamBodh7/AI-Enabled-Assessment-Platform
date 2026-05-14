"""SocketIO events for real-time exam monitoring and chat."""
from flask_socketio import SocketIO, emit, join_room, leave_room

socketio = SocketIO(cors_allowed_origins="*")


def init_socketio(app):
    """Initialize SocketIO with the Flask app."""
    socketio.init_app(app)
    return socketio


@socketio.on('connect')
def handle_connect():
    print('[WS] Client connected')


@socketio.on('disconnect')
def handle_disconnect():
    print('[WS] Client disconnected')


@socketio.on('student_join')
def handle_student_join(data):
    """Student joins a room for their exam session."""
    room = f"exam_{data.get('exam_id')}"
    session_room = f"session_{data.get('session_id')}"
    join_room(room)
    join_room(session_room)
    emit('student_joined', {
        'student_id': data.get('student_id'),
        'student_name': data.get('student_name'),
        'session_id': data.get('session_id'),
        'exam_id': data.get('exam_id'),
    }, to=room)
    print(f"[WS] Student {data.get('student_name')} joined exam {data.get('exam_id')}")


@socketio.on('faculty_join')
def handle_faculty_join(data):
    """Faculty joins a room to monitor an exam."""
    room = f"exam_{data.get('exam_id')}"
    join_room(room)
    print(f"[WS] Faculty joined monitoring for exam {data.get('exam_id')}")


@socketio.on('send_message')
def handle_send_message(data):
    """Relay a chat message to the session room."""
    session_room = f"session_{data.get('session_id')}"
    emit('new_message', data, to=session_room)


@socketio.on('send_warning')
def handle_send_warning(data):
    """Faculty sends a warning — relay to the student's session room."""
    session_room = f"session_{data.get('session_id')}"
    exam_room = f"exam_{data.get('exam_id')}"
    emit('warning_received', data, to=session_room)
    emit('session_updated', data, room=exam_room)


@socketio.on('terminate_exam')
def handle_terminate(data):
    """Faculty terminates an exam — student gets kicked out."""
    session_room = f"session_{data.get('session_id')}"
    exam_room = f"exam_{data.get('exam_id')}"
    emit('exam_terminated', data, to=session_room)
    emit('session_updated', data, room=exam_room)


@socketio.on('student_submitted')
def handle_student_submitted(data):
    """Student submitted their exam — notify faculty monitor."""
    exam_room = f"exam_{data.get('exam_id')}"
    emit('session_updated', data, room=exam_room)


@socketio.on('heartbeat')
def handle_heartbeat(data):
    """Student sends periodic heartbeat to show they're still active."""
    exam_room = f"exam_{data.get('exam_id')}"
    emit('student_heartbeat', data, room=exam_room)


@socketio.on('camera_frame')
def handle_camera_frame(data):
    """Student sends a webcam frame — relay to faculty monitoring the exam."""
    exam_room = f"exam_{data.get('exam_id')}"
    emit('student_camera_frame', {
        'session_id': data.get('session_id'),
        'student_id': data.get('student_id'),
        'frame': data.get('frame'),
    }, room=exam_room)
