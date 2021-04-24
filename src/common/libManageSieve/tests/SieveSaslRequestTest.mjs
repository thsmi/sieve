/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 *
 */

/* global net */
const suite = net.tschmid.yautt.test;

if (!suite)
  throw new Error("Could not initialize test suite");

import {
  SieveSaslPlainRequest,
  SieveSaslScramSha1Request,
  SieveSaslScramSha256Request,
  SieveSaslExternalRequest,
  SieveSaslLoginRequest
} from "./../SieveRequest.mjs";

import { SieveRequestBuilder } from "./../SieveRequestBuilder.mjs";
import { SieveResponseParser } from "./../SieveResponseParser.mjs";

const SIMPLE_PASSWORD = "pencil";
const COMPLEX_PASSWORD = "abc§123";
const INSANE_PASSWORD = "f>¤¨&ú/N¸Ýì_`ÛÄ*gÅß]Ö¯Xq¼/±Æ_û.Q*¤ú½kat©z×\\\\®DèÍñ(_d©.Éê³BSv÷{fÊÚõp·ÅähBÏ)YÕý=ýtZ+í(a'8¶Y´HV(m´ûÂ$äK2]*ûöìµ.+^µÈ6ÛðÄ/ÝÉÐo¡%+49";


suite.description(
  "Testing Sasl Mechanisms...");

/**
 * Simulates a request.
 *
 * @param {SieveAbstractRequest} request
 *   the request which should be used.
 * @param {boolean} completed
 *   if true the request is completed after this call.
 * @param {string} expectation
 *   the expected request
 */
async function expectRequest(request, completed, expectation) {

  suite.assertEquals(request.hasNextRequest(), !completed);

  const requestBuilder = new SieveRequestBuilder();
  await request.getNextRequest(requestBuilder);

  suite.assertEquals(requestBuilder.getBytes(), expectation);
}

/**
 * Simulates a response
 *
 * @param {SieveAbstractRequest} request
 *   the request which expects the response.
 * @param {string} expectation
 *   the requests expected response.
 */
async function expectResponse(request, expectation) {
  expectation = Array.from(expectation, (x) => { return x.charCodeAt(0);} );
  await request.onResponse(new SieveResponseParser(expectation));
}

suite.add("SASL Plain", async function() {
  const request = new SieveSaslPlainRequest();

  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user");
  request.setPassword(SIMPLE_PASSWORD);

  await expectRequest(request, true,
    `AUTHENTICATE "PLAIN" "AHVzZXIAcGVuY2ls"\r\n`);

  await expectResponse(request,
    `OK "Logged in."\r\n`);

  suite.assertFalse(request.hasNextRequest());
});

suite.add("SASL Plain with special Characters", async function() {
  const request = new SieveSaslPlainRequest();

  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user2");
  request.setPassword(COMPLEX_PASSWORD);

  await expectRequest(request, true,
    `AUTHENTICATE "PLAIN" "AHVzZXIyAGFiY8KnMTIz"\r\n`);

  await expectResponse(request,
    `OK "Logged in."\r\n`);

  suite.assertFalse(request.hasNextRequest());
});

suite.add("SASL Plain with many Characters", async function() {
  const request = new SieveSaslPlainRequest();

  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user3");
  request.setPassword(INSANE_PASSWORD);

  await expectRequest(request, true,
    `AUTHENTICATE "PLAIN" "AHVzZXIzAGY+wqTCqCbDui9OwrjDncOsX2DDm8OEKmfDhcOfXcOWwq9YccK8L8Kxw4Zfw7suUSrCpMO6wr1rYXTCqXrDl1xcwq5Ew6jDjcOxKF9kwqkuw4nDqsKzQlN2w7d7ZsOKw5rDtXDCt8OFw6RoQsOPKVnDlcO9PcO9dForw60oYSc4wrZZwrRIVihtwrTDu8OCJMOkSzJdKsO7w7bDrMK1LitewrXDiDbDm8Oww4Qvw53DicOQb8KhJSs0OQ=="\r\n`);

  await expectResponse(request,
    `OK "Logged in."\r\n`);

  suite.assertFalse(request.hasNextRequest());
});


