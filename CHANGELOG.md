# Changelogs

***The changelog for newer releases can be found here https://github.com/thsmi/sieve/releases***

## Thunderbird 128+ / 148+ Compatibility Fixes

The following breaking API changes in Thunderbird's Gecko engine required
fixes in the WebExtension experiment APIs (`src/wx/api/sieve/`).

### SieveSocketApi.js

**`Services.jsm` import removed (TB 128+)**
`ChromeUtils.import("resource://gre/modules/Services.jsm")` no longer works.
`Services` is now a built-in global in privileged experiment API contexts and
must not be imported manually.

**Proxy lookup bypassed (TB 128+)**
`nsIProtocolProxyService.asyncResolve()` changed behaviour and caused
connection hangs with proxy auto-detection (PAC/WPAD). Since ManageSieve
connects directly without proxy awareness, the async lookup is skipped and
`onProxyAvailable()` is called directly with `null` (= direct connection).

**`nsISSLSocketControl` → `nsITLSSocketControl` (TB 115+)**
`nsISSLSocketControl` was replaced by `nsITLSSocketControl`. Additionally,
in TB 128+ the TLS control object is exposed as a direct property
`nsISocketTransport.tlsSocketControl` (with QueryInterface required to
expose methods) rather than through `securityInfo`. Both paths are tried
with fallback to the legacy interface for older TB versions.

**`StartTLS()` → `asyncStartTLS()` (TB 148+)**
`nsITLSSocketControl.StartTLS()` was renamed to `asyncStartTLS()` and now
returns a Promise. `startTLS()` in SieveSocketApi is now `async` and awaits
`asyncStartTLS()`, with fallback to the synchronous `StartTLS()` for older
Thunderbird versions.

### SieveAccountsApi.js

**`realHostName` → `hostName` (TB 128+)**
`nsIMsgIncomingServer.realHostName` was removed; use `hostName` instead.

**`realUsername` → `username` (TB 128+)**
`nsIMsgIncomingServer.realUsername` was removed; use `username` instead.
Without this fix, `undefined` was interpolated into the SASL PLAIN credential
string and sent as the literal username `"undefined"`, causing authentication
to fail.

### manifest.json

`strict_min_version` raised from `68.0a1` to `128.0` to reflect the minimum
Thunderbird version actually supported after the API changes above.

## Sieve 0.2.3 - ([in Progress](https://github.com/thsmi/sieve/issues?milestone=2&state=open))
Development builds can be found in the [Downloads section](https://github.com/thsmi/sieve/blob/master/nightly/README.md). 
* [FIXED] [Quoted Strings ignored escape characters](https://github.com/thsmi/sieve/issues/8)
* [FIXED] "Empty string passed to getElementById()" Warning
* [UPDATED] Move to [CodeMirror v3.x](http://codemirror.net/) 
* [FIXED] AccountManager broken [because Mozilla changed nsISupportsArray's Interfaces](https://bugzilla.mozilla.org/show_bug.cgi?id=820377)
* [FIXED] Autoconfig failed randomly with centos servers
* [FIXED] [Thunderbirds default proxy configuration wasn't respected](https://github.com/thsmi/sieve/issues/15)
* [NEW] Support RegEx Extension.
* [FIXED] Use Object.create instead of __proto__
* [UPDATE] Update to most recent JQuery

## Sieve 0.2.2 - (22.09.2012)
* [NEW] Syntax highlight in text editor. It is based on [CodeMirror](http://www.codemirror.net)
* [NEW] Merge dialog if local script is newer than the remote.
* [NEW] Support for thunderbird's upcoming AppMenu
* [NEW] Changed indication in tab title
* [FIXED] Closing Tab in offline mode could fail

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
* [NEW] Connection pipelining
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
* [NEW] Support and Detect Thunderbird's offline mode
* [NEW] [Gecko 2.0]("https://developer.mozilla.org/en/XPCOM/XPCOM_changes_in_Gecko_2.0") support
* [UPDATED] Improve / reduce code footprint
* [FIXED] Overriding expired certificates
* [NEW] Tolerate non RFC conform response codes from broken cyrus servers
  
## Sieve 0.1.9 - (08.02.2010)
* [FIXED] Unusable Account Manager due to bad character in French locale
* [UPDATED] French and German translations
* [NEW] Russian locale
* [NEW] Socks Proxy support
* [NEW] [Postbox 1.x]("http://www.postbox-inc.com/") support
  
## Sieve 0.1.8 (04.01.2010)
* [FIXED] SASL CRAM-MD5
* [FIXED] Use deprecated SASL LOGIN only as last resort
* [NEW] Line numbers in editor
  
## Sieve 0.1.7 (11.12.2009)
* [NEW] CHECKSCRIPT, NOOP and RENAME command
* [NEW] VERSION, MAXREDIRECTS, NOTIFY, LANGUAGE and OWNER capabilities
* [NEW] Support Thunderbird 3's new Password Manager
* [NEW] Settings Dialog integrated into Thunderbird's account manager
* [NEW] Search and replace within a Sieve script
* [FIXED] Exporting scripts on Linux
* [NEW] Sort scripts by name
* [FIXED] Renaming an active script on dovecot servers
* [NEW] Implement Extension core as components   
* [NEW] SASL CRAM-MD5 
* [FIXED] Override bad certificates in Thunderbird 3 
* [NEW] French locale
  
## Sieve 0.1.6 (12.10.2008)
* [FIXED] Empty windows on Linux
* [NEW] German locale  
  
## Sieve 0.1.5 (03.10.2008)
* [NEW] Extended debug output
* [NEW] SASL proxy authorization
* [NEW] SASL authentication mechanism can be forced
* [UPDATED] Improved error handling
* [NEW] Enable secure extension updates
* [FIXED] TLS handshake failed with non cyrus server
* [NEW] Capability dialog integrated into SieveFilters window
* [UPDATED] Option &amp; Filter Editor UI
* [NEW] Display Cursor position in statusbar
* [NEW] Sidebar with a Sieve Language reference
* [UPDATED] custom authentication
* [FIXED] UTF-8 compatibility issues
 
## Sieve 0.1.4 (22.04.2007)
* [FIXED] "SASL Login" mechanism
* [FIXED] Large sieve scripts caused the extension to die silently due to packet fragmentation
* [FIXED] UTF-8 compatibility issues
 
## Sieve 0.1.3 (30.09.2006)
* [NEW] SASL Login mechanism    
* [FIXED] Line break related issues  
  
## Sieve 0.1.2 (03.09.2006)
* [NEW] Automatic Extension updates
* [FIXED] Line break issue "line 1: syntax error,..."
* [NEW] Rename button
* [NEW] Debug mode
  
## Sieve 0.1.1 (10.05.2006)
* [NEW] Referrals
* [UPDATED] Error handling improved
* [FIXED] Settings dialog
  
## Sieve 0.1.0 (01.05.2006)
* [NEW] Initial release
