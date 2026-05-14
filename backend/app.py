from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import bcrypt

from config import Config
from models import db, User
from socket_events import init_socketio, socketio


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    init_socketio(app)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.faculty import faculty_bp
    from routes.student import student_bp
    from routes.ai import ai_bp
    from routes.monitor import monitor_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(faculty_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(monitor_bp)

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': 'Bad request'}), 400

    # Health check
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'message': 'API is running'}), 200

    # Create tables and seed admin
    with app.app_context():
        db.create_all()
        seed_admin()

    return app


def seed_admin():
    """Create default users if not exists."""
    admin = User.query.filter_by(email='admin@exam.com').first()
    if not admin:
        password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = User(
            name='Admin',
            email='admin@exam.com',
            password_hash=password_hash,
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        print('[+] Default admin created: admin@exam.com / admin123')

    faculty = User.query.filter_by(email='prof@faculty.com').first()
    if not faculty:
        password_hash = bcrypt.hashpw('faculty123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        faculty = User(
            name='Professor',
            email='prof@faculty.com',
            password_hash=password_hash,
            role='faculty'
        )
        db.session.add(faculty)
        db.session.commit()
        print('[+] Default faculty created: prof@faculty.com / faculty123')


if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, port=5000, use_reloader=False, allow_unsafe_werkzeug=True)
