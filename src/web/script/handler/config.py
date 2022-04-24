import json
import logging

from ..http import HttpResponse

class ConfigHandler:

  def __init__(self, config):
    self.__config = config

  def can_handle_request(self, request) -> bool:
    if request.method != "GET":
      return False

    if request.path != "/config.json":
      return False

    return True

  def handle_request(self, context, request) -> None:

    data = {}

    for account in self.__config.get_accounts():

      try:

        data[account.get_id()] = {
          'displayname' : account.get_name(),
          'username' : account.get_auth_username(request),
          'authenticate' : account.can_authenticate(),
          'authorize' : account.can_authorize(),
          'endpoint' : f"websocket/{account.get_id()}"
        }

      except Exception as ex:
        logging.warning(f"Skipping invalid account configuration {account.get_name()}, cause {ex}")

    # if config from request
    # Reverse proxy default header
    #username = request.get_header("REMOTE_USER")
    # else
    # username = config.read()
    # hostname = config.read()

    # config.read("authentication")
    # config.port

    # for account ins config:

    response = HttpResponse()
    response.add_headers({
      'Content-Type': "application/json",
      'Connection': 'close'
    })
    response.send(context, json.dumps(data))
