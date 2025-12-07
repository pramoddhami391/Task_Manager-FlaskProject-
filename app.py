from flask import Flask, render_template, request, redirect, url_for
import sqlite3

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('tasks.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    conn = get_db_connection()
    tasks = conn.execute('SELECT * FROM tasks').fetchall()
    conn.close()
    return render_template('index.html', tasks=tasks)

@app.route('/add', methods=['GET', 'POST'])
def add_task():
    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']

        conn = get_db_connection()
        conn.execute("INSERT INTO tasks (title, description) VALUES (?, ?)",
                     (title, description))
        conn.commit()
        conn.close()

        return redirect(url_for('index'))

    return render_template('add_task.html')

@app.route('/edit/<int:id>', methods=['GET', 'POST'])
def edit_task(id):
    conn = get_db_connection()
    task = conn.execute('SELECT * FROM tasks WHERE id = ?', (id,)).fetchone()

    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        status = request.form['status']

        conn.execute("UPDATE tasks SET title=?, description=?, status=? WHERE id=?",
                     (title, description, status, id))
        conn.commit()
        conn.close()

        return redirect(url_for('index'))

    conn.close()
    return render_template('edit_task.html', task=task)

@app.route('/delete/<int:id>')
def delete_task(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM tasks WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
