from hashlib import sha1
from base64 import b64encode

from .http import HttpException, HttpResponse


class SocketMock:

  def __init__(self, data):
    self.__data = data

  @property
  def data(self):
    return self.__data

  def recv(self, length):
    result = self.__data[:length]
    del self.__data[:length]

    return result

  def send(self, payload):
    for data in payload:
      self.__data.append(data)

class ContextMock:

  def __init__(self, data):
    self.__socket = SocketMock(data)

  @property
  def socket(self):
    return self.__socket

class WebSocket:

  def __init__(self, request, context):
    self.__context = context
    # we cache the initial request so that we have access to the headers.
    self.__request = request

  @property
  def request(self):
    return self.__request

  def fileno(self):
    return self.__context.socket.fileno()


  def __enter__(self):
    if self.request.get_header("Upgrade") != "websocket":
      raise HttpException(400, "Upgrade header expected")

    key = self.request.get_header("Sec-WebSocket-Key")

    if key is None:
      raise HttpException(400, "Upgrade header expected")

    message = sha1()
    message.update(key.encode())
    message.update(b"258EAFA5-E914-47DA-95CA-C5AB0DC85B11")

    accept = b64encode(message.digest()).decode()

    response = HttpResponse()
    response.set_status(101, "Switching Protocols")
    response.add_headers(headers={
      "Upgrade": "websocket",
      "Connection": "Upgrade",
      "Sec-WebSocket-Accept": accept
    })
    response.send(self.__context)

    return self

  def __exit__(self, exc_type, exc_val, exc_tb):
    print("On Exit")
    #TODO send a websocket disconnect message...
    #self.disconnect()

  def extract_masked_data(self, length):
    payload = bytearray()

    mask = self.__context.socket.recv(4)
    payload += self.__context.socket.recv(length)

    for i in enumerate(payload):
      payload[i] = mask[i % 4] ^ payload[i]

    return payload

  def handle_pong(self, data):
    raise Exception("Implement me")

  def extract_length(self, data):
    length = data[1] & 0b01111111

    if length == 126:
      data = self.__context.socket.recv(2)
      return (data[0] << (1*8)) + (data[1] << (0*8))


    if length == 127:
      data = self.__context.socket.recv(8)
      return (data[0] << (7*8)) + (data[1] << (6*8)) + (data[2] << (5*8)) + (data[3] << (4*8)) \
        + (data[4] << (3*8)) + (data[5] << (2*8)) + (data[6] << (1*8)) + (data[7] << (0*8))

    return length

  def recv(self):

    fin = False
    payload = bytearray()

    while not fin:
      data = self.__context.socket.recv(2)

      opcode = data[0] & 0b00001111
      fin = bool(data[0] & 0b10000000)
      length = self.extract_length(data)

      if opcode == 8:
        if not length:
          raise Exception("Connection gracefully closed.")

        message = self.extract_masked_data(length)

        code = (message[0] << (1*8)) + (message[1] << (0*8))

        text = message[2:]

        print(str(code) + " - " + text.decode())
        raise Exception("Connection gracefully closed. "+str(code)+" "+text.decode())



      if opcode == 10:
        self.handle_pong(data)
        continue

      if (opcode == 0) or (opcode == 1) or (opcode == 2):

        if not bool(data[1] & 0b10000000):
          raise Exception("Client to server messages have to be masked.")

        payload += self.extract_masked_data(length)

        if fin:
          break

    return payload

  def send(self, payload):

    data = bytearray()
    data.append(0b10000001)

    length = len(payload)
    #FIXME the length is in Network byte order and needs to be converted to host byte order

    if length < 126:
      data.append(length & 0b01111111)
    elif length <= 0xFFFF:
      data.append(126)
      data.append((length >> (1*8)) & 0xFF)
      data.append((length >> (0*8)) & 0xFF)
    elif length <= 0xFFFFFFFFFFFFFFFF:
      data.append(127)
      data.append((length >> (7*8)) & 0xFF)
      data.append((length >> (6*8)) & 0xFF)
      data.append((length >> (5*8)) & 0xFF)
      data.append((length >> (4*8)) & 0xFF)
      data.append((length >> (3*8)) & 0xFF)
      data.append((length >> (2*8)) & 0xFF)
      data.append((length >> (1*8)) & 0xFF)
      data.append((length >> (0*8)) & 0xFF)

    if isinstance(payload, (bytes, bytearray)):
      data.extend(payload)
    else:
      data.extend(payload.encode())

    self.__context.socket.send(data)


#ws = WebSocket(None, ContextMock(bytearray([0x81,0x05,0x48,0x65,0x6c,0x6c,0x6f])))
#ws.recv() == "Hello"


#data2.append(0x81)
#data2.append(0x85)
#data2.append(0x37)
#data2.append(0xfa)
#data2.append(0x21)
#data2.append(0x3d)
#data2.append(0x7f)
#data2.append(0x9f)
#data2.append(0x4d)
#data2.append(0x51)
#data2.append(0x58)

#ws = WebSocket(None, ContextMock(bytearray()))
#ws.send("Hello")

#data = ""
#for i in range(256):
#  data += "A"

#ws = WebSocket(None, ContextMock(bytearray()))
#ws.send(data)
