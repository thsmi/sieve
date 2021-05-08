import ssl
import socket
import select

from base64 import b64encode

from . request import Capabilities, Response


class SieveSocket:

  def __init__(self, hostname : str, port : int):
    self.__socket = None
    self.__old_socket = None
    self.__capabilities = None

    self.__hostname = hostname
    self.__port = port

  def __enter__(self):
    self.connect()
    return self

  def __exit__(self, exc_type, exc_val, exc_tb) -> None:
    print(exc_type)
    print(exc_val)
    print(exc_tb)
    self.disconnect()

  def connect(self):
    self.__socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    self.__socket.connect((self.__hostname, self.__port))

    capabilities = Capabilities()
    capabilities.decode(self.recv())

    if b'"SASL"' not in capabilities.get_capabilities():
      raise Exception("Sasl Plain not supported")

    if b'PLAIN' not in capabilities.get_capabilities()[b'"SASL"'][1:-1].split(b" "):
      raise Exception("Sasl Plain not supported")

    self.__capabilities = capabilities

  def __del__(self) -> None:
    self.disconnect()

  def fileno(self):
    return self.__socket.fileno()

  def disconnect(self) -> None:
    if self.__socket:
      self.__socket.close()

    self.__socket = None
    self.__old_socket = None

  def upgrade(self) -> None:
    self.__old_socket =  self.__socket

    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ssl_context.check_hostname = False
    #ssl_context.verify_mode = ssl.CERT_OPTIONAL
    ssl_context.load_default_certs()

    self.__socket = ssl_context.wrap_socket(self.__old_socket)

  def wait(self):
    while True:
      ready_to_read, ready_to_write, in_error = select.select(
        [self.__socket], [], [self.__socket])

      if self.__socket in in_error:
        raise Exception("Socket in error")

      if self.__socket in ready_to_read:
        return

  def recv(self):
    chunk = self.__socket.recv(1024*1024)

    if chunk == "":
      raise Exception("Connetion Terminated...")

    return chunk

  def send(self, data: str) -> None:
    self.__socket.send(data)

  def start_tls(self) -> None:
    if b'"STARTTLS"' not in self.__capabilities.get_capabilities():
      raise Exception("Starttls not supported")

    self.send(b"STARTTLS\r\n")

    if Response().decode(self.recv()).status != "OK" :
      raise Exception("Starting tls failed")

    self.upgrade()

    #update the capabilities
    self.__capabilities.decode(self.recv())


  def authenticate(self, authentication: str, password: str, authorization:str ) -> None:

    self.__capabilities.disable_authentication()

    self.send(
      b'AUTHENTICATE "PLAIN" "'+b64encode(
        authorization.encode()+b"\0"
        + authentication.encode()+b"\0"
        + password.encode())+b'"\r\n')

    if Response().decode(self.recv()).status != "OK" :
      raise Exception("Authentication failed")

  @property
  def capabilities(self):
    return self.__capabilities.encode()
