# Roadmap

## Current status

The addon implements the complete manage sieve protocol and the code base is rather stable. All common SASL algoithms are supported, with one exception GSSAPI.
So there is not much to do here.

Concerning the graphical sieve editor there is definitely space for improvement. Which will be addresses with the next "generation parser".

The big question mark is currently thunderbird. It try to maintain compatibility as long as possible. In case the developers descide to drop "classic" addons, it means the end of the thunderbird addon. When and if this appens is currently completely unpredicatable.

So a plan B is needed. Which means porting the addon to an electron based standalone app.

There is no hard roadmap which will be done next. But you can find a rough planning at https://github.com/thsmi/sieve/projects

## Status: Next generation Parser

The graphical editor support just the very basic sieve syntax. Most of the parsing is hardcoded instead of using a generic parser.
But this is addressed by the "next gerneration parser". It is designed to be pluggable and allows an very easy way of extending the graphical editor.

Currently the parser works acceptable but still has issues which needs to be addressed.

The graphical editors ui is completely inconsistend. Some UI elements are instant apply otherone need to be confirmed.
So this needs to be updated to a modern ui framework like bootstrap. As this is a long running task, the plan is to updated the UI dialog by dialog as soon as the parser lands.

## Status: Thunderbird Addon

Thunderbird's future is currently in a constant [up and down](
https://blog.mozilla.org/thunderbird/2017/12/new-thunderbird-releases-and-new-thunderbird-staff/). They are doing a great job to keep it alive but they obviously don't have the resources for further development.

Firefox dropped recently all support for so called classic XUL addons. As Thunderbird shares a common codebase it means they either they descide to splitup from Firefox or the XUL addons have to die.

Firefox's new way are WebExtension. Sadly they are designed very single minded and are extremely limited. Implementing something with a non http based protocol a sieve client is simply impossible, as they do not provide apis needed for socket connections. All request from developers to support sockets in webextension have been turned down, ignored and denied. But it seems as if a miracle happened and a paradigm shift started. At least the relevant bug moved from a [denied feature request to an approved feature request](http://www.agmweb.ca/2017-12-21-design-decision/). Whatever this means.

So the worst case scenario would be, Thunderbird descides to drop classic addons while webextensions still do not support sockets.
The best case would be, Mozilla add socket support to webextensions, so that this addon can be converted.

As you can see there are lots of ifs and whens. So it is a time for a alterntive plan.

## Status Electron App

Electron is one of the new kids on the block and the new rising star in the JavaScript universe. It is a stripped down chromium browser bundeled with node.js. It supports complex javascript apis with almost no limitation, virtually only the sky is the limit. Quite the opposite of a WebExtension.

You have most likely already used electron based application without knowing it. They are more common than you think.

The plan is to evolve the current codebase to a standalone application while keeping backward compatibility with the addon. Most of the basic functions are already ported and much of the code is reused. So that both the a native electron application and the thunderbird based addon can life side by side and have a shared codebase.

Electron does not support xul which means all the UI needs to be redone in HTML. In order to avoid maintaining two UIs this change will be backported to thunderbird. So expect some major UI changes.

The electron app will be released side by side with the addon.