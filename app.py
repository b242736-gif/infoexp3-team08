import os
import uuid
from flask import Flask, jsonify, render_template, request
from pathlib import Path
import sqlite3
from datetime import datetime, timezone

app = Flask(__name__)
DB = Path("data/miniboard.db")

# 画像の保存先フォルダを設定
UPLOAD_FOLDER = Path("static/uploads")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

def connect():
    DB.parent.mkdir(exist_ok=True)
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    with connect() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")

        con.execute("""
            CREATE TABLE IF NOT EXISTS surveys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                name TEXT,
                question TEXT,
                option1 TEXT,
                option2 TEXT,
                option3 TEXT,
                option4 TEXT,
                votes1 INTEGER DEFAULT 0,
                votes2 INTEGER DEFAULT 0,
                votes3 INTEGER DEFAULT 0,
                votes4 INTEGER DEFAULT 0
            )
        """)

        # 足りないカラムの自動追加（画像用カラムを追加）
        existing_columns = [row[1] for row in con.execute("PRAGMA table_info(surveys)").fetchall()]
        for col_name, col_type in [
            ("name", "TEXT"), ("question", "TEXT"),
            ("option1", "TEXT"), ("option2", "TEXT"), ("option3", "TEXT"), ("option4", "TEXT"),
            ("votes1", "INTEGER DEFAULT 0"), ("votes2", "INTEGER DEFAULT 0"),
            ("votes3", "INTEGER DEFAULT 0"), ("votes4", "INTEGER DEFAULT 0"),
            ("img_question", "TEXT"), ("img1", "TEXT"), ("img2", "TEXT"), 
            ("img3", "TEXT"), ("img4", "TEXT")
        ]:
            if col_name not in existing_columns:
                con.execute(f"ALTER TABLE surveys ADD COLUMN {col_name} {col_type}")

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/api/messages")
def get_messages():
    with connect() as con:
        rows = con.execute("SELECT * FROM messages ORDER BY id DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.post("/api/messages")
def create_message():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()[:30]
    message = str(data.get("message", "")).strip()[:300]
    if not name or not message:
        return jsonify({"error": "name and message are required"}), 400
    created_at = datetime.now(timezone.utc).isoformat()
    with connect() as con:
        cur = con.execute("INSERT INTO messages(name,message,created_at) VALUES(?,?,?)", (name,message,created_at))
        row = con.execute("SELECT * FROM messages WHERE id=?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201

@app.route("/survey")
def survey_page():
    return render_template("survey.html")

# 4択アンケートの取得（GET）と作成（POST）を行うAPI
@app.route("/api/surveys", methods=["GET", "POST"])
def handle_surveys():
    if request.method == "POST":
        # request.get_json() ではなく request.form でテキストデータを受け取る
        name = request.form.get("name")
        question = request.form.get("question")
        option1 = request.form.get("option1")
        option2 = request.form.get("option2")
        option3 = request.form.get("option3", "")
        option4 = request.form.get("option4", "")
        
        if not question or not option1 or not option2:
            return jsonify({"error": "question and options 1,2 are required"}), 400

        # 画像保存用の補助関数
        def save_image(file_obj):
            if file_obj and file_obj.filename:
                # ファイル名の重複を避けるためUUIDを付与
                ext = file_obj.filename.split('.')[-1]
                filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = UPLOAD_FOLDER / filename
                file_obj.save(filepath)
                return f"/{filepath}" # フロントエンドからアクセスするURLパスを返す
            return None

        # 画像ファイルの保存とパスの取得
        img_question = save_image(request.files.get("img_question"))
        img1 = save_image(request.files.get("img1"))
        img2 = save_image(request.files.get("img2"))
        img3 = save_image(request.files.get("img3"))
        img4 = save_image(request.files.get("img4"))

        with connect() as con:
            con.execute(
                """INSERT INTO surveys 
                   (name, question, option1, option2, option3, option4, 
                    votes1, votes2, votes3, votes4, img_question, img1, img2, img3, img4) 
                   VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?, ?, ?, ?)""",
                (name, question, option1, option2, option3, option4, 
                 img_question, img1, img2, img3, img4)
            )
        return jsonify({"ok": True}), 201
    
    else:
        with connect() as con:
            rows = con.execute("SELECT * FROM surveys ORDER BY id DESC").fetchall()
        return jsonify([dict(r) for r in rows])

@app.route("/api/surveys/<int:survey_id>/vote", methods=["POST"])
def vote_survey(survey_id):
    data = request.get_json(silent=True) or {}
    option = data.get("option")
    
    with connect() as con:
        if option == 1:
            con.execute("UPDATE surveys SET votes1 = votes1 + 1 WHERE id = ?", (survey_id,))
        elif option == 2:
            con.execute("UPDATE surveys SET votes2 = votes2 + 1 WHERE id = ?", (survey_id,))
        elif option == 3:
            con.execute("UPDATE surveys SET votes3 = votes3 + 1 WHERE id = ?", (survey_id,))
        elif option == 4:
            con.execute("UPDATE surveys SET votes4 = votes4 + 1 WHERE id = ?", (survey_id,))
        else:
            return jsonify({"error": "invalid option"}), 400
            
    return jsonify({"ok": True})

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)