class Parser:

  def __init__(self, data):
    self.__data = data

  def is_line_break(self) -> bool:
    return self.__data.startswith(b'\r\n')

  def extract_line_break(self) -> None:
    if not self.is_line_break():
      raise Exception("No Linebreak found")

    self.__data = self.__data[2:]

  def is_space(self) -> bool:
    return self.__data.startswith(b' ')

  def extract_space(self) -> None:
    if not self.is_space():
      raise Exception("No Space found")

    self.__data = self.__data[1:]

  def is_string(self) -> bool:
    return self.__data.startswith(b'"')

  def startswith(self, token: str) -> bool:
    return self.__data.startswith(token)

  def extract(self, token) -> str:
    for item in token:
      if not self.__data.startswith(item):
        continue

      result = self.__data[:len(item)]
      self.__data = self.__data[len(item):]
      return result

    raise Exception("Failed to extract token")

  def extract_string(self) -> str:

    if not self.is_string():
      raise Exception("Expected Quote")

    pos = 1

    while True:
      pos = self.__data.find(b'"', pos)

      if pos == -1:
        raise Exception("Expected Quote")

      pos += 1

      # Handle Escape Characters
      if self.__data[pos-2] != b"\\":
        break

      cnt = 0
      for char in self.__data[pos-2:1:-1]:
        if char != b"\\":
          break

        cnt += 1

      # Odd number of backslashes the quote is not escaped
      if (cnt % 2) != 0:
        break

    result = self.__data[:pos]
    self.__data = self.__data[pos:]

    return result

  def get_data(self):
    return self.__data
