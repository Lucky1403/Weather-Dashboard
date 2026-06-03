import http.server
import socketserver
import mimetypes
import webbrowser
import os
import time
import threading

PORT = 8080

# Explicitly associate mime types to resolve Windows registry issues
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/svg+xml', '.svg')

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Prevent caching during development/demoing
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def open_browser():
    time.sleep(1.5)
    print("Opening browser...")
    webbrowser.open(f"http://localhost:{PORT}/")

if __name__ == '__main__':
    # Change working directory to the script's directory to serve dashboard files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Run browser opener in a separate thread so it doesn't block the server startup
    threading.Thread(target=open_browser, daemon=True).start()
    
    Handler = MyHandler
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Server successfully started on http://localhost:{PORT}")
            print("Press Ctrl+C to stop the server.")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting server: {e}")
