from . parser import Parser

class Response:

  def __init__(self):
    self.__status = None

  def decode(self, data) -> 'Response':

    parser = Parser(data)

    self.__status = parser.extract([b"OK", b"NO", b"BYE"])

    if parser.is_line_break():
      parser.extract_line_break()
      return self

    parser.extract_space()
    if parser.startswith(b"("):

      parser.extract(b"(")

      while not parser.startswith(b")"):
        parser.extract_space()
        parser.extract_string()

      if parser.is_line_break():
        parser.extract_line_break()
        return self

      parser.extract_space()

    parser.extract_string()
    parser.extract_line_break()

    return self

  @property
  def status(self) -> str:
    return self.__status.decode()

class Capabilities(Response):

  def __init__(self):
    super().__init__()
    self._capabilities = {}
    self.__can_authenticate = True

  def get_capabilities(self):
    return self._capabilities

  def disable_authentication(self):
    self.__can_authenticate = False

  def decode(self, data) -> 'Response':

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
      raise Exception("IMPLEMENTATION expected")

    super().decode(parser.get_data())

    return self

  def encode(self) -> bytes:

    result = b""

    for key, value in self._capabilities.items():

      # We do not support starttls as the websocket is always secure.
      if key == b'"STARTTLS"':
        continue

      # Clear the sasl mechanism in case we are already authenticated
      # or return PLAIN in case we are not authenticated.
      if key == b'"SASL"':
        if not self.__can_authenticate:
          result += b'"SASL" ""\r\n'
        else:
          result += b'"SASL" "PLAIN"\r\n'

        continue

      result += key
      if len(value):
        result += b" "+value

      result += b"\r\n"

    result += b"OK\r\n"

    return result
