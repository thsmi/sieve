# FAQ

## Change Application Language

The app uses your operating system language by default.

You can override this via the command line argument "lang".

But keep in mind the language needs to be [supported by electron](https://www.electronjs.org/docs/api/locales)
and the [sieve application](https://crowdin.com/project/sieve).

In case the language is not supported it will fallback to english.

## Change WebExtension Language

The WebExtension will use Thunderbird's default language.

In case the language is [not supported by the webextension](https://crowdin.com/project/sieve) it will fallback to english.

Thunderbird's default language can be changed in the "Options" select there "Advanced" and locate the "Language" dropdown. Setting languages is only possible on official Thunderbird releases. Nightly version support only en-US.