suite.add("SASL Scram SHA1 - Short", async function () {
  const request = new SieveSaslScramSha1Request();

  suite.assertEquals(request.getSaslName(), "SCRAM-SHA-1");
  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user");
  request.setPassword(SIMPLE_PASSWORD);

  request.generateNonce = async () => { return "fyko+d2lbbFgONRv9qkxdawL"; };

  // C: n,,n=user,r=fyko+d2lbbFgONRv9qkxdawL
  await expectRequest(request, false,
    `AUTHENTICATE "SCRAM-SHA-1" "biwsbj11c2VyLHI9ZnlrbytkMmxiYkZnT05Sdjlxa3hkYXdM"\r\n`);

  // S: r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096
  await expectResponse(request,
    `"cj1meWtvK2QybGJiRmdPTlJ2OXFreGRhd0wzcmZjTkhZSlkxWlZ2V1ZzN2oscz1RU1hDUitRNnNlazhiZjkyLGk9NDA5Ng=="\r\n`);

  // C: c=biws,r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,p=v0X8v3Bz2T0CJGbJQyF0X+HI4Ts=
  await expectRequest(request, false,
    `"Yz1iaXdzLHI9ZnlrbytkMmxiYkZnT05Sdjlxa3hkYXdMM3JmY05IWUpZMVpWdldWczdqLHA9djBYOHYzQnoyVDBDSkdiSlF5RjBYK0hJNFRzPQ=="\r\n`);

  // S: v=rmF9pqV8S7suAoZWja4dJRkFsKQ=
  await expectResponse(request,
    `OK (SASL "dj1ybUY5cHFWOFM3c3VBb1pXamE0ZEpSa0ZzS1E9")\r\n`);

  suite.assertFalse(request.hasNextRequest());
});

suite.add("SASL Scram SHA1 - Long", async function () {
  const request = new SieveSaslScramSha1Request();

  suite.assertEquals(request.getSaslName(), "SCRAM-SHA-1");
  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user");
  request.setPassword(SIMPLE_PASSWORD);

  request.generateNonce = async () => { return "fyko+d2lbbFgONRv9qkxdawL"; };

  // C: n,,n=user,r=fyko+d2lbbFgONRv9qkxdawL
  await expectRequest(request, false,
    `AUTHENTICATE "SCRAM-SHA-1" "biwsbj11c2VyLHI9ZnlrbytkMmxiYkZnT05Sdjlxa3hkYXdM"\r\n`);

  // S: r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096
  await expectResponse(request,
    `"cj1meWtvK2QybGJiRmdPTlJ2OXFreGRhd0wzcmZjTkhZSlkxWlZ2V1ZzN2oscz1RU1hDUitRNnNlazhiZjkyLGk9NDA5Ng=="\r\n`);

  // C: c=biws,r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,p=v0X8v3Bz2T0CJGbJQyF0X+HI4Ts=
  await expectRequest(request, false,
    `"Yz1iaXdzLHI9ZnlrbytkMmxiYkZnT05Sdjlxa3hkYXdMM3JmY05IWUpZMVpWdldWczdqLHA9djBYOHYzQnoyVDBDSkdiSlF5RjBYK0hJNFRzPQ=="\r\n`);

  // S: v=rmF9pqV8S7suAoZWja4dJRkFsKQ=
  await expectResponse(request,
    `"dj1ybUY5cHFWOFM3c3VBb1pXamE0ZEpSa0ZzS1E9"\r\n`);

  await expectRequest(request, false,
    `""\r\n`);

  await expectResponse(request,
    `OK\r\n`);

  suite.assertFalse(request.hasNextRequest());
});

suite.add("SASL Scram SHA1 with Special Characters - Long", async function () {
  const request = new SieveSaslScramSha1Request();

  suite.assertEquals(request.getSaslName(), "SCRAM-SHA-1");
  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user2");
  request.setPassword(COMPLEX_PASSWORD);

  request.generateNonce = async () => { return "4Gn+oXMVuHyu9RVYooRFMw+x"; };

  // n,,n=user2,r=6cb260fdd390fcb04ae5bd1edf7d25d207db01c9
  // C: n,,n=user,r=fyko+d2lbbFgONRv9qkxdawL
  await expectRequest(request, false,
    `AUTHENTICATE "SCRAM-SHA-1" "biwsbj11c2VyMixyPTRHbitvWE1WdUh5dTlSVllvb1JGTXcreA=="\r\n`);

  // S: r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096
  await expectResponse(request,
    `"cj00R24rb1hNVnVIeXU5UlZZb29SRk13K3hqJy0kZ0g5aXVjRGBDS1dEOCNOWT46TzF2NnI2I25VKDVXSyFEY3ROaj4/Zn40Y0k0QSMiVUB3TjMoMjtdZls/LHM9UUR2V2hqUTJEYjVVUFJ0RFZaYWROZz09LGk9NDA5Ng=="\r\n`);

  // c=biws,r=6cb260fdd390fcb04ae5bd1edf7d25d207db01c9'Uv)RBWr>8Y~8NktH`Y9A$Zh!*'a.Q'%;8=!CS'L[W&K`H3LdOc6uV5+nHG.>(x^,p=4w7qjWbJv2IRU+XcjysMxhJYJUI=
  // C: c=biws,r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,p=v0X8v3Bz2T0CJGbJQyF0X+HI4Ts=
  await expectRequest(request, false,
    `"Yz1iaXdzLHI9NEduK29YTVZ1SHl1OVJWWW9vUkZNdyt4aictJGdIOWl1Y0RgQ0tXRDgjTlk+Ok8xdjZyNiNuVSg1V0shRGN0Tmo+P2Z+NGNJNEEjIlVAd04zKDI7XWZbPyxwPXF4T09ndzRDOFJ5Q25LODQ5Y2hIMU95bEpvaz0="\r\n`);

  // S: v=rmF9pqV8S7suAoZWja4dJRkFsKQ=
  await expectResponse(request,
    `"dj1xem1XN1NSL0FObGVYbnBRSXorckhQOGt4ODA9"\r\n`);

  await expectRequest(request, false,
    `""\r\n`);

  await expectResponse(request,
    `OK\r\n`);

  suite.assertFalse(request.hasNextRequest());
});

