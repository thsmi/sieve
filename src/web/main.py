
import threading

import time
import os

from script.http import HttpException, HttpResponse

from script.webserver import WebServer

from script.websocket import WebSocket
from script.sievesocket import SieveSocket

from script.messagepump import MessagePump


class FileHandler:

  def __init__(self, base):
    self.__base = base

  def get_content_type(self, filename):

    extension = os.path.splitext(self.__base+filename)

    if extension[1] == ".html":
      return 'text/html'

    if extension[1] == ".js":
      return 'text/javascript'

    if extension[1] == ".mjs":
      return 'text/javascript'

    if extension[1] == ".cjs":
      return 'text/javascript'

    if extension[1] == ".css":
      return 'text/css'

    if extension[1] == ".json":
      return 'application/json'

    if extension[1] == '.png':
      return 'image/png'

    if extension[1] == '.jpg':
      return 'image/jpg'

    return 'application/octet-stream'

  def resolve_filename(self, filename):

    if filename == "/":
      filename = "/app.html"

    # Make the path absolute.
    filename = os.path.abspath(self.__base + filename)

    # And ensure it is below the base.
    if not filename.startswith(os.path.abspath(self.__base)):
      return None

    if not os.path.isfile(filename):
      return None

    return filename

  def can_handle_request(self, request):
    if request.method != "GET":
      return False

    if self.resolve_filename(request.url) is None:
      return False

    return True

  def handle_request(self, context, request):

    filename = self.resolve_filename(request.url)

    if filename is None:
      raise HttpException(404, "File not found")

    with open(filename,encoding='utf-8') as f:
      response = HttpResponse()
      response.add_headers({
        'Content-Type': self.get_content_type(filename),
        'Connection': 'close'
      })
      response.send(context,f.read())



class WebSocketHandler:

  def can_handle_request(self, request):
    if request.method != "GET":
      return False

    if request.url != "/websocket":
      return False

    return True

  def handle_request(self, context, request):

    # Websocket is read
    with WebSocket(request, context) as webSocket:
      with SieveSocket("imap.1und1.com",4190) as sieveSocket:

        sieveSocket.start_tls()
        #sieveSocket.authenticate()

        # Publish capabilities to client...
        webSocket.send(sieveSocket.capabilities)

        MessagePump().run(webSocket, sieveSocket)


webServer = WebServer()
webServer.add_handler(FileHandler("D:\\projekte\\sieve\\core\\build\\web\\static"))
webServer.add_handler(WebSocketHandler())

webServer.listen()
