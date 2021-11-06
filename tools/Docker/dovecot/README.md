# Simplistic Dovecot Docker Container

Provides a docker container to simplify testing and debugging the sieve addon
and webextension against a real mail server.

Dovecot is configured to provide IMAP and Sieve. Only a single user "user" is
configured the password is "pencil" and configured in "/etc/dovecot/users"

Authentication logging is set to verbose to allow debugging problems and
bugs during authentication.
