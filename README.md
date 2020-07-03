# Sieve Editor

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
delete and add Sieve scripts with a convenient interface? That is exactly what this sieve editor offers…

![Sieve Editor showing a “Demo” script](https://user-images.githubusercontent.com/2531380/74590832-6efe1480-5012-11ea-8b4e-f7c3e8128824.png)

… it provides an implementation of [A Protocol for Remotely Managing Sieve Scripts (RFC 5804)](https://wiki.tools.ietf.org/html/rfc5804) as well as a graphical editor for [Sieve: An Email Filtering Language (RFC 5228)](https://tools.ietf.org/html/rfc5228)

## History

All started in 2006 as a very simplistic [Thunderbird addon](https://addons.thunderbird.net/addon/sieve/) implementing the manage sieve protocol. But as the years passed by the plaintext editor got more and more features and evolved into a full graphical editor.

Several years ago Mozilla made a strange decision. They dropped their very flexible addon system and copied the extremely limited WebExtensions from Google Chrome. An this ultimately meant for Thunderbird that "classic" addons will go way.

Now in 2020 classic Thunderbird addons are dead. Which meant for the addon it needed to evolve and drop its Thunderbird dependencies. It is now a _portable standalone application_!

## Status

The project is actively developed. The focus shifted from a thunderbird addon to a portable standalone app.

Status and future development plans are described in the [Roadmap](ROADMAP.md). The [Capabilities page](CAPABILITIES.md) contains a list of all supported sieve and manage sieve features.

Project statistics are available at
[Open Hub](https://www.openhub.net/p/tb-sieve).

A big thank you to everyone who has [contributed and supported](CONTRIBUTORS.md) the project.

If you want to support the project consider donating
* code, patches or localizations
* via Paypal [![PayPayl donate button](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.com/paypalme2/thsmi "Donate to this project using Paypal")
* via Bitcoin [1GEnrRVobFYuqYj2opdvRQNtG3Z8znvfKw](bitcoin:1GEnrRVobFYuqYj2opdvRQNtG3Z8znvfKw?label=Donation%20for%20Sieve%20Addon)

## Bugs and Contributing

For more details on contributing refer to the
[Contributing Guidelines](https://github.com/thsmi/sieve/blob/master/CONTRIBUTING.md).

Concerning bug reports please use the
[issue tracker](https://github.com/thsmi/sieve/issues) or send a private email
to `schmid-thomas at gmx.net`. Please read and understand the [Contributing Guidelines](https://github.com/thsmi/sieve/blob/master/CONTRIBUTING.md) before creating an issue.

Give me 1-2 weeks for a reply. If you did not receive a reply at all, it
might be a good idea to check your spam filter.


## License

The code is licensed as free and open source software. It is made available to you under the terms of the
[GNU Affero General Public License (AGPLv3)](http://www.fsf.org/licensing/licenses/agpl-3.0.html).

Refer to
[Licensing information](https://github.com/thsmi/sieve/blob/master/LICENSING_INFO.md)
for details about third party licenses included into this project.


## Releases

You are looking for the most recent release?

[They are by downloading from the Releases page (release notes can also be viewed)](https://github.com/thsmi/sieve/releases).

## Continuous Builds

Continuous builds are triggered upon each change to the master. You can find them in the Azure DevOp Pipeline.

| Windows <br> [![Build Status](https://img.shields.io/azure-devops/tests/thsmi/sieve/4) ![Test Status](https://img.shields.io/azure-devops/build/thsmi/sieve/4)](https://dev.azure.com/thsmi/sieve/_build?definitionId=4&_a=summary&repositoryFilter=1&branchFilter=18) | Linux <br> [![Build Status](https://img.shields.io/azure-devops/tests/thsmi/sieve/2) ![Test Status](https://img.shields.io/azure-devops/build/thsmi/sieve/2)](https://dev.azure.com/thsmi/sieve/_build?definitionId=2&_a=summary&repositoryFilter=1&branchFilter=18) | macOS <br> [![Build Status](https://img.shields.io/azure-devops/tests/thsmi/sieve/6) ![Test Status](https://img.shields.io/azure-devops/build/thsmi/sieve/6)](https://dev.azure.com/thsmi/sieve/_build?definitionId=6&_a=summary&repositoryFilter=1&branchFilter=18) | WebExtension <br>[![Build Status](https://img.shields.io/azure-devops/tests/thsmi/sieve/5) ![Test Status](https://img.shields.io/azure-devops/build/thsmi/sieve/5)](https://dev.azure.com/thsmi/sieve/_build?definitionId=5&_a=summary&repositoryFilter=1&branchFilter=18) |
|---------|-------|-------|--------------|


Click on the test or build status to see more details or to download the build Artifacts. The later can be accessed by selecting a build and then clicking on "Published" in the "Related" section.

## macOS maintainer wanted
We're looking for a contributor willing to help with macOS releases:

1. Fix the automated build pipeline (see https://github.com/thsmi/sieve/blob/master/.azure/macos.yml and https://github.com/thsmi/sieve/issues/313)
2. Test the releases during the alpha/beta phases to iron out potential bugs (~2 releases/year)

If you're using Sieve on macOS to manage your mailbox filters, please consider helping us!
