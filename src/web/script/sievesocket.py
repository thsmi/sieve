import ssl
import socket
import select

from base64 import b64encode

class Parser:

  def __init__(self, data):
    self.__data = data

  def isLineBreak(self):
    return self.__data.startswith(b'\r\n')

  def extractLineBreak(self):
    if not self.isLineBreak():
      raise Exception("No Linebreak found")

    self.__data = self.__data[2:]

  def isSpace(self):
    return self.__data.startswith(b' ')

  def extractSpace(self):
    if not self.isSpace():
      raise Exception("No Space found")

    self.__data = self.__data[1:]

  def isString(self):
    return self.__data.startswith(b'"')

  def startsWith(self, token):
    return self.__data.startsWith(token)

  def extract(self, token):
    for item in token:
      if not self.__data.startswith(item):
        continue

      result = self.__data[:len(item)]
      self.__data = self.__data[len(item):]
      return result

    raise Exception("Failed to extract token")

  def extractString(self):

    if not self.isString():
       raise Exception("Expected Quote")

    pos = 1

    while True:
      pos = self.__data.find(b'"', pos)

      if pos == -1:
        raise Exception("Expected Quote")

      pos += 1

      # Handle Escape Characters
      if (self.__data[pos-2] != b"\\"):
        break

      cnt = 0
      for c in self.__data[pos-2:1:-1]:
        if c != b"\\" :
          break

        cnt += 1

      # Odd number of backslashes the quote is not escaped
      if (cnt % 2) != 0:
        break

    result = self.__data[:pos]
    self.__data = self.__data[pos:]

    return result

  def getData(self):
    return self.__data


class Response:

  def decode(self, data) :

    parser = Parser(data)

    self.__requestStatus = parser.extract([b"OK", b"NO", b"BYE"])

    if parser.isSpace() :
      parser.extractSpace()
      parser.extract(b"(")

      while not parser.startsWith(")"):
        parser.extractSpace()
        parser.extractString()

    if (parser.isSpace()) :
      parser.extractSpace()
      parser.extractString()

    parser.extractLineBreak()

class Capabilities(Response):

  def __init__(self):
    self._capabilities = {}

  def decode(self, data):

    parser = Parser(data)

    self._capabilities = {}

    while parser.isString():
      key = parser.extractString()

      value = ""
      if not parser.isLineBreak():
        parser.extractSpace()
        value = parser.extractString()

      parser.extractLineBreak()

      self._capabilities[key.upper()] = value

    if b'"IMPLEMENTATION"' not in self._capabilities:
      raise Exception("Implementation expected")

    super().decode(parser.getData())

  def encode(self):

    result = b""

    for key, value in self._capabilities.items():

      # We do not support starttls as the websocket is always secure.
      if key is b'"STARTTLS"':
        continue

      # And as we are authenticated no need for any sasl mechanism.
      if key is b'"SASL"':
        result += b'"SASL" ""\r\n'
        continue

      result += key
      if len(value):
        result+=b" "+value

      result += b"\r\n"

    result += b"OK\r\n"

    return result


class SieveSocket:

  def __init__(self, hostname, port):
    self.__socket = None
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

    if b'"SASL"' not in capabilities._capabilities:
      raise Exception("Sasl Plain not supported")

    if b'PLAIN' not in capabilities._capabilities[b'"SASL"'][1:-1].split(b" "):
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
    self.__oldSocket = None

  def upgrade(self):
    #self.__oldSocket =  self.__socket
    self.__socket = ssl.wrap_socket(self.__socket)

  def wait(self):
    while True:
      ready_to_read, ready_to_write, in_error = select.select(
        [self.__socket],[],[self.__socket])

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
      if b'"STARTTLS"' not in self.__capabilities._capabilities:
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

