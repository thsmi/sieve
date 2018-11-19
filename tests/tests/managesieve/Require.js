// A dummy used to emulate require.

window.module = {
  "exports": {
  }
};

window.require = function (path) {

  "use strict";

  if (path === "./SieveResponse.js") {

    if (!module.exports.SieveSimpleResponse)
      throw new Error("SieveResponse.js not loaded");

    return {
      "SieveSimpleResponse": module.exports.SieveSimpleResponse,
      "SieveCapabilitiesResponse": module.exports.SieveCapabilitiesResponse,
      "SieveListScriptResponse": module.exports.SieveListScriptResponse,
      "SieveSaslLoginResponse": module.exports.SieveSaslLoginResponse,
      "SieveSaslCramMd5Response": module.exports.SieveSaslCramMd5Response,
      "SieveGetScriptResponse": module.exports.SieveGetScriptResponse,
      "SieveSaslScramShaResponse": module.exports.SieveSaslScramShaResponse
    };
  }

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

  if (path === "./SieveMozRequestBuilder.js")
    return {
      "SieveMozRequestBuilder": module.exports.SieveMozRequestBuilder
    };

  if (path === "./SieveAbstractResponseParser.js")
    return {
      "SieveAbstractResponseParser": module.exports.SieveAbstractResponseParser
    };

  if (path === "./SieveMozResponseParser.js")
    return {
      "SieveMozResponseParser": module.exports.SieveMozResponseParser
    };

  if (path === "./SieveRequest.js") {
    if (!module.exports.SieveSetActiveRequest)
      throw new Error("SieveRequest.js not loaded");

    return {
      "SieveSetActiveRequest": module.exports.SieveSetActiveRequest,
      "SievePutScriptRequest": module.exports.SievePutScriptRequest,
      "SieveGetScriptRequest": module.exports.SieveGetScriptRequest,
      "SieveNoopRequest": module.exports.SieveNoopRequest,
      "SieveCapabilitiesRequest": module.exports.SieveCapabilitiesRequest,
      "SieveSaslPlainRequest": module.exports.SieveSaslPlainRequest,
      "SieveSaslCramMd5Request": module.exports.SieveSaslCramMd5Request,
      "SieveSaslScramSha1Request": module.exports.SieveSaslScramSha1Request,
      "SieveSaslScramSha256Request": module.exports.SieveSaslScramSha256Request,
      "SieveSaslExternalRequest": module.exports.SieveSaslExternalRequest,
      "SieveSaslLoginRequest": module.exports.SieveSaslLoginRequest,
      "SieveInitRequest": module.exports.SieveInitRequest,
      "SieveCheckScriptRequest": module.exports.SieveCheckScriptRequest,
      "SieveLogoutRequest": module.exports.SieveLogoutRequest,
      "SieveStartTLSRequest": module.exports.SieveStartTLSRequest,
      "SieveDeleteScriptRequest": module.exports.SieveDeleteScriptRequest,
      "SieveRenameScriptRequest": module.exports.SieveRenameScriptRequest,
      "SieveListScriptRequest": module.exports.SieveListScriptRequest
    };
  }

  throw new Error("Missing require" + path);
};
