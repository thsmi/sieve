# Thunderbird Sieve Extension

Sieve is a powerful script language for server-side mail filtering. It is 
intended to be used with [IMAP](http://tools.ietf.org/html/rfc3501) and thus 
it is widely spread. Many IMAP Server are capable of running sieve filters. 
Sieve stores and runs all script on the server-side.

Now there is the dilemma - you have access to a server supporting sieve but, 
how do you manage your scripts on this server?

You can use telnet for this purpose, but that is fair to uncomfortable, not 
applicable for a normal user and almost impossible with secure connections. 
Wouldn't it be great to activate, edit, delete and add sieve scripts with a 
convenient interface? That is exactly what the Sieve Extension offers...

## Status

The extension is an implementation of the [sieve management protocol (RFC 5804)](https://wiki.tools.ietf.org/html/rfc5804).
Currently only "SASL Plain", "SASL Login", "SASL CRAM MD5" and "[SASL SCRAM SHA1](https://tools.ietf.org/html/rfc5802)" 
Authentication mechanisms are supported, others may be implemented on request. 
The project exists since 2006 and can be considered as stable.

## Bugs

Please report bugs via the [issue tracker](https://github.com/thsmi/sieve/issues) 
or send an email to schmid-thomas at gmx.net

Give me 1-2 weeks time for a reply. If you did not receive a reply at all, it 
might be a good idea to check your spam filter. 

## License

The extension is free and open source software, it is made available to you 
under the terms of the [GNU Affero General Public License (AGPLv3)](http://www.fsf.org/licensing/licenses/agpl-3.0.html).

Refer to [Licensing information](https://github.com/thsmi/sieve/blob/master/LICENSE.md) for details.

## Releases

You are looking for the most recent release? Just go to [addons.mozilla.org](https://addons.mozilla.org/en-US/thunderbird/addon/sieve/).

See the [Changelog](https://github.com/thsmi/sieve/blob/master/CHANGELOG.md) 
for what's new in the most recent and upcoming releases.

## Developments Builds

You are looking for the latest "bleeding edge" features and willing to risk more instability?
Or you might even want to test out newly added code to help identify and debug problems?

Just go to the download section:

https://github.com/thsmi/sieve/downloads

1. Right-Click on the nightly build and choose "Save Link As..." to Download and 
   save the file to your hard disk.
2. In Mozilla Thunderbird, open the addon manager (Tools Menu/Addons) 
3. Click the Install button, and locate/select the file you downloaded and click "OK"


But keep in mind: You use these development builds at your own risk and please 
report bugs! Don't be confused these builds don't use special version numbers, 
but anyhow they should automatically upgrade to stable builds upon release of 
the next version.