"""Serve the exported Expo web bundle locally with SPA routing; not a backend."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from functools import partial
import argparse

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        # Auth callback URLs may contain short-lived codes. Keep them out of logs.
        pass

    def do_GET(self):
        requested = Path(self.translate_path(self.path.split('?', 1)[0]))
        if not requested.exists() and not requested.suffix:
            self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8082)
    parser.add_argument('--directory', type=Path)
    args = parser.parse_args()
    directory = args.directory.resolve() if args.directory else Path(__file__).resolve().parent.parent / 'dist'
    if not (directory / 'index.html').exists():
        raise SystemExit('Ejecuta primero npm run export:web')
    print(f'EntreVecinos: http://localhost:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(directory))).serve_forever()
