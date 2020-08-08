# FAQ

## App: Change Language

The app uses your operating system language by default.

You can override this via the command line argument "lang".

But keep in mind the language needs to be [supported by electron](https://www.electronjs.org/docs/api/locales)
and the [sieve application](https://crowdin.com/project/sieve).

In case the language is not supported it will fallback to english.

## App: macOS Builds

If you are a macOS user you need to (build)[BUILD.md] it on your own. Follow the prerequisites and run `gulp app:package-macos`.

Currently on the Azure Pipeline is commented as it fails in the final packaging step. It is most likely easy to fix. But you need to debug it on a macOS as the very same code works without issues on a windows and linux machine. See [Issue #312](https://github.com/thsmi/sieve/issues/313) for more details.

I don't own a mac, which means I can neither test, debug aw well as support macOS builds.

So there won't be any macOS builds unless someone steps up, fixes the build pipeline and provides tested builds for releases.

If you are using Sieve on macOS to manage your mailbox filters, consider contributing.

## WebExtension: Change Language

The WebExtension will use Thunderbird's default language.

In case the language is [not supported by the webextension](https://crowdin.com/project/sieve) it will fallback to english.

Thunderbird's default language can be changed in the "Options" select there "Advanced" and locate the "Language" dropdown. Setting languages is only possible on official Thunderbird releases. Nightly version support only en-US.

## WebExtension: How to install a side loaded WebExtension

Currently the review process for addons.thunderbird.net is extremely slow. It takes several
month until an update is listed. Thus you may want to install the addon directly from this repository.

Download the latest release from the [releases section](https://github.com/thsmi/sieve/releases).

If you are a Firefox user, you need to right click on the "Thunderbird WebExtension" link and select "Save Link As" otherwise Firefox tries to install the WebExtension into your browser and ends with an error message.

In Thunderbird you need to open the add-on manager. Either via the burger menu or via the main menu bar (Tools -> Add-ons). Then just drag the downloaded xpi file into the add-on Manager. You can also select the gear icon in the add-on manager and select "Install add-on from file" as illustrated below.

![image](https://user-images.githubusercontent.com/53547181/84571294-61f2f700-ad60-11ea-94b9-71fe94db739e.png)

## WebExtension: How to start

The menu items to open the editor is directly adjacent to the builtin message filters.

Which means in the main menu it is located in "Tools -> Sieve Message Filters" while in the Burger Menu you find it in "Message Filters -> Sieve Message Filters".

## Sieve: Newline Sequence

Occasionally Linux users get confused about the line breaks in sieve script.

Sieve, like in almost all other internet protocols (http, imap, ...), uses a two character newline sequence CRLF. This sequence dates back to DEC and is also used on Windows. Unix/Linux use a single LF mostly due to historic reasons.

[RFC5228](https://tools.ietf.org/html/rfc5228) defines:

```
2.2.  Whitespace

   Whitespace is used to separate tokens.  Whitespace is made up of
   tabs, newlines (CRLF, never just CR or LF), and the space character.
   The amount of whitespace used is not significant.

[...]

8.1.  Lexical Token

   [...]

   Blanks, horizontal tabs, CRLFs, and comments ("whitespace") are
   ignored except as they separate tokens.  Some whitespace is required
   to separate otherwise adjacent tokens and in specific places in the
   multi-line strings.  CR and LF can only appear in CRLF pairs.

```

Using single newlines is illegal syntax in sieve scripts and has to be rejected by the server. Thus exported scripts may look strange if you open them in a text editor on macOS or Linux. This is not a bug.