suite.add("SASL Scram SHA1 with many special characters - Long", async function () {
  const request = new SieveSaslScramSha1Request();

  suite.assertEquals(request.getSaslName(), "SCRAM-SHA-1");
  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user3");
  request.setPassword(INSANE_PASSWORD);

  request.generateNonce = async () => { return "c96a5d9a095401657971d4ad44c51e0147bf52e3"; };

  await expectRequest(request, false,
    `AUTHENTICATE "SCRAM-SHA-1" "biwsbj11c2VyMyxyPWM5NmE1ZDlhMDk1NDAxNjU3OTcxZDRhZDQ0YzUxZTAxNDdiZjUyZTM="\r\n`);

  await expectResponse(request,
    `"cj1jOTZhNWQ5YTA5NTQwMTY1Nzk3MWQ0YWQ0NGM1MWUwMTQ3YmY1MmUzIyQyezZWazlhKmskTiNQUGsrNFd3djZyYmcjITZobCc4VVxwY0Q/bVRFS2BiSV5+RCJsRXNjXmNmY2Eoai40bSxzPTZlRFlQTUhCZmZKMk9mVVdTTUIxTmc9PSxpPTQwOTY="\r\n`);

  await expectRequest(request, false,
    `"Yz1iaXdzLHI9Yzk2YTVkOWEwOTU0MDE2NTc5NzFkNGFkNDRjNTFlMDE0N2JmNTJlMyMkMns2Vms5YSprJE4jUFBrKzRXd3Y2cmJnIyE2aGwnOFVccGNEP21URUtgYklefkQibEVzY15jZmNhKGouNG0scD1MeFdVZEJBckVPUXZtRHdXbG5oeXBpMDFJN0U9"\r\n`);

  // S: v=rmF9pqV8S7suAoZWja4dJRkFsKQ=
  await expectResponse(request,
    `"dj04ZzdKMUZKY3NsMTF1U0o4NG5ma3p1WXBBSXM9"\r\n`);

  await expectRequest(request, false,
    `""\r\n`);

  await expectResponse(request,
    `OK\r\n`);

  suite.assertFalse(request.hasNextRequest());
});

suite.add("SASL Scram SHA256 - Short", async function () {
  const request = new SieveSaslScramSha256Request();

  suite.assertEquals(request.getSaslName(), "SCRAM-SHA-256");
  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user");
  request.setPassword(SIMPLE_PASSWORD);

  request.generateNonce = async () => { return "rOprNGfwEbeRWgbNEkqO"; };

  // C: n,,n=user,r=fyko+d2lbbFgONRv9qkxdawL
  await expectRequest(request, false,
    `AUTHENTICATE "SCRAM-SHA-256" "biwsbj11c2VyLHI9ck9wck5HZndFYmVSV2diTkVrcU8="\r\n`);

  // S: r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096
  await expectResponse(request,
    `"cj1yT3ByTkdmd0ViZVJXZ2JORWtxTyVodllEcFdVYTJSYVRDQWZ1eEZJbGopaE5sRiRrMCxzPVcyMlphSjBTTlk3c29Fc1VFamI2Z1E9PSxpPTQwOTY="\r\n`);

  // C: c=biws,r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,p=v0X8v3Bz2T0CJGbJQyF0X+HI4Ts=
  await expectRequest(request, false,
    `"Yz1iaXdzLHI9ck9wck5HZndFYmVSV2diTkVrcU8laHZZRHBXVWEyUmFUQ0FmdXhGSWxqKWhObEYkazAscD1kSHpiWmFwV0lrNGpVaE4rVXRlOXl0YWc5empmTUhnc3FtbWl6N0FuZFZRPQ=="\r\n`);

  // S: v=rmF9pqV8S7suAoZWja4dJRkFsKQ=
  await expectResponse(request,
    `OK (SASL "dj02cnJpVFJCaTIzV3BSUi93dHVwK21NaFVaVW4vZEI1bkxUSlJzamw5NUc0PQ==")\r\n`);

  suite.assertFalse(request.hasNextRequest());
});


