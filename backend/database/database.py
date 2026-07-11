import sqlite3
import os

BASE_DIR = os.path.dirname(__file__)
DB_NAME = os.path.join(BASE_DIR, "rover.db")


def get_connection():
    return sqlite3.connect(DB_NAME)


def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        battery REAL,
        temperature REAL,
        speed REAL,
        prediction TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()


create_tables()