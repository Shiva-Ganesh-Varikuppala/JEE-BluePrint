import os
import base64
import json
import urllib.error
import urllib.request
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from syllabus import flattened_syllabus

load_dotenv()
app = Flask(__name__)
app.config.update(SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'sqlite:///jee_blueprint.db'), SQLALCHEMY_TRACK_MODIFICATIONS=False, JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY', 'local-development-key-change-this-before-deploying'), JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=14))
CORS(app, resources={r'/api/*': {'origins': os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')}})
db, jwt = SQLAlchemy(app), JWTManager(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    def public(self): return {'id': self.id, 'name': self.name, 'email': self.email}

class ChapterProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    chapter_key = db.Column(db.String(180), nullable=False)
    progress = db.Column(db.Integer, nullable=False, default=0)
    __table_args__ = (db.UniqueConstraint('user_id', 'chapter_key', name='user_chapter_progress'),)

class SubtopicProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    subtopic_key = db.Column(db.String(320), nullable=False)
    done = db.Column(db.Boolean, nullable=False, default=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'subtopic_key', name='user_subtopic_progress'),)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    title = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text, default='')
    subject = db.Column(db.String(40), default='General')
    chapter = db.Column(db.String(120), default='')
    priority = db.Column(db.String(12), default='medium')
    estimated_minutes = db.Column(db.Integer, default=60)
    status = db.Column(db.String(16), default='pending', index=True)
    deadline = db.Column(db.String(10), default='')
    progress = db.Column(db.Integer, default=0)
    tags = db.Column(db.String(300), default='')
    notes = db.Column(db.Text, default='')
    category = db.Column(db.String(40), default='study')
    recurrence = db.Column(db.String(20), default='none')
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    def public(self):
        return {key: getattr(self, key) for key in ('id', 'title', 'description', 'subject', 'chapter', 'priority', 'estimated_minutes', 'status', 'deadline', 'progress', 'tags', 'notes', 'category', 'recurrence')}

with app.app_context(): db.create_all()

def credentials():
    body = request.get_json(silent=True) or {}
    name, email, password = body.get('name', '').strip(), body.get('email', '').strip().lower(), body.get('password', '')
    if not email or '@' not in email or len(password) < 6: return None, (jsonify(error='Enter a valid email and a password of at least 6 characters.'), 400)
    return (name, email, password), None

@app.post('/api/auth/register')
def register():
    values, error = credentials()
    if error: return error
    name, email, password = values
    if not name: return jsonify(error='Please enter your name.'), 400
    if User.query.filter_by(email=email).first(): return jsonify(error='An account already exists for this email.'), 409
    user = User(name=name, email=email, password_hash=generate_password_hash(password)); db.session.add(user); db.session.commit()
    return jsonify(user=user.public(), token=create_access_token(identity=str(user.id))), 201

@app.post('/api/auth/login')
def login():
    values, error = credentials()
    if error: return error
    _, email, password = values; user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password): return jsonify(error='Email or password is incorrect.'), 401
    return jsonify(user=user.public(), token=create_access_token(identity=str(user.id)))

@app.get('/api/auth/me')
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    return jsonify(user=user.public()) if user else (jsonify(error='Account not found.'), 404)

@app.get('/api/syllabus')
@jwt_required()
def syllabus():
    user_id = int(get_jwt_identity())
    done_subtopics = {item.subtopic_key for item in SubtopicProgress.query.filter_by(user_id=user_id, done=True).all()}
    chapters = []
    for chapter in flattened_syllabus():
        chapter_key = f"{chapter['subject']}|{chapter['grade']}|{chapter['title']}"
        subtopics_done = [f"{chapter_key}||{i}" in done_subtopics for i in range(len(chapter['subtopics']))]
        total = len(subtopics_done)
        progress = round(100 * sum(subtopics_done) / total) if total else 0
        chapters.append({**chapter, 'key': chapter_key, 'subtopicsDone': subtopics_done, 'progress': progress})
    return jsonify(chapters=chapters, total=len(chapters))

@app.patch('/api/syllabus/<path:chapter_key>')
@jwt_required()
def update_syllabus(chapter_key):
    body = request.get_json(silent=True) or {}; progress = body.get('progress')
    if not isinstance(progress, int) or not 0 <= progress <= 100: return jsonify(error='Progress must be a number from 0 to 100.'), 400
    if chapter_key not in {f"{c['subject']}|{c['grade']}|{c['title']}" for c in flattened_syllabus()}: return jsonify(error='Chapter not found.'), 404
    user_id = int(get_jwt_identity()); record = ChapterProgress.query.filter_by(user_id=user_id, chapter_key=chapter_key).first()
    if not record: record = ChapterProgress(user_id=user_id, chapter_key=chapter_key); db.session.add(record)
    record.progress = progress; db.session.commit()
    return jsonify(progress=record.progress)

@app.patch('/api/syllabus/<path:chapter_key>/subtopics/<int:index>')
@jwt_required()
def update_subtopic(chapter_key, index):
    body = request.get_json(silent=True) or {}; done = body.get('done')
    if not isinstance(done, bool): return jsonify(error='done must be true or false.'), 400
    chapter = next((c for c in flattened_syllabus() if f"{c['subject']}|{c['grade']}|{c['title']}" == chapter_key), None)
    if not chapter or not (0 <= index < len(chapter['subtopics'])): return jsonify(error='Subtopic not found.'), 404
    user_id = int(get_jwt_identity()); subtopic_key = f"{chapter_key}||{index}"
    record = SubtopicProgress.query.filter_by(user_id=user_id, subtopic_key=subtopic_key).first()
    if not record: record = SubtopicProgress(user_id=user_id, subtopic_key=subtopic_key); db.session.add(record)
    record.done = done; db.session.commit()
    done_count = SubtopicProgress.query.filter_by(user_id=user_id, done=True).filter(SubtopicProgress.subtopic_key.like(f"{chapter_key}||%")).count()
    total = len(chapter['subtopics']); progress = round(100 * done_count / total) if total else 0
    return jsonify(done=record.done, progress=progress)

TASK_FIELDS = {'title', 'description', 'subject', 'chapter', 'priority', 'estimated_minutes', 'status', 'deadline', 'progress', 'tags', 'notes', 'category', 'recurrence'}

def task_for_user(task_id):
    return Task.query.filter_by(id=task_id, user_id=int(get_jwt_identity())).first()

@app.get('/api/tasks')
@jwt_required()
def tasks():
    query = Task.query.filter_by(user_id=int(get_jwt_identity()))
    status, search = request.args.get('status'), request.args.get('search', '').strip()
    if status and status != 'all': query = query.filter_by(status=status)
    if search: query = query.filter(Task.title.ilike(f'%{search}%'))
    return jsonify(tasks=[item.public() for item in query.order_by(Task.created_at.desc()).all()])

@app.post('/api/tasks')
@jwt_required()
def create_task():
    body = request.get_json(silent=True) or {}; title = str(body.get('title', '')).strip()
    if not title: return jsonify(error='A task title is required.'), 400
    task = Task(user_id=int(get_jwt_identity()), title=title)
    for key in TASK_FIELDS - {'title'}:
        if key in body: setattr(task, key, body[key])
    db.session.add(task); db.session.commit()
    return jsonify(task=task.public()), 201

@app.patch('/api/tasks/<int:task_id>')
@jwt_required()
def update_task(task_id):
    task = task_for_user(task_id)
    if not task: return jsonify(error='Task not found.'), 404
    body = request.get_json(silent=True) or {}
    for key in TASK_FIELDS:
        if key in body: setattr(task, key, body[key])
    if not str(task.title).strip(): return jsonify(error='A task title is required.'), 400
    if task.status == 'completed': task.progress = 100
    db.session.commit()
    return jsonify(task=task.public())

@app.delete('/api/tasks/<int:task_id>')
@jwt_required()
def delete_task(task_id):
    task = task_for_user(task_id)
    if not task: return jsonify(error='Task not found.'), 404
    db.session.delete(task); db.session.commit()
    return '', 204

JEE_MASTER_PROMPT = """You are JEE Blueprint's expert tutor for JEE Main and Advanced.
Solve the student's question accurately and teach the method, not just the answer.

Write the response in clean Markdown using exactly these headings: "## Subject and chapter", "## Step-by-step solution", "## Final answer", and "## Exam approach". Use ordered lists for solution steps when useful. Use LaTex only inside complete delimiters: $...$ for inline maths and $$...$$ on its own line for display equations. Every opening $ or $$ must have its matching closing delimiter. Never write raw LaTex outside those delimiters, and never put $$ at only one end of an equation.

First identify the subject and chapter. Then write a concise step-by-step solution, state the final answer prominently, and include one short exam approach explaining how to recognize or solve this question quickly in a timed exam. If the image is unclear or incomplete, say exactly what is missing rather than guessing. Never claim an answer is certain when the question is ambiguous. Keep the answer focused on JEE level."""

@app.post('/api/ai/solve')
@jwt_required()
def solve_with_ai():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key: return jsonify(error='Gemini is not configured. Add GEMINI_API_KEY to backend/.env and restart the API.'), 503
    image = request.files.get('image')
    question = request.form.get('question', '').strip()
    if not image and not question: return jsonify(error='Upload a question image or write a question.'), 400
    if image and image.mimetype not in {'image/jpeg', 'image/png', 'image/webp'}: return jsonify(error='Use a JPG, PNG, or WEBP image.'), 400
    if image and request.content_length and request.content_length > 8 * 1024 * 1024: return jsonify(error='Image must be 8 MB or smaller.'), 400
    parts = [{'text': JEE_MASTER_PROMPT + ('\n\nStudent note: ' + question if question else '')}]
    if image:
        parts.append({'inlineData': {'mimeType': image.mimetype, 'data': base64.b64encode(image.read()).decode('ascii')}})
    payload = json.dumps({'contents': [{'role': 'user', 'parts': parts}], 'generationConfig': {'temperature': 0.2, 'maxOutputTokens': 2048}}).encode('utf-8')
    model = os.getenv('GEMINI_MODEL', 'gemini-3.5-flash')
    endpoint = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
    try:
        req = urllib.request.Request(endpoint, data=payload, headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key}, method='POST')
        with urllib.request.urlopen(req, timeout=60) as response: result = json.loads(response.read().decode('utf-8'))
        answer = result['candidates'][0]['content']['parts'][0]['text']
        return jsonify(answer=answer)
    except urllib.error.HTTPError as error:
        detail = error.read().decode('utf-8', errors='ignore')
        return jsonify(error=f'Gemini could not process this request ({error.code}). {detail[:300]}'), 502
    except (urllib.error.URLError, KeyError, IndexError, json.JSONDecodeError):
        return jsonify(error='Gemini did not return a usable answer. Please try again.'), 502

if __name__ == '__main__': app.run(debug=True, port=int(os.getenv('PORT', '5050')))
