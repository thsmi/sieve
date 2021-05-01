import ssl
import socket
import select

from base64 import b64encode

from .sieve.request import Capabilities


class SieveSocket:

  def __init__(self, hostname, port):
    self.__socket = None
    self.__old_socket = None
    self.__capabilities = None

    self.__hostname = hostname
    self.__port = port

  def __enter__(self):
    print("On Enter")
    self.connect()
    return self

  def __exit__(self, exc_type, exc_val, exc_tb):
    print("On Exit")
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

  def __del__(self):
    self.disconnect()

  def fileno(self):
    return self.__socket.fileno()

  def disconnect(self):
    if self.__socket:
      self.__socket.close()

    self.__socket = None
    self.__old_socket = None

  def upgrade(self):
    #self.__oldSocket =  self.__socket

    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)

    self.__socket = ssl_context.wrap_socket(
      self.__oldSocket,
      server_hostname=self.__hostname,
      do_handshake_on_connect=False,
      suppress_ragged_eofs=True)

    self.__socket.do_handshake()

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

  def send(self, data):
    self.__socket.send(data)

  def start_tls(self):
    if b'"STARTTLS"' not in self.__capabilities.get_capabilities():
      raise Exception("Starttls not supported")

    self.send(b"STARTTLS\r\n")

    # TODO we should ensure that we got an ok
    print(self.recv())
    self.upgrade()

    #update the capabilities
    self.__capabilities.decode(self.recv())


  def authenticate(self, authentication, password, authorization):

    self.send(
      b'AUTHENTICATE "PLAIN" "'+b64encode(authorization+b"\0"+authentication+b"\0"+password)+b'"\r\n')

    ## TODO parse response...
    print(self.recv())

  @property
  def capabilities(self):
    return self.__capabilities.encode()
