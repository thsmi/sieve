import logging
import threading
from queue import SimpleQueue
from select import select
from socket import socketpair

from websockets.exceptions import ConnectionClosed
from websockets.sync.server import Server

from script.sieve.sievesocket import SieveSocket
from .websocket import PreHandshakedConnection


class MessagePump:
  def __init__(self, sieve_socket: SieveSocket):
    self._sieve_socket: SieveSocket = sieve_socket
    self._websocket_server: Server | None = None

    # The "websockets" implementation exclusively owns the given socket and
    # immediately receives the content that arrives to it. select() only
    # sporadically works on it. Therefore, we need to drain it continuously into
    # a separate queue in a background thread, and notify select() (via _wake_r
    # socket) that a new piece of data is available for reading.
    #
    # Wakeup socketpair: _websocket_reader writes to _wake_w,
    # select() watches _wake_r alongside the Sieve socket.
    self._wake_r, self._wake_w = socketpair()
    self._websocket_data_queue: SimpleQueue = SimpleQueue()

  @property
  def websocket_server(self) -> Server:
    return self._websocket_server

  @websocket_server.setter
  def websocket_server(self, value: Server):
    self._websocket_server = value

  def _websocket_reader(self, websocket_conn: PreHandshakedConnection) -> None:
    """Background thread: drains the internal queue of "websockets" and signals
    select() via the wakeup socket."""
    try:
      while True:
        data = websocket_conn.recv(timeout=10, decode=False)  # blocks on internal Assembler queue
        self._websocket_data_queue.put(data)
        self._wake_w.send(b'\x00')  # wake up select()
    except ConnectionClosed as e:
      logging.info(f"Websocket terminated with code {e.rcvd.code} and reason '{e.rcvd.reason}'")
      self._websocket_data_queue.put(None)  # sentinel - signals shutdown
    except TimeoutError as e:
      logging.error(f"Websocket handler didn't receive all parts of the message in time. Exiting'")
      self._websocket_data_queue.put(None)  # sentinel - signals shutdown
    finally:
      self._wake_w.send(b'\x00')  # wake up select()

  def _wait(self):
    if self._wake_r.fileno() < 0 or self._sieve_socket.fileno() < 0:
      raise RuntimeError("Websockets are not valid for waiting for them")

    descriptors = [self._wake_r, self._sieve_socket]
    ready_to_read, _, in_error = select(descriptors, [], descriptors)

    if self._wake_r in in_error:
      raise RuntimeError("Reading wake-up websocket connection failed")

    if self._sieve_socket in in_error:
      raise RuntimeError("Reading Sieve socket connection failed")

    return ready_to_read

  def run(self, websocket_conn: PreHandshakedConnection) -> None:
    logging.debug("Publishing capabilities to web client")
    websocket_conn.send(self._sieve_socket.capabilities.decode(), text=True)

    reader_thread = threading.Thread(
      target=self._websocket_reader, args=(websocket_conn,), daemon=True
    )
    reader_thread.start()

    while True:
      try:
        sockets = self._wait()
      except RuntimeError as e:
        logging.error(f"Could not wait for sockets. Error: {e}")
        websocket_conn.close()
        return

      if self._wake_r in sockets:
        self._wake_r.recv(1)  # drain one wakeup byte
        data = self._websocket_data_queue.get_nowait()  # always has a message, reading out one
        if data is None:  # ConnectionClosed sentinel
          websocket_conn.close()
          return

        logging.debug(f"Sending data to Sieve: {data.decode()}")
        self._sieve_socket.send(data)

      if self._sieve_socket in sockets:
        data = self._sieve_socket.recv()

        if data == b'':
          logging.info("Sieve socket terminated")
          websocket_conn.close()
          return

        logging.debug(f"Sending data to Websocket")
        try:
          websocket_conn.send(data.decode(), text=True)
        except ConnectionClosed as e:
          logging.info(f"Websocket terminated with code {e.rcvd.code} and reason '{e.rcvd.reason}'")
          websocket_conn.close()
          return
