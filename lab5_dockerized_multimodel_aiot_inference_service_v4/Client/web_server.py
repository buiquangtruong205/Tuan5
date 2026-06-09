from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


HOST = "127.0.0.1"
PORT = 5500
API_BASE_URL = "http://127.0.0.1:8000"


class ProxyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/"):
            self.proxy()
            return

        super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/"):
            self.proxy()
            return

        self.send_error(404, "Not found")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def proxy(self):
        target_path = self.path.removeprefix("/api")
        target_url = f"{API_BASE_URL}{target_path}"
        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length) if content_length else None
        headers = {
            key: value
            for key, value in self.headers.items()
            if key.lower() not in {"host", "origin", "referer", "content-length"}
        }

        request = Request(target_url, data=body, headers=headers, method=self.command)

        try:
            with urlopen(request, timeout=30) as response:
                self.send_response(response.status)
                self.copy_response_headers(response.headers)
                self.end_headers()
                self.wfile.write(response.read())
        except HTTPError as error:
            self.send_response(error.code)
            self.copy_response_headers(error.headers)
            self.end_headers()
            self.wfile.write(error.read())
        except URLError as error:
            self.send_error(502, f"Cannot reach API server: {error.reason}")

    def copy_response_headers(self, headers):
        skip = {"transfer-encoding", "connection", "content-encoding"}
        for key, value in headers.items():
            if key.lower() not in skip:
                self.send_header(key, value)
        self.send_header("Access-Control-Allow-Origin", "*")


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), ProxyHandler)
    print(f"Web: http://{HOST}:{PORT}/index.html")
    print(f"Proxy: http://{HOST}:{PORT}/api -> {API_BASE_URL}")
    server.serve_forever()
