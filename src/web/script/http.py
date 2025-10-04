import logging
import select
import time

class HttpException(Exception):

  def __init__(self, code, reason):
    self.code = code
    self.reason = reason
    super().__init__(self.reason)


class HttpRequest:

  def __init__(self):
    self.__headers = {}
    self.__request = ["", "", ""]
    self.__payload = None

  @property
  def url(self) -> str:
    return self.__request[1]

  @property
  def path(self) -> str:
    return self.__request[1].split("?", 1)[0]

  @property
  def query(self) -> str:
    return self.__request[1].split("?", 1)[1]

  @property
  def method(self) -> str:
    return self.__request[0]

  def get_header(self, name):
    if name not in self.__headers:
      return None

    return self.__headers[name]

  def wait(self, context) -> None:

    while True:
      ready_to_read, _ready_to_write, in_error = select.select(
        [context.socket], [], [context.socket])

      if context.socket in in_error:
        raise Exception("Socket in error")

      if context.socket in ready_to_read:
        return



  def recv(self, context, blocking : bool = True) -> None:

    if blocking:
      self.wait(context)

    data = context.socket.recv(4096).decode()

    data = data.split("\r\n\r\n", 1)

    headers = data[0].split("\r\n")

    self.__request = headers.pop(0).split(" ")
    self.__headers = {}

    for header in headers:
      header = header.split(":", 1)
      value = header[1].lstrip()

      if value:
        self.__headers[header[0]] = value
      else:
        logging.warning(f"Received header {header[0]} is empty.")

    self.__payload = data[1]


class HttpResponse:

  def __init__(self):
    self.__code = 200
    self.__reason = "OK"

    self.__headers = {}


  def add_headers(self, headers):
    for key, value in headers.items():
      self.__headers[key] = value

    return self

  def set_status(self, code, reason):
    self.__code = code
    self.__reason = reason


  def send(self, context, data : bytes = None):

    time_now = time.strftime("%a, %d %b %Y %H:%M:%S", time.localtime())

    response = ""
    response += 'HTTP/1.1 '+str(self.__code)+' '+self.__reason+'\r\n'
    response += 'Date: {now}\r\n'.format(now=time_now)
    response += 'Server: Sieve Editor\r\n'

    for key, value in self.__headers.items():
      response += key+": "+value+"\r\n"

    response += "\r\n"
    response = response.encode()

    if data is not None:

      if type(data) == str :
        data = data.encode()

      response += data

    context.socket.send(response)
