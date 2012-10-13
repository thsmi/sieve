# Changelog

## Sieve 0.2.2 - (22.09.2012)

* [NEW] Syntax highlight in text editor. It is based on [CodeMirror](http://www.codemirror.net)
* [NEW] Merge dialog if local script is newer than the remote.
* [NEW] Support for thunderbird's upcoming AppMenu
* [NEW] Changed indication in tab title
* [BUGFIX]  Closing Tab in offline mode could fail

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
* [FIXEd] "Source View" button partly broken

## Sieve 0.2.0 - (02.04.2012)

* [NEW] Graphical Interface for editing scripts
* [UPDATE] French locale

## Sieve 0.1.14 - (16.12.2011)

* [NEW] [SCRAM-SHA1](https://tools.ietf.org/html/rfc5802) support
* [NEW] Tabbed UI
* [FIXED] CRAM-MD5 compatibility issues
* [FIXED] Packet fragmentation caused starttls workaround to randomly fail


  <h5>Sieve 0.1.13 - (19.07.2011)</h5>
  <ul>
    <li>Update: Switch default port to 4190 (see <a href="https://wiki.tools.ietf.org/html/rfc5804#section-1.8">RFC</a>)</li>
    <li>Update: Hostname and Port configuration separated</li>
    <li>Update: Improoved workaround for cyrus STARTTLS bug</li>
    <li>BugFix: SASL CRAM-MD5 failed on Dovecot</li>
    <li>New: Backend supports pipelining.</li>
    <li>New: Support Tabulator Key in the Editor</li>
    <li>New: Force TLS</li>
    <li>New: Account Wizard</li>
  </ul>
  <h5>Sieve 0.1.12 - (04.04.2011)</h5>
  <ul>
    <li>BugFix: Fix Referrals</li>
    <li>BugFix: Detect timeouts more reliable</li>
  </ul>
  <h5>Sieve 0.1.11 - (19.02.2011)</h5>
  <ul>
    <li>New: Non modal windows instead of dialogs</li>
    <li>New: Manage concurrent sieve session</li>
    <li>New: <a href="http://www.postbox-inc.com/">Postbox 2.x</a> support</li>
    <li>New: <a href="http://www.seamonkey-project.org/">Seamonkey 2.x</a> support</li>
    <li>Update: Improve support for Thunderbird's offline mode</li>
  </ul>
  <h5>Sieve 0.1.10 - (01.08.2010)</h5>
  <ul>
    <li>New: Toolbar button</li>
    <li>New: Detect Thunderbird's offline mode</li>
    <li>New: Support for upcomming <a href="https://developer.mozilla.org/en/XPCOM/XPCOM_changes_in_Gecko_2.0"> Gecko 2.0</a></li>
    <li>BugFix: Reduce Code Footprint</li>
    <li>BugFix: Overriding expired certificates was broken</li>
    <li>New: Support non RFC conform response codes from broken cyrus servers</li>
  </ul>  
  <h5>Sieve 0.1.9 - (08.02.2010)</h5>
  <ul>
    <li>BugFix: Account Manager was broken due to bad character in French locale</li>
    <li>Updated: French and German locale</li>
    <li>New: Russian locale</li>
    <li>New: Socks Proxy support</li>
    <li>New: <a href="http://www.postbox-inc.com/">Postbox 1.x</a> support</li>
  </ul>
  <h5>Sieve 0.1.8 (04.01.2010)</h5>
  <ul>
    <li>BugFix: SASL CRAM-MD5</li>
    <li>BugFix: Use SASL LOGIN only as last resort</li>
    <li>New: Line numbers in editor</li>
  </ul>  
  <h5>Sieve 0.1.7 (11.12.2009)</h5>
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
    <li>New: SASL CRAM -MD5 support</li> 
    <li>New: override bad certificates in Thunderbird 3</li>  
    <li>New: French locale</li> 
  </ul>  
  <h5>Sieve 0.1.6 (12.10.2008)</h5>
  <ul>
    <li>BugFix: Empty windows on Linux fixed</li>
    <li>New: German locale added</li>
  </ul>  
  <h5>Sieve 0.1.5 (03.10.2008)</h5>
  <ul>
    <li>Extended debug output</li>
    <li>Support SASL proxy authorization</li>
    <li>SASL authentication mechanism can be forced</li>
    <li>Improved error handling</li>
    <li>Enable secure extension updates</li>
    <li>TLS secured authentication failed with non cyrus server</li>
    <li>Capability dialog merged into SieveFilters window</li>
    <li>Option &amp; Filter Editor UI revised</li>
    <li>Cursor position now shown in statusbar</li>
    <li>Sidebar containing a Sieve reference</li>
    <li>Revise custom authentication</li>    
    <li>Improved UTF-8 compatibility</li> 
  </ul>  
  <h5>Sieve 0.1.4 (22.04.2007)</h5>
  <ul>
    <li>Bugfix for "SASL Login" mechanism</li>
    <li>Large sieve scripts caused the extension to die silently due to packet fragmentation.</li>
    <li>UTF-8 compatibility patch</li>
  </ul>  
  <h5>Sieve 0.1.3 (30.09.2006)</h5>
  <ul>
    <li>SASL Login mechanism implemented (but not fully tested)</li>    
    <li>Line break related bug fixed</li>  
  </ul>  
  <h5>Sieve 0.1.2 (03.09.2006)</h5>
  <ul>
    <li>Extension updates activated</li>
    <li>Line break issue, which caused a "line 1: syntax error,..." resolved</li>
    <li>Rename button added</li>
    <li>Debug mode added </li>
  </ul>
  <h5>Sieve 0.1.1 (10.05.2006)</h5>
  <ul>
    <li>Sieve referrals are now properly handled</li>
    <li>Error handling improved</li>
    <li>Minor bugs in the settings dialog fixed</li>
  </ul>  
  <h5>Sieve 0.1.0 (01.05.2006)</h5>
  <ul>
    <li>Initial release</li>
  </ul>  
</div>