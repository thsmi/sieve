/* 
 * The contents of this file is licenced. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via email 
 * from the author. Do not remove or change this comment. 
 * 
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

package org.mozdev.sieve;
import java.net.ServerSocket;


// Use the following commands to create a keystore and a truststore.
//
// set path="c:\Program Files\Java\jre6\bin";%path%
//
// keytool -genkey -alias server -keyalg RSA -keystore keystore.jks -storepass secret -keypass secret
// keytool -export -alias server -keystore keystore.jks -rfc -file server.cer -storepass secret
// keytool -import -alias ca -file server.cer -keystore truststore.jks -storepass secret
// keytool -importkeystore -srckeystore keystore.jks -destkeystore keystore.p12 -srcstoretype JKS -deststoretype PKCS12 -srcstorepass secret
// 


public class ReplayServer
{
  
  static final tests test = tests.EXTERNAL;
  
  static boolean cyrusBug = false;
  static boolean tls = false;
  
  // Scram SHA1 specific
  static boolean brokenServerSignature = false;
  static boolean inlineServerSignature = false;
  
  static enum tests { ANONYMOUS, FRAGMENTATION, REFERRAL, REFERRAL2, CRAMMD5, LOGIN, SCRAMSHA1, EXTERNAL }



	public static void main(String[] args) throws Exception
	{	  

      // create the server...
      SieveSocket client = (new SieveServerSocket(2000,false)).accept();
	  
      switch (test)
      {
  	    case ANONYMOUS:
  		  doAnonymousTest(client);
  		  break;
  	    case FRAGMENTATION:
  	      doFragmentationTest(client);
  	      break;
  	    case REFERRAL:
  	      doReferralTest(client);
  	      break;
  	    case REFERRAL2:
  	      doReferalTest2(client);
          break;  	      
  	    case CRAMMD5:
  	      doCramMd5Test(client);
  	      break;
        case SCRAMSHA1:
          doScramSha1Test(client);
          break;  	    
  	    case LOGIN:
          doLoginTest(client);
  	      break;
  	    case EXTERNAL:
  	      doExternalTest(client);
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
      throw new Exception(string+" expected but got "+in);
  }
 
  private static void createTimeout() throws InterruptedException
  {
	Thread.sleep(10000);
  }
  
  private static void onListScript(SieveSocket sieve) throws Exception
  {
    assertTrue(sieve.readLine(),"LISTSCRIPTS");
  
    sieve.sendPacket(
        "\"SCRIPT\"\r\n"
        + "OK \"Listscript completed.\"\r\n");
  }

  private static void onSaslScramSha1(SieveSocket sieve) throws Exception
  {
    /* 
     * We use testsqeuence from the RFC 5802
     *
     * C: n,,n=user,r=fyko+d2lbbFgONRv9qkxdawL
     * S: r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096
     * C: c=biws,r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,p=v0X8v3Bz2T0CJGbJQyF0X+HI4Ts=
     * S: v=rmF9pqV8S7suAoZWja4dJRkFsKQ=
     *
     * As SCRAM is secure and this test is dumb we need to tweak/force the client to 
     * use a a predifined nonce
     * 
     * nonce = fyko+d2lbbFgONRv9qkxdawL
     * username = user
     * password = pencil
     * 
     * C: biwsbj11c2VyLHI9ZnlrbytkMmxiYkZnT05Sdjlxa3hkYXdM
     * S: cj1meWtvK2QybGJiRmdPTlJ2OXFreGRhd0wzcmZjTkhZSlkxWlZ2V1ZzN2oscz1RU1hDUitRNnNlazhiZjkyLGk9NDA5Ng==
     * C: Yz1iaXdzLHI9ZnlrbytkMmxiYkZnT05Sdjlxa3hkYXdMM3JmY05IWUpZMVpWdldWczdqLHA9djBYOHYzQnoyVDBDSkdiSlF5RjBYK0hJNFRzPQ==
     * S: dj1ybUY5cHFWOFM3c3VBb1pXamE0ZEpSa0ZzS1E9
     */

    assertTrue(sieve.readLine(),
        "AUTHENTICATE \"SCRAM-SHA-1\" \"biwsbj11c2VyLHI9ZnlrbytkMmxiYkZnT05Sdjlxa3hkYXdM\"");
    
    sieve.sendPacket("\"cj1meWtvK2QybGJiRmdPTlJ2OXFreGRhd0wzcmZjTkhZSlkxWlZ2V1ZzN2oscz1RU1hDUitRNnNlazhiZjkyLGk9NDA5Ng==\"\r\n");
    
    assertTrue(sieve.readLine(), 
        "\"Yz1iaXdzLHI9ZnlrbytkMmxiYkZnT05Sdjlxa3hkYXdMM3JmY05IWUpZMVpWdldWczdqLHA9djBYOHYzQnoyVDBDSkdiSlF5RjBYK0hJNFRzPQ==\"");

    String verifier; 
    
    if (brokenServerSignature)
      verifier = "\"dj1ybUY5cHFWOFM3c3VBb1pXamE0ZEpSa0ZzS0k=\"";
    else
      verifier = "\"dj1ybUY5cHFWOFM3c3VBb1pXamE0ZEpSa0ZzS1E9\"";
      
     
    if (inlineServerSignature)
    {
      sieve.sendPacket("OK (SASL "+verifier+")\r\n");
      return;      
    }
    
    sieve.sendPacket(verifier+"\r\n");
    
    assertTrue(sieve.readLine(),"\"\"");    
    
    sieve.sendPacket("OK\r\n");
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
  
  
  private static void doAnonymousTest(SieveSocket sieve) throws Exception
  {
	  onInit("LOGIN",sieve);
	  	
	  onListScript(sieve);
	  
	  createTimeout();
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
    
    refServer.close();
  }
  
  private static void doReferalTest2(SieveSocket sieve) throws Exception  
  {
    /* [22:54:02.842 server2] Server -> Client
     * "IMPLEMENTATION" "Cyrus timsieved (Murder) v2.4.14-univie-1.1"
     * "SASL" "PLAIN"
     * "SIVE" "comparator-i;ascii-numeric fileinto reject vacation imapflags notify envelope relational regex subaddress copy"
     * "STARTTLS"
     * "UNAUTHENTICATE"
     * OK
	 */
	  
	onInit("PLAIN",sieve);

	
	/* [22:54:02.845 server2] Client -> Server:
	 * AUTHENTICATE "PLAIN" "xxxxxxxxx"
	 */	 
	  
    assertTrue(sieve.readLine(),"AUTHENTICATE \"PLAIN\"");
	
    
	/* [22:54:02.990 server2] Server -> Client
	 *  OK  
	 */    
	sieve.sendPacket("OK\r\n");
	

    /* [22:54:02.991 server2] Client -> Server:
     * LISTSCRIPTS
     */
	assertTrue(sieve.readLine(),"LISTSCRIPTS");
	
	
	/* [22:54:03.012 server2] Server -> Client
	 * BYE (REFERRAL "sieve://lyle.univie.ac.at") "Try Remote." 
	 */
	sieve.sendPacket("BYE (REFERRAL \"sieve://localhost:2001\") \"Try Remote.\"\r\n");    		

	/*
	 * 	    		> [22:54:03.012 server2] Disconnected ...
	    		> [22:54:03.012 server2] Referred to Server: lyle.univie.ac.at
	    		> [22:54:03.013 server2] Connecting to lyle.univie.ac.at:4190 ...
	    		> [22:54:03.013 server2] Using Proxy: Direct
	    		> [22:54:03.013 server2] Stop request received ...
	    		> [22:54:03.060 server2] Connected to lyle.univie.ac.at:4190 ...
	    		

	 */
	
	SieveSocket sieve2 = (new SieveServerSocket(2001,true)).accept();
	sieve.close();
	
	/*
	 * [22:54:03.061 server2] Server -> Client
	 * 	    		> "IMPLEMENTATION" "Cyrus timsieved (Murder) v2.4.14-univie-1.1"
	    		> "SASL" "PLAIN"
	    		> "SIEVE" "comparator-i;ascii-numeric fileinto reject vacation imapflags
	    		> notify envelope relational regex subaddress copy"
	    		> "STARTTLS"
	    		> "UNAUTHENTICATE"
	    		> OK
	 */
	onInit("PLAIN",sieve2);
	

	/*
	 * 	    		> [22:54:03.063 server2] Client -> Server:
	    		> AUTHENTICATE "PLAIN" "xxxxxxxxxxx"
	 */

    assertTrue(sieve2.readLine(),"AUTHENTICATE \"PLAIN\"");
	
    
	/* [22:54:03.198 server2] Server -> Client
	 *  OK  
	 */    
	sieve2.sendPacket("OK\r\n");
	
	assertTrue(sieve2.readLine(),"LISTSCRIPT");
	
	//assertTrue(sieve2.readLine(),"LOGOUT");
	
	sieve2.sendPacket("OK\r\n");
	
	//Thread.sleep(2000);
	sieve2.close();

	System.out.println("Referral2 Test passed");
	
/*	    		> [22:54:03.198 server2] Invoking Listeners for onChannelCreated
	    		> SivFilerExplorer.sivSendRequest:
	    		> [22:54:03.199 server2] Client -> Server:
	    		> LOGOUT
	    		> [22:54:03.330 server2] Server -> Client
	    		> OK "Logout Complete"
	    		> [22:54:03.330 server2] Disconnected ...
	    		> [22:54:03.330 server2] Stop request received ...*/	    

  }
    
  

  private static void doScramSha1Test(SieveSocket sieve) throws Exception
  {
    onInit("SCRAM-SHA-1",sieve);
    
    if (tls)
      onStartTLS("SCRAM-SHA-1",sieve);
    
    onSaslScramSha1(sieve);
    
    onListScript(sieve);
    
    System.out.println("SCRAM-SHA-1 Test passed...");
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
    //Thread.sleep(2000); 
    Thread.sleep(50);
    
    sieve.sendPacket(
        "\"SASL\" \"PLAIN\"\r\n"
        + "\"SIEVE\" \"fileinto reject envelope vacation imapflags notify subaddress relational comparator-i;ascii-numeric\"\r\n"
        + "\"STARTTLS\"\r\n"
        + "OK\r\n");
   
    assertTrue(sieve.readLine(),"STARTTLS");
    
    sieve.sendPacket("OK \"Begin TLS negotiation now\"\r\n");
    sieve.startSSL();
    
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
    
    assertTrue(sieve.readLine(),"AUTHENTICATE \"PLAIN\"");
    sieve.sendPacket("OK\r\n"+"OK\r\n"); 
    
    assertTrue(sieve.readLine(),"LISTSCRIPTS");
    
    sieve.sendPacket(
        "\"SCRIPT\"\r\n"
        + "OK \"Listscript completed.\"\r\n");    
    
    sieve.readLine();    
  }
  
  private static void doExternalTest(SieveSocket sieve) throws Exception
  {
    onInit("EXTERNAL", sieve);
    
    if (tls)
      onStartTLS("EXTRNAL",sieve);
        
    assertTrue(sieve.readLine(),"AUTHENTICATE \"EXTERNAL\" \"\"");  
    
    Thread.sleep(2000);
    
    sieve.sendPacket("OK \"Authentication completed.\"\r\n");
  
    Thread.sleep(2000);    
    
    onListScript(sieve);
    
    System.out.println("Login Test passed...");
  }  
}