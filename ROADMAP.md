# Roadmap

Thunderbird 68.x was a devastating hit on this addon. And made the inevitable clear, "classic" addons are gone and won't come back.

Luckily the [Plan B](https://en.wikipedia.org/wiki/Contingency_plan) - porting the add-on to an Electron based standalone app - worked out quite good. The app is still a bit rough but quite usable.

## Status: [Electron App](https://github.com/thsmi/sieve/projects/3)

[Electron](https://electronjs.org/) is one of the new kids on the block and the new rising star in the JavaScript universe. It is a stripped down Chromium browser bundled with [Node.js](https://nodejs.org/). It supports complex JavaScript APIs with almost no limitation, virtually the sky is the limit. Quite the opposite of [WebExtensions](https://developer.mozilla.org/en-US/Add-ons/WebExtensions).

You have most likely already used Electron based applications without knowing it. They are more common than you think.

All basic functionally is ported from the classic thunderbird addon. There are still som UI glitches and has not yes reached parity with the addon. Still lots of space for improvement e.g. the logging, the error management, i18n support, a password manager, an installer ...

## Status: Thunderbird WebExtension

Unexpected things happen time by time. There is new hope for a Thunderbird WebExtension. The classic addon is still dead won't come back.

The Thunderbird guys decided to remove a very silly WebExtension limitation. Until recently so called "WebExtension Experiments" could only be used on developer and nightly builds.

But this silly limitation was lifted. Which basically brings back lots of the flexibility of classic addons. And porting the app back to a WebExtension seems to be reasonable.

So I started out of curiosity an experiment in porting the Electron app back to a Thunderbird WX. It is an experiment and far away from something releasable.

But there are still lost of ifs an whens. Especially the future of "WebExtension Experiments" in undefined.

## Status: Core

The manage sieve core implements the complete [RFC 5804 (A Protocol for Remotely Managing Sieve Scripts)](https://wiki.tools.ietf.org/html/rfc5804) and the code base is rather stable. All common [SASL (Simple Authentication and Security Layer)](https://en.wikipedia.org/wiki/Simple_Authentication_and_Security_Layer) algorithms are supported, with one exception [GSSAPI (Generic Security Services Application Program Interface)](https://en.wikipedia.org/wiki/Generic_Security_Services_Application_Program_Interface).

The core has proven to be very stable. Porting from Thunderbird to Electron required, other than expected, only minimal changes. So there is not much left to do here.

The graphical sieve editor dramatically improved when the next generation parser landed. And is also in a stable state and works well. It has still minor issues which need to be addressed, but nothing too important.

Refer to [capabilities](capabilities.md) for a complete list of all implemented sieve and manage sieve features.