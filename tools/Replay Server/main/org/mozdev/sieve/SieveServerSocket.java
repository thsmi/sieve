/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

package org.mozdev.sieve;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.ServerSocket;
import java.security.KeyStore;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;



public class SieveServerSocket
{
  final static char[] keyStorePassphrase = "secret".toCharArray();
  final static char[] trustStorePassphrase = "secret".toCharArray();
  
  protected ServerSocket server = null; 
  protected SSLContext sslContext = null;
  
  //protected boolean tls = true;
  
  public SieveServerSocket(int port, boolean tls) throws Exception
  {
    //this.tls = tls;
    
    if (tls)
    {
      //http://blog.jteam.nl/2009/11/10/securing-connections-with-tls/
      // Preload the cert stuff...

      // Key store for your own private key and signing certificates.
      InputStream keyStoreIS = new FileInputStream("d:\\keystore.p12");

      KeyStore ksKeys = KeyStore.getInstance("PKCS12");
      ksKeys.load(keyStoreIS, keyStorePassphrase);

      // KeyManager decides which key material to use.
      KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
      kmf.init(ksKeys, keyStorePassphrase);

      // Trust store contains certificates of trusted certificate authorities.
      // We'll need this to do client authentication.
      InputStream trustStoreIS = new FileInputStream("d:\\truststore.jks");

      KeyStore ksTrust = KeyStore.getInstance("JKS");
      ksTrust.load(trustStoreIS, trustStorePassphrase);

      // TrustManager decides which certificate authorities to use.
      TrustManagerFactory tmf = TrustManagerFactory.getInstance("SunX509");
      tmf.init(ksTrust);

      this.sslContext = SSLContext.getInstance("TLS");
      this.sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);
    }
    // create the server...
    this.server =  new ServerSocket(port);
  }
  
  public SieveSocket accept() throws Exception
  {
    return new SieveSocket(server.accept(), this.sslContext);    
  }

}
