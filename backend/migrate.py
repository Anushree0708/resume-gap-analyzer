# migrate.py
# Run ONCE on your database to switch from JWT-auth columns to session_id.
# Place in your backend/ folder and run:  python migrate.py

import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

migrations = [
    "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS session_id VARCHAR;",
    "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS experience_score FLOAT;",
    # Optional cleanup — removes the old user_id foreign key & column
    "ALTER TABLE resume_analysis DROP CONSTRAINT IF EXISTS resume_analysis_user_id_fkey;",
    "ALTER TABLE resume_analysis DROP COLUMN IF EXISTS user_id;",
]

with engine.connect() as conn:
    for sql in migrations:
        try:
            conn.execute(text(sql))
            print(f"✅  {sql.strip()[:80]}")
        except Exception as e:
            print(f"⚠️  Skipped: {e}")
    conn.commit()

print("\n✅ Migration complete.")