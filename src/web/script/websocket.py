import logging
import traceback
from socket import socket as socket_module
from typing import Callable

from websockets.http11 import Request as WsRequest
from websockets.protocol import SEND_EOF
from websockets.sync.server import ServerProtocol, ServerConnection

from .webserver import HttpContext, HttpRequest


class PreHandshakedConnection(ServerConnection):
  """
  ServerConnection subclass that replaces the socket-reading handshake
  with one driven by an already-parsed HttpRequest.
  """

  def handshake_from_http_request(self, http_request: HttpRequest) -> None:
    """
    Perform the WS opening handshake using pre-parsed HttpRequest data.
    """
    self.protocol.receive_data(http_request.original_payload)

    request = next(
      (e for e in self.protocol.events_received() if isinstance(e, WsRequest)),
      None,
    )
    if request is None:
      raise ValueError(
        "Could not reconstruct a WebSocket Request from the given HttpRequest"
      )

    response = self.protocol.accept(request)
    self.protocol.send_response(response)

    # Write the 101 Switching Protocols response to the real socket
    for chunk in self.protocol.data_to_send():
      if chunk is not SEND_EOF:
        self.socket.sendall(chunk)
      else:
        self.socket.shutdown(socket_module.SHUT_WR)

    if self.protocol.handshake_exc:
      raise self.protocol.handshake_exc

    # Mirror the attributes that ServerConnection.handshake() would set,
    # so that code inspecting ws.request and ws.response works properly
    self.request = request
    self.response = response


class WebSocket:
  def __init__(self, handler: Callable[[PreHandshakedConnection], None], context: HttpContext, request: HttpRequest):
    self._handler = handler
    self._context = context
    self._request = request
    self._ws: PreHandshakedConnection | None = None

  def __enter__(self):
    self._create_connection()
    return self

  def __exit__(self, exc_type, exc_val, exc_tb) -> None:
    self._ws.close()  # No-op if it's already closed

  def _create_connection(self, *, close_timeout=10) -> None:
    """
    Perform the WebSocket opening handshake on an already accepted TCP socket
    and call the handler function.
    """
    self._ws = PreHandshakedConnection(
      self._context.socket,
      ServerProtocol(),
      close_timeout=close_timeout,
    )

    try:
      self._ws.handshake_from_http_request(self._request)
      logging.debug(f"Websocket has been initialised on socket nr. {self._context.socket.fileno()}")
      self._handler(self._ws)
    except Exception as exc:
      logging.error(f"Websocket connection error: {exc}\n{traceback.format_exc()}")
      self._ws.close()
