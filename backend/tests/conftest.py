import os
import tempfile
from pathlib import Path
os.environ['DATABASE_URL'] = f"sqlite:///{(Path(tempfile.gettempdir()) / 'proactivecare-test-bootstrap.db').as_posix()}"
os.environ['APP_ENV'] = 'development'
os.environ['SERVICE_TOKEN'] = 'test-service-token'

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.doctor import Doctor


@pytest.fixture
def client(tmp_path):
    engine = create_engine(f'sqlite:///{tmp_path / "test.db"}', connect_args={'check_same_thread': False})
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        db.add_all([Doctor(name='Dr. Patel', department='Cardiology', email='patel@example.com'),
                    Doctor(name='Dr. Chen', department='General', email='chen@example.com')])
        db.commit()
    def override():
        with sessions() as db:
            yield db
    app.dependency_overrides[get_db] = override
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def staff(client):
    response = client.post('/api/auth/login', json={'email': 'admin@mediconnect.ai', 'password': 'admin123'})
    assert response.status_code == 200
    return {'Authorization': f'Bearer {response.json()["token"]}'}
