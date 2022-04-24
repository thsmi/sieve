import pathlib
import logging

from argparse import ArgumentParser

from script.webserver import WebServer

from script.handler.config import ConfigHandler
from script.handler.file import FileHandler
from script.handler.websocket import WebSocketHandler

from script.config.config import Config


parser = ArgumentParser(description='Starts the websocket to sieve proxy.')
parser.add_argument("--config", help="The configuration file if omitted it will fallback to ./config.ini")
parser.add_argument('--verbose', '-v', action='count', default=1)

args = parser.parse_args()

args.verbose = 40 - (10*args.verbose) if args.verbose > 0 else 0

logging.basicConfig(level=args.verbose, format='%(asctime)s %(levelname)s [%(funcName)s] %(filename)s : %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

logging.debug('im a DEBUG message')
logging.info('im a INFO message')
logging.warning('im a WARNING message')
logging.critical('im a CRITICAL message')
logging.error('im a ERROR message')

if args.config is None:
  args.config = "config.ini"

configfile = pathlib.Path(
  pathlib.Path(__file__).parent.absolute(),
  args.config)

if not configfile.exists():
  raise Exception(f"No such config file {configfile}")

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
