import ssl
import socket
import traceback
import sys

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

  def __init__(self,
    port : int = 8765, address: str = None,
    keyfile : str = None, certfile : str = None):

    if keyfile is None:
      keyfile = "default.key"

    if certfile is None:
      certfile = "default.cert"

    if address is None:
      address = "127.0.0.1"

    self.__port = int(port)
    self.__address = address
    self.__handlers = []
    self.__executor = None

    self.__certfile = certfile
    self.__keyfile = keyfile

  def add_handler(self, handler):
    self.__handlers.append(handler)

  def get_handlers(self):
    return self.__handlers

  def handle_message(self, context) -> None:

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
      response = HttpResponse()
      response.set_status(500, "Internal Server Error")
      response.add_headers({'Connection': 'close'})

      exc_type, exc_value, exc_tb = sys.exc_info()
      response.send(context,"Internal Server error\r\n\r\n"
        + "\r\n".join(traceback.format_exception(exc_type, exc_value, exc_tb)))

      print(str(ex))
      print("".join(traceback.format_exception(exc_type, exc_value, exc_tb)))

    finally:
      context.socket.shutdown(socket.SHUT_RDWR)
      context.socket.close()

  def listen(self) -> None:
    """
    Starts listening for incoming requests
    """

    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(self.__certfile, self.__keyfile)

    self.__executor = ThreadPoolExecutor(max_workers=3)

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
      sock.bind((self.__address, self.__port))
      sock.listen(5)

      print("Listening on https://"+self.__address+":"+str(self.__port))

      while True:
        # accept connections from outside
        clientsocket, _address = sock.accept()


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