suite.add("SASL Scram SHA256 - Long", async function () {
  const request = new SieveSaslScramSha256Request();

  suite.assertEquals(request.getSaslName(), "SCRAM-SHA-256");
  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user");
  request.setPassword(SIMPLE_PASSWORD);

  request.generateNonce = async () => { return "rOprNGfwEbeRWgbNEkqO"; };

  // C: n,,n=user,r=fyko+d2lbbFgONRv9qkxdawL
  await expectRequest(request, false,
    `AUTHENTICATE "SCRAM-SHA-256" "biwsbj11c2VyLHI9ck9wck5HZndFYmVSV2diTkVrcU8="\r\n`);

  // S: r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096
  await expectResponse(request,
    `"cj1yT3ByTkdmd0ViZVJXZ2JORWtxTyVodllEcFdVYTJSYVRDQWZ1eEZJbGopaE5sRiRrMCxzPVcyMlphSjBTTlk3c29Fc1VFamI2Z1E9PSxpPTQwOTY="\r\n`);

  // C: c=biws,r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,p=v0X8v3Bz2T0CJGbJQyF0X+HI4Ts=
  await expectRequest(request, false,
    `"Yz1iaXdzLHI9ck9wck5HZndFYmVSV2diTkVrcU8laHZZRHBXVWEyUmFUQ0FmdXhGSWxqKWhObEYkazAscD1kSHpiWmFwV0lrNGpVaE4rVXRlOXl0YWc5empmTUhnc3FtbWl6N0FuZFZRPQ=="\r\n`);

  // S: v=rmF9pqV8S7suAoZWja4dJRkFsKQ=
  await expectResponse(request,
    `"dj02cnJpVFJCaTIzV3BSUi93dHVwK21NaFVaVW4vZEI1bkxUSlJzamw5NUc0PQ=="\r\n`);

  await expectRequest(request, false,
    `""\r\n`);

  await expectResponse(request,
    `OK\r\n`);

  suite.assertFalse(request.hasNextRequest());
});

suite.add("SASL Scram SHA256 with Special Characters - Long", async function () {
  const request = new SieveSaslScramSha256Request();

  suite.assertEquals(request.getSaslName(), "SCRAM-SHA-256");
  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user2");
  request.setPassword(COMPLEX_PASSWORD);

  request.generateNonce = async () => { return "uGzHUcuMpP47rPcnmk3+WiMU"; };

  // C: n,,n=user,r=fyko+d2lbbFgONRv9qkxdawL
  await expectRequest(request, false,
    `AUTHENTICATE "SCRAM-SHA-256" "biwsbj11c2VyMixyPXVHekhVY3VNcFA0N3JQY25tazMrV2lNVQ=="\r\n`);

  // S: r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,s=QSXCR+Q6sek8bf92,i=4096
  await expectResponse(request,
    `"cj11R3pIVWN1TXBQNDdyUGNubWszK1dpTVVMVWUzXz9LN1BFKzk0ZUo4cjNPZjplfis7RjIla2k/fUFfPC5zTypuUHxbR2hCUWRcWFgyQmsyLVBdejkkZiNdLHM9RVZodlRpZ2swWTRnNWljTzJQMDZDdz09LGk9NDA5Ng=="\r\n`);

  // C: c=biws,r=fyko+d2lbbFgONRv9qkxdawL3rfcNHYJY1ZVvWVs7j,p=v0X8v3Bz2T0CJGbJQyF0X+HI4Ts=
  await expectRequest(request, false,
    `"Yz1iaXdzLHI9dUd6SFVjdU1wUDQ3clBjbm1rMytXaU1VTFVlM18/SzdQRSs5NGVKOHIzT2Y6ZX4rO0YyJWtpP31BXzwuc08qblB8W0doQlFkXFhYMkJrMi1QXXo5JGYjXSxwPTU4SUE3TWt3OXhBUUxVTGdvc3dVaTNEM1M3QkdMRkpwTVd3N3p0a3gwVjA9"\r\n`);

  // S: v=rmF9pqV8S7suAoZWja4dJRkFsKQ=
  await expectResponse(request,
    `"dj1wZVI4RWI2dU5mNFpkN0h6SjB2N09CZy9DNWN4cEtWdU1SeDNsY25hT2hFPQ="\r\n`);

  await expectRequest(request, false,
    `""\r\n`);

  await expectResponse(request,
    `OK\r\n`);

  suite.assertFalse(request.hasNextRequest());
});

