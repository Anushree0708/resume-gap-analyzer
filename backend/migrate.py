# migrate.py
# Run this once to add the new columns to the existing database table.
# Place this file in your backend/ folder.

import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

migrations = [
    # Add user_id column (nullable so old rows are not affected)
    """
    ALTER TABLE resume_analysis
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
    """,
    # Add experience_score column
    """
    ALTER TABLE resume_analysis
    ADD COLUMN IF NOT EXISTS experience_score FLOAT;
    """,
]

with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print(f"✅ Ran: {sql.strip()[:60]}")
        except Exception as e:
            print(f"⚠️  Skipped (already exists?): {e}")
    conn.commit()

print("✅ Migration complete.")
