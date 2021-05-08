# TODOs

## Capabilities

We should log and display the SASL capabilities before and after the start tls
Because it is in the meantime common that server do not allow authetnication
unless beeing on a secure channel.

## Resolve disconnect race

A disconnect race is started on referals which makes it randomly fail.

## Show error when deleting active script
No error is displayed when deleting active script

## Trim host name and port in settings
Trim the input fileds otherwise it is too easy that a space sneaks in

## New Script Dialog
Accepts an empty name. The input field need a validator.

## Make exception localizable
throw new SieveClientException("No compatible SASL Mechanism (error.sasl)");

## Connection timeouts not working



// TODO add scram unit test for escaped username/authorization
// ;; UTF8-char except NUL, "=", and ","
// "=" is escaped by =2C and "," by =3D
