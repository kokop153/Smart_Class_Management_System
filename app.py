#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smart Class Management System - Flask Server
"""

from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import json
import os
import threading
import time
from datetime import datetime

# Create Flask app
app = Flask(__name__, static_folder='.')
CORS(app)

# Config
PORT = 8080
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

# Ensure data directory exists
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Config file paths
CONFIG_FILE = os.path.join(DATA_DIR, 'config.json')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')

# Memory cache
config_cache = None
users_cache = None
cache_time = 0
CACHE_DURATION = 5  # Cache duration (seconds)

# SSE client connections
sse_clients = []


def read_json_file(file_path, use_cache=True):
    """Read JSON file (with cache)"""
    global config_cache, users_cache, cache_time
    
    now = time.time()
    
    # Check if cache is valid
    if use_cache and now - cache_time < CACHE_DURATION:
        if file_path == CONFIG_FILE and config_cache is not None:
            return config_cache
        if file_path == USERS_FILE and users_cache is not None:
            return users_cache
    
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Update cache
            if file_path == CONFIG_FILE:
                config_cache = data
            elif file_path == USERS_FILE:
                users_cache = data
            cache_time = now
            
            return data
    except Exception as e:
        print(f'[Error] Failed to read file: {file_path}, {e}')
    
    return None


def write_json_file(file_path, data):
    """Write JSON file"""
    global config_cache, users_cache, cache_time
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Clear cache
        if file_path == CONFIG_FILE:
            config_cache = None
        elif file_path == USERS_FILE:
            users_cache = None
        cache_time = 0
        
        return True
    except Exception as e:
        print(f'[Error] Failed to write file: {file_path}, {e}')
        return False


def init_data():
    """Initialize default data"""
    if not os.path.exists(CONFIG_FILE):
        default_config = {
            "class_name": "Class 7, Grade 7",
            "students": [],
            "logs": [],
            "quick_actions": {
                "rewards": [
                    {"text": "+1 Good Performance", "points": 1, "reason": "Good Performance"},
                    {"text": "+2 Active Participation", "points": 2, "reason": "Active Participation"},
                    {"text": "+3 Excellent Homework", "points": 3, "reason": "Excellent Homework"},
                    {"text": "+5 Major Contribution", "points": 5, "reason": "Major Contribution"}
                ],
                "punishments": [
                    {"text": "-1 Small Mistake", "points": -1, "reason": "Small Mistake"},
                    {"text": "-2 Missing Homework", "points": -2, "reason": "Missing Homework"},
                    {"text": "-3 Class Violation", "points": -3, "reason": "Class Violation"}
                ]
            }
        }
        write_json_file(CONFIG_FILE, default_config)
        print('[Info] Default config created')
    
    if not os.path.exists(USERS_FILE):
        default_users = [
            {"username": "teacher", "password": "teacher123", "role": "teacher", "created": datetime.now().isoformat()}
        ]
        write_json_file(USERS_FILE, default_users)
        print('[Info] Default user created')


def broadcast_update(data_type):
    """Broadcast update to all SSE clients"""
    message = f'event: update\ndata: {{"type": "{data_type}", "timestamp": {int(time.time() * 1000)}}}\n\n'
    
    dead_clients = []
    for client in sse_clients:
        try:
            client.send(message)
        except:
            dead_clients.append(client)
    
    # Clean up disconnected clients
    for client in dead_clients:
        if client in sse_clients:
            sse_clients.remove(client)


def watch_files():
    """Watch for file changes"""
    try:
        import watchdog.observers
        import watchdog.events
        
        class FileEventHandler(watchdog.events.FileSystemEventHandler):
            def on_modified(self, event):
                if not event.is_directory:
                    filename = os.path.basename(event.src_path)
                    print(f'[File Changed] {filename} has been modified')
                    
                    # Clear cache
                    global config_cache, users_cache
                    if filename == 'config.json':
                        config_cache = None
                    elif filename == 'users.json':
                        users_cache = None
                    
                    # Broadcast update
                    if filename == 'config.json':
                        broadcast_update('config')
                    elif filename == 'users.json':
                        broadcast_update('users')
        
        observer = watchdog.observers.Observer()
        observer.schedule(FileEventHandler(), DATA_DIR, recursive=False)
        observer.start()
        print('[File Watch] Started, modifying files in data/ will auto-update pages')
        
        return observer
    except ImportError:
        print('[Warning] watchdog not installed, using simple polling')
        return None


def poll_files():
    """Simple polling to watch file changes"""
    last_config_time = 0
    last_users_time = 0
    
    while True:
        try:
            if os.path.exists(CONFIG_FILE):
                config_stat = os.stat(CONFIG_FILE)
                if config_stat.st_mtime != last_config_time:
                    last_config_time = config_stat.st_mtime
                    print('[File Changed] config.json has been modified')
                    broadcast_update('config')
            
            if os.path.exists(USERS_FILE):
                users_stat = os.stat(USERS_FILE)
                if users_stat.st_mtime != last_users_time:
                    last_users_time = users_stat.st_mtime
                    print('[File Changed] users.json has been modified')
                    broadcast_update('users')
        except Exception as e:
            pass
        
        time.sleep(1)


# ========== Routes ==========

@app.route('/')
def index():
    """Homepage"""
    return send_from_directory('.', 'index.html')


@app.route('/admin.html')
def admin():
    """Admin backend"""
    return send_from_directory('.', 'admin.html')


@app.route('/login.html')
def student_login_page():
    """Student login"""
    return send_from_directory('.', 'login.html')


@app.route('/teacher-login.html')
def teacher_login_page():
    """Teacher login"""
    return send_from_directory('.', 'teacher-login.html')


@app.route('/student-admin.html')
def student_admin():
    """Student admin backend"""
    return send_from_directory('.', 'student-admin.html')


@app.route('/sse-client.js')
def sse_client_js():
    """SSE client script"""
    return send_from_directory('.', 'sse-client.js')


@app.route('/api/sse')
def sse():
    """SSE connection"""
    def generate():
        sse_clients.append(request.environ['wsgi.input'])
        try:
            yield 'event: connected\ndata: {"status": "connected"}\n\n'
            while True:
                time.sleep(30)
                yield ': ping\n\n'
        except GeneratorExit:
            pass
        finally:
            if request.environ['wsgi.input'] in sse_clients:
                sse_clients.remove(request.environ['wsgi.input'])
    
    return Response(generate(), mimetype='text/event-stream')


@app.route('/api/config', methods=['GET'])
def get_config():
    """Read config"""
    config = read_json_file(CONFIG_FILE, use_cache=False)
    if config:
        return jsonify(config)
    return jsonify({"error": "Config file not found"}), 404


@app.route('/api/config', methods=['PUT'])
def update_config():
    """Update config"""
    config = request.json
    if write_json_file(CONFIG_FILE, config):
        broadcast_update('config')
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Write failed"}), 500


@app.route('/api/users', methods=['GET'])
def get_users():
    """Read user list"""
    users = read_json_file(USERS_FILE, use_cache=False) or []
    # Don't return passwords
    safe_users = [{"username": u["username"], "role": u["role"], "created": u["created"]} for u in users]
    return jsonify(safe_users)


@app.route('/api/users', methods=['POST'])
def create_user():
    """Create user"""
    new_user = request.json
    users = read_json_file(USERS_FILE, use_cache=False) or []
    
    # Check if username already exists
    if any(u["username"] == new_user["username"] for u in users):
        return jsonify({"success": False, "error": "Username already exists"}), 400
    
    new_user["created"] = datetime.now().isoformat()
    users.append(new_user)
    
    if write_json_file(USERS_FILE, users):
        broadcast_update('users')
        return jsonify({"success": True}), 201
    return jsonify({"success": False, "error": "Write failed"}), 500


@app.route('/api/login', methods=['POST'])
def api_login():
    """User login"""
    credentials = request.json
    users = read_json_file(USERS_FILE, use_cache=False) or []
    
    user = next((u for u in users if u["username"] == credentials["username"] and u["password"] == credentials["password"]), None)
    
    if user:
        safe_user = {k: v for k, v in user.items() if k != 'password'}
        return jsonify({"success": True, "user": safe_user})
    return jsonify({"success": False, "error": "Invalid username or password"}), 401


@app.route('/api/users/<username>', methods=['DELETE'])
def delete_user(username):
    """Delete user"""
    users = read_json_file(USERS_FILE, use_cache=False) or []
    users = [u for u in users if u["username"] != username]
    
    if write_json_file(USERS_FILE, users):
        broadcast_update('users')
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Write failed"}), 500


@app.route('/api/users/<username>', methods=['PUT'])
def update_user(username):
    """Update user"""
    updated_user = request.json
    users = read_json_file(USERS_FILE, use_cache=False) or []
    
    user_index = next((i for i, u in enumerate(users) if u["username"] == username), None)
    if user_index is None:
        return jsonify({"success": False, "error": "User not found"}), 404
    
    users[user_index] = {**users[user_index], **updated_user}
    
    if write_json_file(USERS_FILE, users):
        broadcast_update('users')
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Write failed"}), 500


# ========== Main ==========

if __name__ == '__main__':
    print('=' * 50)
    print('  Smart Class Management System - Flask Server')
    print('=' * 50)
    print()
    
    # Initialize data
    init_data()
    
    # Start file watcher
    observer = watch_files()
    if observer is None:
        # Use polling
        poll_thread = threading.Thread(target=poll_files, daemon=True)
        poll_thread.start()
    
    print()
    print('========================================')
    print('  Server Started')
    print('========================================')
    print(f'  Frontend: http://localhost:{PORT}/')
    print(f'  Admin: http://localhost:{PORT}/admin.html')
    print(f'  Student Login: http://localhost:{PORT}/login.html')
    print(f'  Teacher Login: http://localhost:{PORT}/teacher-login.html')
    print('========================================')
    print(f'  Default Teacher Account: teacher / teacher123')
    print(f'  Data File: data/config.json')
    print('========================================')
    print()
    print('[Tip] After modifying data/config.json, pages will auto-refresh!')
    print('[Tip] Press Ctrl+C to stop the server')
    print()
    
    # Start Flask server
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
