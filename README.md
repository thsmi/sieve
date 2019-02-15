# Thunderbird sieve add-on

[Sieve](http://en.wikipedia.org/wiki/Sieve_%28mail_filtering_language%29) is a 
powerful scripting language for server-side mail filtering. It is intended to 
be used with [IMAP](http://tools.ietf.org/html/rfc3501) which is ubiquitous. 
Many IMAP Servers are capable of running Sieve filters. Sieve stores and runs 
all scripts on the server-side.

Now there is the dilemma – you have access to a server supporting Sieve but how 
do you manage your scripts on this server?

You can use [Telnet](https://en.wikipedia.org/wiki/Telnet) for this purpose, 
but that is far too uncomfortable, not applicable for a normal user and almost 
impossible with secure connections. Wouldn’t it be great to activate, edit, 
delete and add Sieve scripts with a convenient interface? That is exactly what 
the [Sieve add-on](https://addons.thunderbird.net/addon/sieve/) offers…

![Thunderbird with Sieve add-on showing “Extended Sieve Examples” tab](https://f.cloud.github.com/assets/2531380/15883/135e6ae4-47dc-11e2-8909-189ce5476ab6.png)


## Status

The [Sieve add-on](https://addons.thunderbird.net/addon/sieve/) is an 
implementation of 
[A Protocol for Remotely Managing Sieve Scripts (RFC 5804)](https://wiki.tools.ietf.org/html/rfc5804).
Currently supported authentication mechanisms are:
SASL CRAM MD5;
SASL Login;
SASL Plain;
[SASL SCRAM SHA1](https://tools.ietf.org/html/rfc5802);
[SASL SCRAM SHA256](https://tools.ietf.org/html/rfc7677). 
Other authentication mechanisms may be added by request.

The graphical script editor supports 
[Sieve: An Email Filtering Language (RFC 5228)](https://tools.ietf.org/html/rfc5228).

The [Sieve add-on](https://addons.thunderbird.net/addon/sieve/) exists since 
2006 and is considered stable. Statistics are available at 
[Open Hub](https://www.openhub.net/p/tb-sieve).

[The Sieve add-on is translated](https://crowdin.com/project/sieve/) into 
[Arabic (ar)](https://crowdin.com/project/sieve/ar),
[Chinese Simplified (zh-CN)](https://crowdin.com/project/sieve/zh-CN#),
[Dutch (nl)](https://crowdin.com/project/sieve/nl),
[French (fr)](https://crowdin.com/project/sieve/fr),
[German (de)](https://crowdin.com/project/sieve/de),
[Hungarian (hu)](https://crowdin.com/project/sieve/hu),
[Indonesian (id)](https://crowdin.com/project/sieve/id),
[Polish (pl)](https://crowdin.com/project/sieve/pl),
[Portuguese, Brazilian (pt-BR)](https://crowdin.com/project/sieve/pt-BR),
[Romanian (ro)](https://crowdin.com/project/sieve/ro),
[Russian (ru)](https://crowdin.com/project/sieve/ru),
[Spanish (es-ES)](https://crowdin.com/project/sieve/es-ES),
[Turkish (tr)](https://crowdin.com/project/sieve/tr),
[Ukrainian (uk)](https://crowdin.com/project/sieve/uk).
If you are interested in translating or localizing the 
[Sieve add-on](https://addons.thunderbird.net/addon/sieve/) into your language, 
sign up at [Crowdin](http://crowdin.net/project/sieve/invite) and start 
translating (Crowdin is a free collaborative translation tool). If you added a 
translation please send an email message to `schmid-thomas at gmx.net` or 
[open a ticket](https://github.com/thsmi/sieve/issues), so that the localized 
files can be regenerated.

For more details on contributing refer to the 
[Contributing Guidelines](https://github.com/thsmi/sieve/blob/master/CONTRIBUTING.md).

A big thank you to everyone who has [contributed and supported](CONTRIBUTORS.md) 
the [Sieve add-on](https://addons.thunderbird.net/addon/sieve/) project.

If you want to support the 
[Sieve add-on](https://addons.thunderbird.net/addon/sieve/) project consider 
donating
* code, patches or localizations
* via Paypal [![PayPayl donate button](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=EAS576XCWHKTC "Donate to this project using Paypal")
* via Bitcoin [1GEnrRVobFYuqYj2opdvRQNtG3Z8znvfKw](bitcoin:1GEnrRVobFYuqYj2opdvRQNtG3Z8znvfKw?label=Donation%20for%20Sieve%20Addon)


## Questions and Bugs

The best place to ask questions is on the public mailing list at 
https://groups.google.com/forum/#!forum/sieve-app or by emailing 
sieve-app@googlegroups.com. However, you can also send a private email message 
to `schmid-thomas at gmx.net`.

Concerning bugs please use the 
[issue tracker](https://github.com/thsmi/sieve/issues) or send a private email 
to `schmid-thomas at gmx.net`. You find more details on reporting bugs in the 
[Contributing Guidelines](https://github.com/thsmi/sieve/blob/master/CONTRIBUTING.md)


Please allow 1-2 weeks for a reply. If you did not receive a reply at all, it 
might be a good idea to check your spam filter.


## License

The [Sieve add-on](https://addons.thunderbird.net/addon/sieve/) is free and 
open source software, it is made available to you under the terms of the 
[GNU Affero General Public License (AGPLv3)](http://www.fsf.org/licensing/licenses/agpl-3.0.html).

Refer to 
[Licensing information](https://github.com/thsmi/sieve/blob/master/LICENSING_INFO.md) 
for details.


## Releases

You are looking for the most recent Sieve add-on release?

[Available by downloading the latest stable xpi at the Releases page (release notes can also be viewed)](https://github.com/thsmi/sieve/releases/latest).

**Firefox users: Right-click on the XPI download and select “Save Link As…”; 
otherwise Firefox try to install the add-on into Firefox which will fail.**

The add-on is restartless, so there is no need to restart Thunderbird upon 
installation and uninstallation.

**Sometimes Thunderbird fails to invalidate its cache when updating a restartless 
add-on. The result is the new version is displayed in the add-ons dialog but the 
old cached code is still used. In such cases, uninstall the add-on, then restart 
Thunderbird, restart it again and finally install it again. This ensures the 
cache gets correctly invalidated.** 

## Developments Builds

Are you looking for the latest “bleeding edge” features and willing to risk more 
instability?
Or you might even want to test out newly added code to help identify and debug 
problems?

You can find the development builds also in the 
[release section](https://github.com/thsmi/sieve/releases). They are marked as 
pre-release. They will update to newer releases but not to newer pre-releases.
