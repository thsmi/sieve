from .parser import Parser

class Response:

  def __init__(self):
    self.__status = None

  def decode(self, data):

    parser = Parser(data)

    self.__status = parser.extract([b"OK", b"NO", b"BYE"])

    if parser.is_space():
      parser.extract_space()
      parser.extract(b"(")

      while not parser.startswith(")"):
        parser.extract_space()
        parser.extract_string()

    if parser.is_space():
      parser.extract_space()
      parser.extract_string()

    parser.extract_line_break()

class Capabilities(Response):

  def __init__(self):
    super().__init__()
    self._capabilities = {}

  def get_capabilities(self):
    return self._capabilities

  def decode(self, data):

    parser = Parser(data)

    self._capabilities = {}

    while parser.is_string():
      key = parser.extract_string()

      value = ""
      if not parser.is_line_break():
        parser.extract_space()
        value = parser.extract_string()

      parser.extract_line_break()

      self._capabilities[key.upper()] = value

    if b'"IMPLEMENTATION"' not in self._capabilities:
      raise Exception("Implementation expected")

    super().decode(parser.get_data())

  def encode(self):

    result = b""

    for key, value in self._capabilities.items():

      # We do not support starttls as the websocket is always secure.
      if key == b'"STARTTLS"':
        continue

      # And as we are authenticated no need for any sasl mechanism.
      if key == b'"SASL"':
        result += b'"SASL" ""\r\n'
        continue

      result += key
      if len(value):
        result += b" "+value

      result += b"\r\n"

    result += b"OK\r\n"

    return result
