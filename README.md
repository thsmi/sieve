# Thunderbird Sieve Extension

[Sieve](http://en.wikipedia.org/wiki/Sieve_%28mail_filtering_language%29) is 
a powerful script language for server-side mail filtering. It is 
intended to be used with [IMAP](http://tools.ietf.org/html/rfc3501) and thus 
it is widely spread. Many IMAP Server are capable of running sieve filters. 
Sieve stores and runs all script on the server-side.

Now there is the dilemma - you have access to a server supporting sieve but, 
how do you manage your scripts on this server?

You can use telnet for this purpose, but that is fair to uncomfortable, not 
applicable for a normal user and almost impossible with secure connections. 
Wouldn't it be great to activate, edit, delete and add sieve scripts with a 
convenient interface? That is exactly what the Sieve Extension offers...

![screenshot](https://f.cloud.github.com/assets/2531380/15883/135e6ae4-47dc-11e2-8909-189ce5476ab6.png)

## Status

The extension is an implementation of the [sieve management protocol (RFC 5804)](https://wiki.tools.ietf.org/html/rfc5804).
Currently only "SASL Plain", "SASL Login", "SASL CRAM MD5" and "[SASL SCRAM SHA1](https://tools.ietf.org/html/rfc5802)" 
Authentication mechanisms are supported, others may be implemented on request. 

The project exists since 2006 and can be considered as stable. Statistics
are available at [ohloh](https://www.ohloh.net/p/tb-sieve)

It is translated into French, Spanish, Russian and German.  If you're interested 
in translating or localizing the extension into your language, just sign up at 
[crowdin](http://crowdin.net/project/sieve/invite) and start translating 
(Crowdin is a free collaborative translation tool).

For more details on contributing refer to the [Contributing Guidelines](https://github.com/thsmi/sieve/blob/master/CONTRIBUTING.md)  

A big thank you to every one who have [contributed and supported](CONTRIBUTORS.md) this project.

[![PayPayl donate button](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=EAS576XCWHKTC "Donate to this project using Paypal")

## Bugs

Please report bugs via the [issue tracker](https://github.com/thsmi/sieve/issues) 
or send an email to schmid-thomas at gmx.net . You find more details on reporting bugs 
in the [Contributing Guidelines](https://github.com/thsmi/sieve/blob/master/CONTRIBUTING.md)


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

Just go to 
[https://github.com/thsmi/sieve/blob/master/nightly](https://github.com/thsmi/sieve/blob/master/nightly/README.md)
