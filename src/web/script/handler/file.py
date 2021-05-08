import os

from ..http import HttpException, HttpResponse

class FileHandler:

  def __init__(self, base : str):
    self.__base = base

  def get_content_type(self, filename : str) -> str:

    extension = os.path.splitext(self.__base+filename)

    if extension[1] == ".html":
      return 'text/html'

    if extension[1] == ".js":
      return 'text/javascript'

    if extension[1] == ".mjs":
      return 'text/javascript'

    if extension[1] == ".cjs":
      return 'text/javascript'

    if extension[1] == ".css":
      return 'text/css'

    if extension[1] == ".json":
      return 'application/json'

    if extension[1] == '.png':
      return 'image/png'

    if extension[1] == '.jpg':
      return 'image/jpg'

    return 'application/octet-stream'

  def resolve_filename(self, filename : str) -> str:

    if filename == "/":
      filename = "/app.html"

    # Make the path absolute.
    filename = os.path.abspath(self.__base + filename)

    # And ensure it is below the base.
    if not filename.startswith(os.path.abspath(self.__base)):
      return None

    if not os.path.isfile(filename):
      return None

    return filename

  def can_handle_request(self, request) -> bool:
    if request.method != "GET":
      return False

    if self.resolve_filename(request.path) is None:
      return False

    return True

  def handle_request(self, context, request) -> None:

    filename = self.resolve_filename(request.path)

    if filename is None:
      raise HttpException(404, "File not found")

    # Check if binary or not...
    with open(filename, "rb") as file:
      response = HttpResponse()
      response.add_headers({
        'Content-Type': self.get_content_type(filename),
        'Connection': 'close'
      })
      response.send(context, file.read())
