from argparse import ArgumentParser
from getpass import getpass

from .sievesocket import SieveSocket

parser = ArgumentParser(description='Tests the connection to a sieve server.')
parser.add_argument("host", help="The sieve server's hostname")
parser.add_argument("--port", help="The server's port", type=int, default=4190)
parser.add_argument("--username", help="The username to be used for authentication")
parser.add_argument("--password", help="The password to be used for authentication")

args = parser.parse_args()

if args.username is None:
  #args.username = getpass.getuser()
  args.username = input("Username: ")

if args.password is None:
  args.password = getpass()

with SieveSocket(args.host, args.port) as socket:
  print(socket.capabilities)
  socket.start_tls()

  socket.authenticate(args.username, args.password, "")

  socket.send(b"LISTSCRIPTS\r\n")
  print(socket.recv())
