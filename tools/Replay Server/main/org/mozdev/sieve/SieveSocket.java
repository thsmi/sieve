/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

package org.mozdev.sieve;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.Socket;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

  public class SieveSocket
  {
    protected Socket socket = null;
    protected BufferedReader in = null;
    protected PrintWriter out = null;
    protected SSLContext sslContext = null;
    
    public SieveSocket(Socket socket, SSLContext sslContext) throws Exception
    {
      this.sslContext = sslContext;
      this.setSocket(socket);
    }
    
    protected void setSocket(Socket socket) throws Exception
    {
      this.socket = socket;
      this.in = new BufferedReader(new InputStreamReader(this.socket.getInputStream()));
      this.out = new PrintWriter(this.socket.getOutputStream(),true);      
    }

    public void startSSL() throws Exception
    {
      // ... and convert the socket into an ssl socket...
      InetSocketAddress remoteAddress =
        (InetSocketAddress) this.socket.getRemoteSocketAddress();

      SSLSocketFactory sf = this.sslContext.getSocketFactory();
      SSLSocket sock = (SSLSocket) (sf.createSocket(
        this.socket, remoteAddress.getHostName(), this.socket.getPort(), true));

      // we are a server
      sock.setUseClientMode(false);
      
     /* sock.setEnabledProtocols(StrongSsl.intersection(
          sock.getSupportedProtocols(), StrongSsl.ENABLED_PROTOCOLS));
      sock.setEnabledCipherSuites(StrongSsl.intersection(
          sock.getSupportedCipherSuites(), StrongSsl.ENABLED_CIPHER_SUITES));*/
      
      sock.setEnabledProtocols(sock.getSupportedProtocols());
      sock.setEnabledCipherSuites(sock.getSupportedCipherSuites());    

      sock.startHandshake();
      this.setSocket(sock);      
    }
     
    public void sendPacket(String msg, boolean flush)
    {
      this.out.print(msg);
      
      if (flush)
        this.out.flush();   
    }
    public void sendPacket(String msg)
    {
      this.sendPacket(msg,true);           
    }
    
    public String readLine() throws Exception
    {
      return this.in.readLine();
    }

    public void close() throws Exception
    {
      this.socket.close();
    }
  }