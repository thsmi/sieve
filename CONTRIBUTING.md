## Bugs and feature request

The preferred way to report bugs and feature request is to use the
[GitHub issue tracker](http://github.com/thsmi/sieve/issues).

But you can also send an email to schmid-thomas at gmx.net

In order to process bugs faster consider the following:

* Try if the [most recent nightly build](https://github.com/thsmi/sieve/blob/master/nightly/README.md) fixes your issue.
 
* Check if you issue is already reported. The list with open issues is small. 
  Try to avoid to duplicate an issue. It slows down the development.

* Include information about your system and server. This means which 
  the operating System you are on. Which Thunderbird release you are using.
  If possible check your server's logs for any related errors.

* Include a debug log/trace with your issue. Just go to the extensions settings 
  and enable debugging options in the Debug tab. Dumping Byte arrays is usually not 
  necessary. Keep in mind that the line starting with "AUTHENTICATE" contains 
  your password. So scramble this line.

* Mention very precisely what went wrong. "X is broken" is not a good bug
  report. What did you expect to happen? What happened instead? If possible 
  describe the exact steps how to reproduce the issue. 


## Contributing translations via crowdin.net

[crowdin](http://www.crowdin.net) is an collaborative translation tool.  

- [Log into you Crowding Account](http://crowdin.net/login) or [join/signup for free](http://crowdin.net/join)
- Join the project http://crowdin.net/project/sieve/invite 
- Translate and vote for translations

I'll copy all crowdin translation prior to a release into the source tree.

## Contributing via Github

- Make sure you have a [GitHub Account](https://github.com/signup/free)
- Fork [Sieve](https://github.com/thsmi/sieve/)
  ([how to fork a repo](https://help.github.com/articles/fork-a-repo))
- Make your changes
- Submit a pull request
([how to create a pull request](https://help.github.com/articles/fork-a-repo))

## Contributing via eMail

Just send me a patch or the changed files via email to schmid-thomas at gmx.net .
