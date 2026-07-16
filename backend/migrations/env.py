import os
import sys
from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool
from dotenv import load_dotenv

from alembic import context

# --- MediConnect customization starts here ---

# Make sure Python can find our "app" package (models, database.py) when
# Alembic runs from the project root.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Load DATABASE_URL from .env, same as the main FastAPI app does
load_dotenv()

# Import Base and all our models so Alembic knows about every table.
# Without importing the model files directly, Base.metadata would be empty
# even though Base itself is imported.
from app.database import Base  # noqa: E402
from app.models import patient, doctor, appointment, medical_report, prescription, department  # noqa: E402, F401

# --- MediConnect customization ends here ---

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# IMPORTANT: we deliberately do NOT put DATABASE_URL into the Alembic Config
# object (e.g. via config.set_main_option) or read it back with
# config.get_main_option(). That path goes through Python's configparser,
# which treats "%" as a special interpolation character. Real-world DB
# passwords are often URL-encoded and contain "%" (e.g. "%40" for "@"),
# which crashes configparser with "invalid interpolation syntax".
# Instead we keep DATABASE_URL as a plain Python variable and pass it
# straight to SQLAlchemy, bypassing configparser entirely.
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise RuntimeError(
        "DATABASE_URL is not set. Make sure you have a .env file in the "
        "backend/ project root (copy .env.example to .env and fill it in)."
    )

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Point Alembic at our models' metadata so "autogenerate" can compare
# our Python models against the real database and detect differences.
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Build the engine directly from our plain db_url string (see the note
    # above on why we avoid engine_from_config/config.get_main_option here).
    connectable = create_engine(db_url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
