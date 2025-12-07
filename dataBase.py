import sqlite3

conn = sqlite3.connect("tasks.db")
c = conn.cursor()

c.execute("""
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending'
)
""")

conn.commit()
conn.close()
