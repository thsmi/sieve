/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

// TODO the server should provide a json with all basic settings.

import { SieveAbstractAccounts } from "./SieveAbstractAccounts.js";

/**
 * @inheritdoc
 */
class SieveWebAccounts extends SieveAbstractAccounts {

}

export { SieveWebAccounts as SieveAccounts };
