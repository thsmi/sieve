# FAQ

## App: Change Language

The app uses your operating system language by default.

You can override this via the command line argument "lang".

But keep in mind the language needs to be [supported by electron](https://www.electronjs.org/docs/api/locales)
and the [sieve application](https://crowdin.com/project/sieve).

In case the language is not supported it will fallback to english.

## WebExtension: Change Language

The WebExtension will use Thunderbird's default language.

In case the language is [not supported by the webextension](https://crowdin.com/project/sieve) it will fallback to english.

Thunderbird's default language can be changed in the "Options" select there "Advanced" and locate the "Language" dropdown. Setting languages is only possible on official Thunderbird releases. Nightly version support only en-US.

## WebExtension: How to start

The menu items to open the editor is directly adjacent to the builtin message filters.

Which means in the main menu it is located in "Tools -> Sieve Message Filters" while in the Burger Menu you find it in "Message Filters -> Sieve Message Filters".

## Sieve: Newline Sequence

Occasionally Linux users get confused about the line breaks in sieve script.

Sieve, like in almost all other internet protocols (http, imap, ...), uses a two
character newline sequence CRLF. This sequence dates back to DEC and is also
used on Windows. Unix/Linux use a single LF mostly due to historic reasons.

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

As you can see, using single newlines is illegal syntax in sieve scripts and
has to be rejected by the server. Thus exported scripts may look strange if you
open them in a text editor on macOS or Linux. This is not a bug.
