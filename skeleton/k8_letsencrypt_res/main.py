import os

import http.server
import socketserver
from http import HTTPStatus


ENV = os.environ
PORT = int(ENV['APP_PORT']) if 'APP_PORT' in ENV else 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        print('Get received...')
        self.send_response(HTTPStatus.OK)
        self.end_headers()

        response = b'none'
        if 'RESPONSE' in os.environ:
            response = str.encode(os.environ['RESPONSE'])

        self.wfile.write(response)


httpd = socketserver.TCPServer(('', int(PORT)), Handler)
print('Service run at port: {}'.format(PORT))
httpd.serve_forever()
