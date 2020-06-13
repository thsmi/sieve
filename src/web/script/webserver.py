import ssl
import socket

from .websocket import WebSocket
from .http import HttpRequest, HttpException, HttpResponse
from concurrent.futures import ThreadPoolExecutor

class HttpContext:

  def __init__(self, socket, handlers):
    self.__socket = socket
    self.__handers = handlers

  @property
  def socket(self):
    return self.__socket

  @property
  def handlers(self):
    return self.__handers


class WebServer:

  def __init__(self, port=8765):
    self.__port = port
    self.__hostname = "127.0.0.1"
    self.__handlers = []

  def add_handler(self, handler):
    self.__handlers.append(handler)

  def get_handlers(self):
    return self.__handlers

  def handle_message(self, context):

    try:
      request = HttpRequest()
      request.recv(context)

      for handler in context.handlers:
        if not handler.can_handle_request(request):
          continue

        handler.handle_request(context, request)
        return

      raise HttpException(404, "File not found "+request.url)

    except HttpException as e:
      response = HttpResponse()
      response.set_status(e.code, e.reason)
      response.add_headers({'Connection': 'close'})
      response.send(context)

    except Exception as e:
      print(e)
    finally:
      context.socket.close()

  def listen(self):

    #sslContext = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)

    self.__executor = ThreadPoolExecutor(max_workers=3)

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
      sock.bind((self.__hostname, self.__port))
      sock.listen(5)

      while True:
          # accept connections from outside
          (clientsocket, address) = sock.accept()

          sslclientsocket = ssl.wrap_socket(clientsocket, server_side=True, certfile="d:\\python.cert",
               keyfile="d:\\python.key", cert_reqs=ssl.CERT_NONE,
                          do_handshake_on_connect=False, )

          try:
            sslclientsocket.do_handshake()
          except ssl.SSLError as err:
            if err.args[1].find("sslv3 alert") == -1:
              raise

          self.__executor.submit(
            self.handle_message,
            HttpContext(sslclientsocket, self.__handlers))