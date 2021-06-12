import pathlib

from script.webserver import WebServer

from script.handler.config import ConfigHandler
from script.handler.file import FileHandler
from script.handler.websocket import WebSocketHandler

from script.config.config import Config

from argparse import ArgumentParser

parser = ArgumentParser(description='Starts the websocket to sieve proxy.')
parser.add_argument("--config", help="The configuration file if omitted it will fallback to ./config.ini")

args = parser.parse_args()

if args.config is None:
  args.config = "config.ini"

configfile = pathlib.Path(
  pathlib.Path(__file__).parent.absolute(),
  args.config)

if not configfile.exists():
  raise Exception("No such config file "+ configfile)

print(f"Loading config from {configfile}")
config = Config().load(configfile)

webServer = WebServer(
  address = config.get_address(),
  port = config.get_port(),
  keyfile = config.get_keyfile(),
  certfile = config.get_certfile())

webServer.add_handler(ConfigHandler(config))


webServer.add_handler(FileHandler(str(config.get_http_root())))

webServer.add_handler(WebSocketHandler(config))

webServer.listen()
