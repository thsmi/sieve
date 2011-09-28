import java.io.FileInputStream;
import java.io.InputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.security.KeyStore;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

// Use the following comands to create a keystore an a truststore.
//
// set path="c:\Program Files\Java\jre6\bin";%path%
//
// keytool -genkey -alias server -keyalg RSA -keystore keystore.jks
// keytool -export -alias server -keystore keystore.jks -rfc -file server.cer 
// keytool -import -alias ca -file server.cer -keystore truststore.jks -storepass secret
// keytool -importkeystore -srckeystore KEYSTORE.jks -destkeystore KEYSTORE.p12 -srcstoretype JKS -deststoretype PKCS12 -srcstorepass secret -deststorepass secret -srcalias server -destalias server -srckeypass secret -destkeypass secret -noprompt 
 
public class ReplayServer
{
  
  final static char[] keyStorePassphrase = "secret".toCharArray();
  final static char[] trustStorePassphrase = "secret".toCharArray();

  static final tests test = tests.LOGIN;
  
  static boolean cyrusBug = false;
  static boolean tls = true;
  
  static enum tests { FRAGMENTATION, REFERRAL, CRAMMD5, LOGIN }



	public static void main(String[] args) throws Exception
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
     
    SSLContext sslContext = SSLContext.getInstance("TLS");
    sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);
	  
    // create the server...
    ServerSocket server =  new ServerSocket(2000);
    Socket socket = server.accept();
    SieveSocket client = new SieveSocket(socket, sslContext);
	  
  	switch (test)
  	{
  	  case FRAGMENTATION:
  	    doFragmentationTest(client);
  	    break;
  	  case REFERRAL:
  	    doReferralTest(client);
  	    break;
  	  case CRAMMD5:
  	    doCramMd5Test(client);
  	    break;
  	  case LOGIN:
  	    doLoginTest(client);
  	    break;
  	}
	}

  private static void onInit(String sasl, SieveSocket sieve) throws Exception
  {
    sieve.sendPacket(
        "\"IMPLEMENTATION\" \"Replay Server\"\r\n"
        //+ "\"SASL\" \"DIGEST-MD5 CRAM-MD5 PLAIN\"\r\n"
        + "\"SASL\" \""+sasl+"\"\r\n"
        + "\"SIEVE\" \"fileinto reject envelope vacation imapflags notify subaddress relational comparator-i;ascii-numeric regex\"\r\n"
        + (tls ? "\"STARTTLS\"\r\n" : "")
        + "OK\r\n");
  }
  
  
  private static void onStartTLS(String sasl, SieveSocket sieve) throws Exception
	{
    assertTrue(sieve.readLine(),"STARTTLS");
    
    sieve.sendPacket("OK \"Begin TLS negotiation now.\"\r\n");
    
    sieve.startSSL();
    
    System.out.println("SSL STARTED...");
    if (!cyrusBug)
    {
      Thread.sleep(2000);
    
      sieve.sendPacket(
          "\"IMPLEMENTATION\" \"Replay Server\"\r\n" 
          + "\"SASL\" \""+sasl+"\"\r\n"
          + "\"SIEVE\" \"fileinto reject envelope vacation imapflags notify subaddress relational comparator-i;ascii-numeric regex\"\r\n"
          + "OK \"TLS negotiation successful.\"\r\n");
    }
    
    assertTrue(sieve.readLine(),"CAPABILITY");
    
    Thread.sleep(2000);

    sieve.sendPacket(
        "\"IMPLEMENTATION\" \"Replay Server\"\r\n" 
        + "\"SASL\" \""+sasl+"\"\r\n"
        + "\"SIEVE\" \"fileinto reject envelope vacation imapflags notify subaddress relational comparator-i;ascii-numeric regex\"\r\n"
        + "OK \"Capability completed.\"\r\n");
    
    Thread.sleep(2000);
	}
	
	private static void assertTrue(String in, String string) throws Exception
  {
    if (!in.startsWith(string))
      throw new Exception(string+" expected but got"+in);
  }

  private static void onListScript(SieveSocket sieve) throws Exception
	{
    assertTrue(sieve.readLine(),"LISTSCRIPTS");
  
    sieve.sendPacket(
        "\"SCRIPT\"\r\n"
        + "OK \"Listscript completed.\"\r\n");
	}
	
  private static void onSaslCramMd5(SieveSocket sieve) throws Exception
  {
    assertTrue(sieve.readLine(),"AUTHENTICATE \"CRAM-MD5\"");
   
    Thread.sleep(2000);
    
    sieve.sendPacket("\"PDUxMjk5Njc4MzAwNjM0NTcuMTMwOTg0MTM4N0BteC5tZXpvbi5sb2NhbD4=\"\r\n");
    
    Thread.sleep(2000);
    
    // It's the hash, we currently accept any hash...
    sieve.readLine();
    
    //... send authentication was ok
    sieve.sendPacket("OK \"Authentication completed.\"\r\n");

    Thread.sleep(2000);
  }
  
  private static void onSaslLogin(SieveSocket sieve) throws Exception
  {
    assertTrue(sieve.readLine(),"AUTHENTICATE \"LOGIN\"");        
    
    sieve.sendPacket("\"Username\"\r\n");
    
    Thread.sleep(2000);
    // The Username...
    sieve.readLine();
    
    sieve.sendPacket("\"Password\"\r\n");
    
    // The Password...
    sieve.readLine();
    
    Thread.sleep(2000);
    
    sieve.sendPacket("OK \"Authentication completed.\"\r\n");
  
    Thread.sleep(2000);
  }
  
  private static void doReferralTest(SieveSocket sieve) throws Exception
  {
    onInit("LOGIN",sieve);
    
    ServerSocket refServer = new ServerSocket(8080);
    
    if (tls)
      onStartTLS("LOGIN",sieve);
    
    onSaslLogin(sieve);
    
    assertTrue(sieve.readLine(),"LISTSCRIPTS");
      
    System.out.println("Referring");
      
      // sieve://localhost:8080
      // sieve://localhost:8080/
      // sieve://localhost:8080/mn
      // sieve://localhost
      // sieve://localhost/
      // sieve://localhost/mn
    sieve.sendPacket("BYE (REFERRAL \"sieve://localhost:8080\") \"Try Remote.\"\r\n");
      
    sieve.close();
      
    refServer.accept();
      
    System.out.println("Referral Test passed");
  }
  

  private static void doCramMd5Test(SieveSocket sieve) throws Exception
  { 
    onInit("CRAM-MD5",sieve);
    
    if (tls)
      onStartTLS("CRAM-MD5",sieve);
    
    onSaslCramMd5(sieve);
    
    onListScript(sieve);
    
    System.out.println("CRAM-MD5 Test passed...");
  }

  private static void doLoginTest(SieveSocket sieve) throws Exception
  {
    onInit("LOGIN", sieve);
    
    if (tls)
      onStartTLS("LOGIN",sieve);
    
    onSaslLogin(sieve);
    
    onListScript(sieve);
    
    System.out.println("Login Test passed...");
  }

  private static void doFragmentationTest(SieveSocket sieve) throws Exception
  {
    sieve.sendPacket("\"IMPLEMENTATION\" \"1.1\"\r\n");
    Thread.sleep(2000); 
    
    sieve.sendPacket(
        "\"SASL\" \"PLAIN\"\r\n"
        + "\"SIEVE\" \"fileinto reject envelope vacation imapflags notify subaddress relational comparator-i;ascii-numeric\"\r\n"
        + "\"STARTTLS\"\r\n"
        + "OK\r\n");
   
    assertTrue(sieve.readLine(),"STARTTLS");
    
    sieve.sendPacket("OK \"Begin TLS negotiation now\"\r\n");
    Thread.sleep(2000);
    
    sieve.sendPacket("\"IMPLEMENTATION\" \"1.1\"\r\n"
       +"\"SASL\" \"PLAIN\"\r\n"
       +"\"SIEVE\" \"fileinto\"\r\n"
       +"OK\r\n");
    
    Thread.sleep(2000);
    
    assertTrue(sieve.readLine(),"CAPABILITY");
    
    sieve.sendPacket("\"IMPLEMENTATION\" \"1.1\"\r\n"
        +"\"SASL\" \"PLAIN\"\r\n");
    Thread.sleep(2000);
    
    sieve.sendPacket("\"SIEVE\" \"fileinto\"\r\n");
    Thread.sleep(2000);
    
    assertTrue(sieve.readLine(),"LISTSCRIPTS");
    
    sieve.sendPacket(
        "OK\r\n"
        +"\"SCRIPT\"\r\n"
        + "OK \"Listscript completed.\"\r\n");    
    
    sieve.readLine();    
  }
}