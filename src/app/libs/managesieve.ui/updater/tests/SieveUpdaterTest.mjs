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

import { SieveUpdater } from "./../SieveUpdater.mjs";

const NUMBER_SIX = 6;

suite.add("Major Version Bump", function () {
  suite.assertFalse((new SieveUpdater()).isOlder("6", "5.5.4"));
  suite.assertFalse((new SieveUpdater()).isOlder("6.5", "5.5.4"));
  suite.assertFalse((new SieveUpdater()).isOlder("6.5.4", "5.5.4"));

  suite.assertTrue((new SieveUpdater()).isOlder("6.5.4", "7.5.4"));

  suite.assertTrue((new SieveUpdater()).isOlder("6.5.4", "a.b.c"));
  suite.assertFalse((new SieveUpdater()).isOlder("a.b.c", "6.5.4"));
});

suite.add("Minor Version Bump", function () {
  suite.assertFalse((new SieveUpdater()).isOlder("6.5", "6.4.4"));
  suite.assertFalse((new SieveUpdater()).isOlder("6.5.4", "6.4.4"));
  suite.assertTrue((new SieveUpdater()).isOlder("6.5.4", "6.6.4"));

  suite.assertTrue((new SieveUpdater()).isOlder("6.5.4", "6.b.c"));
  suite.assertFalse((new SieveUpdater()).isOlder("6.b.c", "6.5.4"));
});

suite.add("Patch Version Bump", function () {
  suite.assertFalse((new SieveUpdater()).isOlder("6.5.4", "6.5.3"));
  suite.assertTrue((new SieveUpdater()).isOlder("6.5.4", "6.5.5"));

  suite.assertTrue((new SieveUpdater()).isOlder("6.5.4", "6.5.c"));
  suite.assertFalse((new SieveUpdater()).isOlder("6.5.c", "6.5.4"));
});

suite.add("No Version Bump", function () {
  suite.assertTrue((new SieveUpdater()).isOlder("6.5.4", "6.5.4"));
});


suite.add("Manifest - Does not contain any versions", function () {
  const manifest = {
    "addons": {
      "sieve@mozdev.org": {
        "updates": []
      }
    }
  };

  suite.assertFalse((new SieveUpdater()).compare(manifest, "6.5.4"));
});

suite.add("Manifest - Has newer version", function () {
  const manifest = {
    "addons": {
      "sieve@mozdev.org": {
        "updates": [
          { "version": "5.6.7" },
          { "version": "1.2.3" },
          { "version": "2.3.4" }
        ]
      }
    }
  };

  suite.assertTrue((new SieveUpdater()).compare(manifest, "4.5.6"));
});

suite.add("Manifest - Same version", function () {
  const manifest = {
    "addons": {
      "sieve@mozdev.org": {
        "updates": [
          { "version": "5.6.7" },
          { "version": "1.2.3" },
          { "version": "2.3.4" }
        ]
      }
    }
  };

  suite.assertFalse((new SieveUpdater()).compare(manifest, "5.6.7"));
});

suite.add("Manifest - Only older versions", function () {
  const manifest = {
    "addons": {
      "sieve@mozdev.org": {
        "updates": [
          { "version": "5.6.7" },
          { "version": "1.2.3" },
          { "version": "2.3.4" }
        ]
      }
    }
  };

  suite.assertFalse((new SieveUpdater()).compare(manifest, "5.6.8"));
});

suite.add("Comparator - greater than", function () {
  // Numeric comparison
  suite.assertTrue((new SieveUpdater()).isGreaterThan("6", "5"));
  suite.assertFalse((new SieveUpdater()).isGreaterThan("6", "6"));
  suite.assertFalse((new SieveUpdater()).isGreaterThan("6", "7"));

  // String Comparison in Unicode order
  suite.assertTrue((new SieveUpdater()).isGreaterThan("B", "A"));
  suite.assertTrue((new SieveUpdater()).isGreaterThan("AA", "A"));
  suite.assertFalse((new SieveUpdater()).isGreaterThan("A", "A"));
});

suite.add("Comparator - smaller than", function () {
  // Numeric comparison
  suite.assertTrue((new SieveUpdater()).isLessThan("6", "7"));
  suite.assertFalse((new SieveUpdater()).isLessThan("6", "6"));
  suite.assertFalse((new SieveUpdater()).isLessThan("6", "5"));

  // String Comparison in Unicode order
  suite.assertTrue((new SieveUpdater()).isLessThan("A", "B"));
  suite.assertTrue((new SieveUpdater()).isLessThan("A", "AA"));
  suite.assertFalse((new SieveUpdater()).isLessThan("A", "A"));
});

suite.add("Int conversion", function () {
  suite.assertEquals((new SieveUpdater()).getInt("6"), NUMBER_SIX);
  suite.assertEquals((new SieveUpdater()).getInt("6.5"), NUMBER_SIX);
  suite.assertEquals((new SieveUpdater()).getInt("6,5"), NUMBER_SIX);
  suite.assertNaN((new SieveUpdater()).getInt("A"));
});
