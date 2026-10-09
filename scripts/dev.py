"""Run all three services in one terminal; Ctrl+C stops the owned processes."""
import os
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]


def main():
    children = []
    options = {'creationflags': subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == 'nt' else {}
    try:
        for service, port in [('backend', 8000), ('ai_notification_service', 8001)]:
            python = ROOT / service / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
            if not python.exists():
                raise RuntimeError('Run scripts/setup.ps1 first (or install both .venv environments).')
            children.append(subprocess.Popen([str(python), '-m', 'uvicorn', 'app.main:app',
                                               '--host', '127.0.0.1', '--port', str(port)], cwd=ROOT / service, **options))
        children.append(subprocess.Popen(['cmd', '/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1'] if os.name == 'nt'
                                         else ['npm', 'run', 'dev', '--', '--host', '127.0.0.1'],
                                         cwd=ROOT / 'mediconnect-ai', **options))
        print('Frontend: http://localhost:5173 | Backend: http://localhost:8000/docs | Voice: http://localhost:8001/docs', flush=True)
        while all(child.poll() is None for child in children):
            time.sleep(.5)
        raise RuntimeError('A service exited. Check its output above; the other services will stop.')
    except KeyboardInterrupt:
        pass
    finally:
        for child in children:
            if child.poll() is None:
                if os.name == 'nt':
                    subprocess.run(['taskkill', '/PID', str(child.pid), '/T', '/F'],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                   creationflags=subprocess.CREATE_NO_WINDOW)
                else:
                    child.terminate()
            child.wait(timeout=10)


if __name__ == '__main__':
    main()
