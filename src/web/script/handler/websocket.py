import logging

from ..websocket import WebSocket
from ..sieve.sievesocket import SieveSocket
from ..messagepump import MessagePump
from ..webserver import HttpContext, HttpRequest

class WebSocketHandler:

  def __init__(self, config):
    self.__config = config

  def can_handle_request(self, request: HttpRequest) -> bool:
    if request.method != "GET":
      return False

    if not request.path.startswith("/websocket/"):
      return False

    return True

  def handle_request(self, context: HttpContext, request: HttpRequest) -> None:

    logging.info(f"Websocket Request for {request.path}")

    account = self.__config.get_account_by_id(
      request.path[len("/websocket/"):])

    host = account.get_sieve_host()
    port = int(account.get_sieve_port())

    logging.debug(f'Communicating with "{host}:{port}" with auth username "{account.get_auth_username(request)}"')

    # Websocket is read
    with WebSocket(request, context) as websocket, SieveSocket(host, port) as sievesocket:
      sievesocket.start_tls()

      if not account.can_authenticate():
        logging.info(f"Do Proxy authentication for {account.get_name()}")
        sievesocket.authenticate(
          account.get_sieve_user(request),
          account.get_sieve_password(request),
          account.get_auth_username(request))

      # Publish capabilities to client...
      logging.debug(f'Publishing capabilities to web client: "{sievesocket.capabilities.decode()}"')
      websocket.send(sievesocket.capabilities)

      MessagePump(websocket, sievesocket).run()
