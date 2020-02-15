# Capabilities

"Manage sieve" and "Sieve" are both open standard published by the RFC.

## Manage Sieve

Manage Sieve is a protocol for remotely managing sieve scripts on a server.

The protocol itself is specified in:
* [A Protocol for Remotely Managing Sieve Scripts (RFC 5804)](https://wiki.tools.ietf.org/html/rfc5804).

Currently supported authentication mechanisms are:
* SASL CRAM MD5
* SASL Login
* SASL Plain
* [SASL SCRAM SHA1](https://tools.ietf.org/html/rfc5802)
* [SASL SCRAM SHA256](https://tools.ietf.org/html/rfc7677)

Other authentication mechanisms may be added by request.

## Sieve

Sieve is a filter language run directly on the mail server whenever an new message arrives.

All implementations are required to support the basic command set as specified in:
* [Sieve: An Email Filtering Language (RFC 5228)](https://tools.ietf.org/html/rfc5228)


The server may provide additional language extensions to a client. Currently the following extensions are supported.

* [Sieve Email Filtering: Body Extension](https://tools.ietf.org/rfc/rfc5173)
* [Sieve Extension for Converting Messages before Delivery](https://tools.ietf.org/rfc/rfc6558.txt)
* [Sieve Extension: Copying Without Side Effects](https://tools.ietf.org/rfc/rfc3894.txt)
* [Sieve Email Filtering: Date and Index Extensions](https://tools.ietf.org/rfc/rfc5260.txt)
* [Sieve Email Filtering: Detecting Duplicate Deliveries](https://tools.ietf.org/rfc/rfc7352.txt)
* [Sieve Email Filtering: Editheader Extension](https://tools.ietf.org/rfc/rfc5293.txt)
* [Sieve Email Filtering: Environment Extension](https://tools.ietf.org/rfc/rfc5183.txt)
* [Sieve Email Filtering: Imap4flags Extension](https://tools.ietf.org/rfc/rfc5232.txt)
* [Sieve Email Filtering: Include Extension](https://tools.ietf.org/rfc/rfc6609.txt)
* [The Sieve Mail-Filtering Language -- Extensions for Checking Mailbox Status and Accessing Mailbox Metadata](https://tools.ietf.org/rfc/rfc5490.txt)
* [Sieve Email Filtering: Extension for Notifications](https://tools.ietf.org/rfc/rfc5435.txt)
* [Sieve Email Filtering: Regular Expression Extension](https://tools.ietf.org/id/draft-ietf-sieve-regex-01.txt)
* [Sieve Email Filtering: Reject and Extended Reject Extensions](https://tools.ietf.org/rfc/rfc5429.txt)
* [Sieve Email Filtering: Relational Extension](https://tools.ietf.org/rfc/rfc5231)
* [Sieve Email Filtering: Spamtest and Virustest Extensions](https://tools.ietf.org/rfc/rfc5235.txt)
* [Sieve Email Filtering: Regular Expression Extension](https://tools.ietf.org/id/draft-ietf-sieve-regex-01.txt)
* [Sieve Email Filtering: Subaddress Extension](https://tools.ietf.org/rfc/rfc5233.txt)
* [Sieve Email Filtering: Vacation Extension](https://tools.ietf.org/rfc/rfc5230.txt)
* [Sieve Vacation Extension: "Seconds" Parameter](https://tools.ietf.org/rfc/rfc6131.txt)
* [Sieve Email Filtering: Variables Extension](https://tools.ietf.org/rfc/rfc5229.txt)

Keep in mind the server needs to support and actively advertise the extension via the capabilities before it can be used by the client.

Most servers support only a tiny subset of the extensions above.