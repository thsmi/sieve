import ssl
import socket
import select
import logging

from base64 import b64encode

from . request import Capabilities, Response


class SieveSocket:

  def __init__(self, hostname : str, port : int):
    self.__socket = None
    self.__old_socket = None
    self.__capabilities = None

    self.__hostname = hostname
    self.__port = port
    self.__timeout = 3.0

  def __enter__(self):
    self.connect()
    return self

  def __exit__(self, exc_type, exc_val, exc_tb) -> None:
    logging.debug(exc_type)
    logging.debug(exc_val)
    logging.debug(exc_tb)
    self.disconnect()

  def connect(self):
    self.__socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    self.__socket.settimeout(self.__timeout)
    self.__socket.connect((self.__hostname, self.__port))

    capabilities = Capabilities()
    capabilities.decode(self.recv())
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
    self.__socket.settimeout(self.__timeout)

  def wait(self):
    while True:
      ready_to_read, _ready_to_write, in_error = select.select(
        [self.__socket], [], [self.__socket])

      if self.__socket in in_error:
        raise Exception("Socket in error")

      if self.__socket in ready_to_read:
        return

  def recv(self):
    chunk = self.__socket.recv(1024*1024)

    if chunk == "":
      raise Exception("Connection terminated")

    return chunk

  def send(self, data: bytes) -> None:
    self.__socket.send(data)

  def start_tls(self) -> None:
    logging.debug("Securing connection with STARTTLS")

    if b'"STARTTLS"' not in self.__capabilities.get_capabilities():
      raise Exception("STARTTLS is not supported")

    self.send(b"STARTTLS\r\n")

    if Response().decode(self.recv()).status != "OK" :
      raise Exception("Starting TLS failed")

    self.upgrade()

    # update the capabilities
    self.__capabilities.decode(self.recv())

    # Check SASL capabilities here.
    # Some implementations don't allow SASL auth without using a secure connection (i.e. before STARTTLS).
    # In those cases, without TLS, the SASL support list is empty.
    if b'"SASL"' not in self.__capabilities.get_capabilities():
      raise Exception("SASL is not supported")

    if b'PLAIN' not in self.__capabilities.get_capabilities()[b'"SASL"'][1:-1].split(b" "):
      raise Exception("SASL PLAIN is not supported")

  def authenticate(self, authentication: str, password: str, authorization:str ) -> None:

    self.__capabilities.disable_authentication()

    logging.debug(f'Going to authenticate with authorization "{authorization}" and authentication "{authentication}"')

    self.send(
      b'AUTHENTICATE "PLAIN" "'+b64encode(
        authorization.encode()+b"\0"
        + authentication.encode()+b"\0"
        + password.encode())+b'"\r\n')

    response = self.recv()
    logging.debug(f'Auth response: "{response.decode().strip()}"')

    if Response().decode(response).status != "OK" :
      raise Exception("Authentication failed")

  @property
  def capabilities(self):
    return self.__capabilities.encode()
