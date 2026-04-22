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

import {
  id, token,
  tags, parameters,
  tag, string
} from "../../../toolkit/logic/SieveGrammarHelper.mjs";

import { SieveGrammar } from "./../../../toolkit/logic/GenericElements.mjs";

// Usage: report [":headers_only"] <feedback-type: string>
// <message: string> <recipient: string>

SieveGrammar.addTag(
  id("action/report/headers_only", "@action/report/", "vnd.dovecot.report"),
  token(":headers_only"));

SieveGrammar.addAction(
  id("action/report", "@action", "vnd.dovecot.report"),

  token("report"),
  tags(
    tag("headersOnly", "action/report/headers_only")),
  parameters(
    string("feedbackType", "abuse"),
    string("message", "example"),
    string("recipient", "spam-report@example.org")));