suite.add("SASL Scram SHA256 with many special characters - Long", async function () {
  const request = new SieveSaslScramSha256Request();

  suite.assertEquals(request.getSaslName(), "SCRAM-SHA-256");
  suite.assertTrue(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("user3");
  request.setPassword(INSANE_PASSWORD);

  request.generateNonce = async () => { return "fc88adb75eb0151cfbc116b6cca317343b08b68a1411a889c77d60df9180cf95"; };

  await expectRequest(request, false,
    `AUTHENTICATE "SCRAM-SHA-256" "biwsbj11c2VyMyxyPWZjODhhZGI3NWViMDE1MWNmYmMxMTZiNmNjYTMxNzM0M2IwOGI2OGExNDExYTg4OWM3N2Q2MGRmOTE4MGNmOTU="\r\n`);

  await expectResponse(request,
    `"cj1mYzg4YWRiNzVlYjAxNTFjZmJjMTE2YjZjY2EzMTczNDNiMDhiNjhhMTQxMWE4ODljNzdkNjBkZjkxODBjZjk1OEwhdEg3XG1xeSJCXEc+UEU7Py0pTjhTZkdRd1BqbXwrLUBeXl4rcExPcy1meEoyQFRcIUtOVFZRcH54cysqUixzPVBSNU5iSWtPWDMzUHVHMHhhck1NMVE9PSxpPTQwOTY="\r\n`);

  await expectRequest(request, false,
    `"Yz1iaXdzLHI9ZmM4OGFkYjc1ZWIwMTUxY2ZiYzExNmI2Y2NhMzE3MzQzYjA4YjY4YTE0MTFhODg5Yzc3ZDYwZGY5MTgwY2Y5NThMIXRIN1xtcXkiQlxHPlBFOz8tKU44U2ZHUXdQam18Ky1AXl5eK3BMT3MtZnhKMkBUXCFLTlRWUXB+eHMrKlIscD1ERUw2RGh0bTV5VDg3QWNZRDRuNHNNbjhwZmlnamF2dGpFRURMZ0ROUHc4PQ=="\r\n`);

  // S: v=rmF9pqV8S7suAoZWja4dJRkFsKQ=
  await expectResponse(request,
    `"dj1zcndEdFRzWmxQQlVuSFk0Vko4UzVNZ0gxaEx6UU9rS1lVREFoNHdqK0pZPQ=="\r\n`);

  await expectRequest(request, false,
    `""\r\n`);

  await expectResponse(request,
    `OK\r\n`);

  suite.assertFalse(request.hasNextRequest());
});

suite.add("SASL External", async function() {
  const request = new SieveSaslExternalRequest();

  suite.assertTrue(request.isAuthorizable());
  suite.assertFalse(request.hasPassword());

  await expectRequest(request, true,
    `AUTHENTICATE "EXTERNAL" ""\r\n`);

  await expectResponse(request,
    `OK\r\n`);

  suite.assertFalse(request.hasNextRequest());

});

suite.add("SASL Login", async function() {
  const request = new SieveSaslLoginRequest();

  suite.assertFalse(request.isAuthorizable());
  suite.assertTrue(request.hasPassword());

  request.setUsername("blubb");
  request.setPassword("bla");

  await expectRequest(request, false,
    'AUTHENTICATE "LOGIN"\r\n');

  // Server responds with a "VXNlcm5hbWU6" which is a "USERNAME:"
  await expectResponse(request,
    '"VXNlcm5hbWU6"\r\n');

  // Client sends the username, Ymx1YmI= equals blubb
  await expectRequest(request, false,
    '"Ymx1YmI="\r\n');

  // Server responds with a "UGFzc3dvcmQ6" which is a "PASSWORD:"
  await expectResponse(request,
    '"UGFzc3dvcmQ6"\r\n');

  // Client sends the password, "Ymxh" equals bla
  await expectRequest(request, false,
    '"Ymxh"\r\n');

  await expectResponse(request,
    `OK\r\n`);

  suite.assertFalse(request.hasNextRequest());

});
