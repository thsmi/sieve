import pathlib

from script.webserver import WebServer

from script.handler.config import ConfigHandler
from script.handler.file import FileHandler
from script.handler.websocket import WebSocketHandler

from script.config.config import Config

configfile = pathlib.Path(
  pathlib.Path(__file__).parent.absolute(),
  "config.ini")

if not configfile.exists():
  raise Exception("No such config file "+ configfile)

config = Config().load(configfile)

webServer = WebServer(
  keyfile = config.get_keyfile(), certfile = config.get_certfile())

webServer.add_handler(ConfigHandler(config))
webServer.add_handler(FileHandler("D:\\projekte\\sieve\\core\\build\\web\\static"))

webServer.add_handler(WebSocketHandler(config))

webServer.listen()
