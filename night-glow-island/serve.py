# -*- coding: utf-8 -*-
"""本機開發用靜態伺服器：關快取（改檔重整就看得到）＋正確的 MIME。

    python serve.py            # http://127.0.0.1:8777
    python serve.py 9000       # 換 port
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.json': 'application/json',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):
        if '404' in (fmt % args):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f'嚕米的夜光島 → http://127.0.0.1:{port}')
    ThreadingHTTPServer(('127.0.0.1', port), partial(Handler)).serve_forever()
