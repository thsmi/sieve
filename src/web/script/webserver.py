import ssl
import socket

from concurrent.futures import ThreadPoolExecutor

from .http import HttpRequest, HttpException, HttpResponse

class HttpContext:

  def __init__(self, sock, handlers):
    self.__socket = sock
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
    self.__executor = None

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

      print("404 File not found "+request.url)
      raise HttpException(404, "File not found "+request.url)

    except HttpException as ex:
      response = HttpResponse()
      response.set_status(ex.code, ex.reason)
      response.add_headers({'Connection': 'close'})
      response.send(context)

    except Exception as ex:
      print(ex)
    finally:
      context.socket.shutdown(socket.SHUT_RDWR)
      context.socket.close()

  def listen(self):

    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain("d:\\python.cert", "d:\\python.key")

    self.__executor = ThreadPoolExecutor(max_workers=3)

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
      sock.bind((self.__hostname, self.__port))
      sock.listen(5)

      print("Listening on https://"+self.__hostname+":"+str(self.__port))

      while True:
        # accept connections from outside
        clientsocket, address = sock.accept()


        connstream = ssl_context.wrap_socket(
          clientsocket,
          server_side=True,
          do_handshake_on_connect=False)

        try:
          connstream.do_handshake()
        except ConnectionAbortedError:
          continue
        except OSError:
          continue
        except ssl.SSLError as err:
          if err.args[1].find("sslv3 alert") == -1:
            raise

        self.__executor.submit(
          self.handle_message,
          HttpContext(connstream, self.__handlers))
