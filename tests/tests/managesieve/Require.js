// A dummy used to emulate require.

window.module = {
  "exports": {
  }
};

window.require = function (path) {
  if (path === "./SieveResponse.js")
    return {
      "SieveSimpleResponse": module.exports.SieveSimpleResponse,
      "SieveCapabilitiesResponse": module.exports.SieveCapabilitiesResponse,
      "SieveListScriptResponse": module.exports.SieveListScriptResponse,
      "SieveSaslLoginResponse": module.exports.SieveSaslLoginResponse,
      "SieveSaslCramMd5Response": module.exports.SieveSaslCramMd5Response,
      "SieveGetScriptResponse": module.exports.SieveGetScriptResponse,
      "SieveSaslScramShaResponse": module.exports.SieveSaslScramShaResponse
    };

  if (path === "./SieveResponseCodes.js")
    return {
      "SieveResponseCode": module.exports.SieveResponseCode,
      "SieveResponseCodeSasl": module.exports.SieveResponseCodeSasl,
      "SieveResponseCodeReferral": module.exports.SieveResponseCodeReferral
    };

  if (path === "./SieveCrypto.js")
    return {};

  if (path === "./SieveAbstractRequestBuilder.js")
    return {
      "SieveAbstractRequestBuilder": module.exports.SieveAbstractRequestBuilder
    };

  if (path === "./SieveAbstractResponseParser.js")
    return {
      "SieveAbstractResponseParser": module.exports.SieveAbstractResponseParser
    };

  throw new Error("Missing require" + path);
};

