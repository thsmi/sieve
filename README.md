# Thunderbird Sieve Extension

[Sieve](http://en.wikipedia.org/wiki/Sieve_%28mail_filtering_language%29) is
a powerful script language for server-side mail filtering. It is
intended to be used with [IMAP](http://tools.ietf.org/html/rfc3501) and thus
it is widely spread. Many IMAP Server are capable of running sieve filters.
Sieve stores and runs all script on the server-side.

Now there is the dilemma - you have access to a server supporting sieve but,
how do you manage your scripts on this server?

You can use telnet for this purpose, but that is far to uncomfortable, not
applicable for a normal user and almost impossible with secure connections.
Wouldn't it be great to activate, edit, delete and add sieve scripts with a
convenient interface? That is exactly what the Sieve Extension offers...

![screenshot](https://f.cloud.github.com/assets/2531380/15883/135e6ae4-47dc-11e2-8909-189ce5476ab6.png)

## Status

The extension is an implementation of the [sieve management protocol (RFC 5804)](https://wiki.tools.ietf.org/html/rfc5804).
Currently only "SASL Plain", "SASL Login", "SASL CRAM MD5", "[SASL SCRAM SHA1](https://tools.ietf.org/html/rfc5802)" and "[SASL SCRAM SHA256](https://tools.ietf.org/html/rfc7677)" Authentication mechanisms are supported, others may be implemented on request.

The graphical script editor supports the [Sieve Filter Language (RFC 5228)](https://tools.ietf.org/html/rfc5228).

The project exists since 2006 and can be considered as stable. Statistics
are available at [ohloh](https://www.ohloh.net/p/tb-sieve)

It is translated into French, Spanish, Russian and German. If you're interested
in translating or localizing the extension into your language, just sign up at
[crowdin](http://crowdin.net/project/sieve/invite) and start translating
(Crowdin is a free collaborative translation tool). If you added a translation please
drop a note via email or open a ticket, so that I can regenerate the localised files.

For more details on contributing refer to the [Contributing Guidelines](https://github.com/thsmi/sieve/blob/master/CONTRIBUTING.md)

A big thank you to every one who have [contributed and supported](CONTRIBUTORS.md) this project.

If you want to support this project consider donating

  * Code, patches or localisations
  * via Paypal [![PayPayl donate button](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=EAS576XCWHKTC "Donate to this project using Paypal")

  * via Bitcoin [1GEnrRVobFYuqYj2opdvRQNtG3Z8znvfKw](bitcoin:1GEnrRVobFYuqYj2opdvRQNtG3Z8znvfKw?label=Donation%20for%20Sieve%20Addon)


## Questions and Bugs

The best for questions is the public mailing list at https://groups.google.com/forum/#!forum/sieve-app or via mail sieve-app@googlegroups.com . But you can also send a private mail to schmid-thomas at gmx.net.

Concerning bugs please use the [issue tracker](https://github.com/thsmi/sieve/issues)
or send a private email to schmid-thomas at gmx.net . You find more details on reporting bugs
in the [Contributing Guidelines](https://github.com/thsmi/sieve/blob/master/CONTRIBUTING.md)


Give me 1-2 weeks time for a reply. If you did not receive a reply at all, it
might be a good idea to check your spam filter.

## License

The extension is free and open source software, it is made available to you
under the terms of the [GNU Affero General Public License (AGPLv3)](http://www.fsf.org/licensing/licenses/agpl-3.0.html).

Refer to [Licensing information](https://github.com/thsmi/sieve/blob/master/LICENSING_INFO.md) for details.

## Releases

You are looking for the most recent release?

Just go to [the releases page and download the latest stable xpi or view the release notes](https://github.com/thsmi/sieve/releases/latest).

*Firefox user have to do a right click on the XPI download and select "Save link as" otherwise Firefox will steal the link and try to install the addon it into Firefox which will fail*

Since 0.2.4 the addon is self hosted. This means it is will update automatically, but it is no more listed at addons.mozilla.org.

This is because of a design flaw in Thunderbirds APIs for loading and unloading an extension. These are synchonous while the Networking API is asynchonous. So the async close of the networking and the synchonous unload are racing against eachother. Which is ugly but completely harmless. But it may trigger unhandled exception. The latter violates the review policies at addon.mozilla.org. Which makes the loop complete. It is not possible to fix this behaviour as it is native to thunderbird but it prevents a the addon to pass the review at addons.mozilla.org. This is why the this addon has to be self hosted...

## Developments Builds

You are looking for the latest "bleeding edge" features and willing to risk more instability?
Or you might even want to test out newly added code to help identify and debug problems?

You can find the development builds also in the [release section](https://github.com/thsmi/sieve/releases). They are marked as prerelease. They will update to newer releases but not to newer prereleases.
