"""
database.py
------------
This file sets up the connection to our PostgreSQL database using SQLAlchemy.

Key pieces:
- engine: the actual connection to PostgreSQL
- SessionLocal: a factory that creates new DB "sessions" (like a conversation with the DB)
- Base: the parent class that all our models (Patient, Doctor, Appointment) will inherit from
- get_db(): a helper function that FastAPI will use to give each API request its own DB session
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load variables from the .env file (like DATABASE_URL) into the environment
load_dotenv()

# Read the database connection string from the environment.
# Falls back to a default SQLite database file if .env is missing.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./mediconnect.db"
)

# The engine is the low-level object that actually talks to the database
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal is a "factory" — every time we call SessionLocal(), we get a new DB session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the class our SQLAlchemy models (Patient, Doctor, Appointment) will inherit from.
# SQLAlchemy uses this to know which Python classes map to which database tables.
Base = declarative_base()


def get_db():
    """
    This function is used as a FastAPI "dependency".
    For every API request, FastAPI will:
      1. Call this function to open a new DB session
      2. Pass that session into the route function
      3. Automatically close the session once the request is done (even if it errors)
    This pattern prevents DB connections from leaking/staying open.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
