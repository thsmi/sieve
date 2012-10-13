# Changelogs

## Sieve 0.2.2 - (22.09.2012)

* [NEW] Syntax highlight in text editor. It is based on [CodeMirror](http://www.codemirror.net)
* [NEW] Merge dialog if local script is newer than the remote.
* [NEW] Support for thunderbird's upcoming AppMenu
* [NEW] Changed indication in tab title
* [FIXED]  Closing Tab in offline mode could fail

## Sieve 0.2.1 - (15.08.2012)

* [NEW] Extension is [restartless / Bootstrapped](https://developer.mozilla.org/en-US/docs/Extensions/Bootstrapped_extensions)
* [NEW] Spanish locale
* [UPDATED] All strings should now be localized
* [UPDATED] French and German translations
* [UPDATED] Improved look and feel
* [UPDATED] Improved error handling and error messages
* [FIXED] Improved close and shutdown behavior
* [FIXED] Referrals broken, because session was lost after connect
* [FIXED] Toolbar in graphical editor now scrolls in x-position but maintains it's y-position
* [FIXED] Side and side and error bar dimensions should persist
* [FIXED] "Source View" button partly broken

## Sieve 0.2.0 - (02.04.2012)

* [NEW] Graphical Interface for editing scripts
* [UPDATE] French locale

## Sieve 0.1.14 - (16.12.2011)

* [NEW] [SCRAM-SHA1](https://tools.ietf.org/html/rfc5802) support
* [NEW] Tabbed UI
* [FIXED] CRAM-MD5 compatibility issues
* [FIXED] Packet fragmentation caused starttls workaround to randomly fail

## Sieve 0.1.13 - (19.07.2011)
* [UPDATED] Change default port to 4190 (see [RFC5804](https://wiki.tools.ietf.org/html/rfc5804#section-1.8"))
* [UPDATED] Hostname and Port configuration separated
* [UPDATED] Improved workaround for cyrus STARTTLS bug
* [FIXED] SASL CRAM-MD5 failed on Dovecot
* [NEW] connection pipelining
* [NEW] Support Tabulator Key in the Editor
* [NEW] Option to Force TLS
* [NEW] Account Wizard
  
## Sieve 0.1.12 - (04.04.2011)
* [FIXED] Referrals
* [FIXED] Detect timeouts more reliable

## Sieve 0.1.11 - (19.02.2011)
* [NEW] Non modal windows instead of modal dialogs
* [NEW] Concurrent sieve session
* [NEW] [Postbox 2.x](http://www.postbox-inc.com/) support
* [NEW] [Seamonkey](http://www.seamonkey-project.org/) support
* [UDATED] Improved support for Thunderbird's offline mode
  
## Sieve 0.1.10 - (01.08.2010)
* [NEW] Toolbar button
    <li>New: Detect Thunderbird's offline mode</li>
* [NEW] <a href="https://developer.mozilla.org/en/XPCOM/XPCOM_changes_in_Gecko_2.0"> Gecko 2.0</a> support
    <li>BugFix: Reduce Code Footprint</li>
* [FIXED] Overriding expired certificates
* [NEW] Tolerate non RFC conform response codes from broken cyrus servers
  
## Sieve 0.1.9 - (08.02.2010)
  <ul>
    <li>BugFix: Account Manager was broken due to bad character in French locale</li>
* [UPDATED] French and German translations
* [NEW] Russian locale
* [NEW] Socks Proxy support
    <li>New: <a href="http://www.postbox-inc.com/">Postbox 1.x</a> support</li>
  </ul>
  
## Sieve 0.1.8 (04.01.2010)
* [FIXED] SASL CRAM-MD5
    <li>BugFix: Use SASL LOGIN only as last resort</li>
* [NEW] Line numbers in editor
  </ul>  
  
## Sieve 0.1.7 (11.12.2009)
  <ul>
    <li>New: Support CHECKSCRIPT, NOOP and RENAME command</li>
    <li>New: Support VERSION, MAXREDIRECTS, NOTIFY, LANGUAGE and OWNER capabilities</li>
    <li>New: Thunderbird 3's new Password Manager</li>
    <li>New: Settings Dialog merged into Thunderbird's account manager</li>
    <li>New: Textsearch within a Sieve script </li>
    <li>BugFix: Exporting scripts failed on Linux</li>
    <li>BugFix: Scripts should be sorted by name</li>
    <li>BugFix: Renaming an active script failed on dovecot</li>    
    <li>New: Extension core now implemented as component</li>    
* [NEW] SASL CRAM-MD5 
    <li>New: override bad certificates in Thunderbird 3</li>  
* [NEW] French locale
  
## Sieve 0.1.6 (12.10.2008)
* [FIXED] Empty windows on Linux
* [NEW] German locale  
  
## Sieve 0.1.5 (03.10.2008)
* [NEW] Extended debug output
* [NEW] SASL proxy authorization
    <li>SASL authentication mechanism can be forced</li>
* [UPDATED] Improved error handling
* [NEW] Enable secure extension updates
* [FIXED] TLS handshake failed with non cyrus server
    <li>Capability dialog merged into SieveFilters window</li>
* [UPDATED] Option &amp; Filter Editor UI
    <li>Cursor position now shown in statusbar</li>
    <li>Sidebar containing a Sieve reference</li>
* [UPDATED] custom authentication
* [FIXED] UTF-8 compatibility issues
 
## Sieve 0.1.4 (22.04.2007)
* [FIXED] "SASL Login" mechanism
    <li>Large sieve scripts caused the extension to die silently due to packet fragmentation.</li>
* [FIXED] UTF-8 compatibility issues
 
## Sieve 0.1.3 (30.09.2006)
* [NEW] SASL Login mechanism    
    <li>Line break related bug fixed</li>  
  
## Sieve 0.1.2 (03.09.2006)
* [NEW] Automatic Extension updates
    <li>Line break issue, which caused a "line 1: syntax error,..." resolved</li>
* [NEW] Rename button
* [NEW] Debug mode
  
## Sieve 0.1.1 (10.05.2006)
* [NEW] Referrals 
* [UPDATED] Error handling improved
* [FIXED] Settings dialog fixed
  
## Sieve 0.1.0 (01.05.2006)
* [NEW] Initial release