import select

class MessagePump:


  def wait(self, server, client):

    ready_to_read, ready_to_write, in_error \
      = select.select([server, client], [], [server, client])

    if server in in_error:
      raise Exception("Reading server connection failed")

    if client in in_error:
      raise Exception("Reading client connection failed")

    return ready_to_read

  def run(self, server, client):

    while True:
      sockets = self.wait(server, client)

      if server in sockets:
        data = server.recv()

        if data == b'':
          print("Server terminated")
          return

        print(data)
        client.send(data)

      if client in sockets:
        data = client.recv()

        if data == b'':
          print(" Client terminated")
          return

        print(data)
        server.send(data)
