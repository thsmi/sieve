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

import fs from 'fs';
import path from 'path';
import url from 'url';

import js from "@eslint/js";
import jsdoc from 'eslint-plugin-jsdoc';
import globals from "globals";

const DEFAULT_INDENT = 2;

/**
 * ESLint 9 includes by default all javascript files it can find.
 * Which can easily kill it e.g. when you rename your node_modules folder.
 *
 * Sadly there is only a blacklist for folders but no whitelist.
 * Thus we use some node.js magic to create a white list.
 *
 * @param  {...string} whitelist
 *  the folder and files to keep, everything else will be backlisted.
 * @returns {string[]}
 *  the list of backlisted folders.
 */
function allExcept(...whitelist) {

  const blacklist = new Set();
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

  const files = fs.readdirSync(__dirname);

  for (let file of files) {
    const stats = fs.statSync(path.join(__dirname, file));

    if (stats.isDirectory())
      file += "/";

    blacklist.add(file);
  }

  for (const keeper of whitelist)
    blacklist.delete(keeper);

  return [...blacklist.values()];
}

export default [
  {
    ignores:  allExcept(
      "src/",
      "tests/",
      "tools/",
      "gulp/",
      "gulpfile.mjs",
      "eslint.config.mjs")
  },
  {
    plugins: {
      jsdoc
    },
    settings: {
      "jsdoc": {
        mode: 'jsdoc'
      }
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      ecmaVersion: "latest",
      parserOptions: {
        ecmaFeatures: {
          jsx: false,
          impliedStrict: true
        }
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      "array-callback-return": "error",
      "func-call-spacing": [
        "error",
        "never"
      ],
      "comma-spacing": [
        "error",
        {
          "before": false,
          "after": true
        }
      ],
      "space-infix-ops": "error",
      "keyword-spacing": [
        "error",
        {
          "before": true
        }
      ],
      "indent": [
        "error", DEFAULT_INDENT,
        {
          "SwitchCase": 1
        }
      ],
      "yoda": "error",
      "wrap-iife": [
        "error",
        "inside"
      ],
      "template-curly-spacing": "error",
      "spaced-comment": [
        "error",
        "always"
      ],
      "prefer-const": "warn",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-new-wrappers": "error",
      "no-whitespace-before-property": "error",
      "no-useless-rename": "error",
      "no-useless-computed-key": "error",
      "no-trailing-spaces": "error",
      "strict": ["warn", "function"],
      "no-shadow-restricted-names": "error",
      "no-new-object": "error",
      "no-new-func": "error",
      "no-multi-spaces": "error",
      "no-multi-str": "error",
      "no-new": "error",
      "no-loop-func": "warn",
      "no-lone-blocks": "error",
      "new-parens": "error",
      "eol-last": ["error", "always"],
      "dot-location": ["error", "property"],
      "comma-style": ["error", "last" ],
      "camelcase": "error",
      "comma-dangle": ["error", "never" ],
      "one-var": ["error", "never" ],
      "consistent-this": ["error", "that" ],
      "no-constructor-return": "error",
      "max-depth": "error",
      "eqeqeq": "error",
      "no-class-assign": "warn",
      "no-sequences": "error",
      "no-labels": "error",
      "no-label-var": "error",
      "consistent-return": "error",
      "no-use-before-define": "error",
      "no-else-return": "error",
      "no-empty-pattern": "warn",
      "no-const-assign": "error",
      "no-this-before-super": "warn",
      "no-eq-null": "warn",
      "no-dupe-class-members": "error",
      "no-undef": "error",
      "no-unreachable": "error",
      "no-unused-vars": ["warn", { "varsIgnorePattern": "EXPORTED_SYMBOLS" }],
      "constructor-super": "error",
      "valid-typeof": "warn",
      "no-unreachable-loop": "error",
      "no-promise-executor-return": "error",
      "no-alert": "warn",
      "no-magic-numbers": ["warn", { "ignore": [0], "detectObjects": true }],
      "no-throw-literal": "error",
      "no-var": "error",
      "no-confusing-arrow": "error",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-caller": "error",
      "no-eval": "error",
      "no-extra-label": "error",
      "no-floating-decimal": "error",
      "no-extend-native": "error",
      "no-implied-eval": "error",
      "no-global-assign": "warn",
      "no-implicit-globals": "warn",
      "no-iterator": "error",
      "no-proto": "error",
      "no-redeclare": "error",
      "no-return-assign": "error",
      "no-self-compare": "error",
      "no-self-assign": "error",
      "no-script-url": "error",
      "no-shadow": "warn",
      "no-useless-catch": "warn",
      "no-unused-labels": "error",
      "no-unmodified-loop-condition": "error",
      "no-useless-concat": "error",
      "no-useless-escape": "error",
      "no-useless-call": "error",
      "no-void": "error",
      "no-with": "error",
      "prefer-promise-reject-errors": "error",
      "prefer-spread": "error",
      "radix": "error",
      "no-new-require": "error",
      "linebreak-style": ["error", "unix"],
      "rest-spread-spacing": ["error", "never"],
      "no-inline-comments": "error",
      "no-multi-assign": "error",
      "no-tabs": "error",
      "no-useless-constructor": "error",
      "require-atomic-updates": "warn",
      "semi": ["error", "always"],
      "no-warning-comments": "warn",
      "arrow-body-style": ["error", "always"],
      "arrow-parens": ["error", "always"],
      "arrow-spacing": "error",

      "jsdoc/require-jsdoc": ["error", {
        "exemptEmptyFunctions": false,
        "require": {
          "ClassDeclaration": true,
          "ClassExpression": true,
          "FunctionDeclaration": true,
          "MethodDefinition": true
        }
      }],
      "jsdoc/newline-after-description": "off",
      "jsdoc/valid-types": "warn",
      "jsdoc/no-undefined-types": "off",
      "jsdoc/require-description-complete-sentence": "off",

      "jsdoc/check-param-names": "warn",
      "jsdoc/check-tag-names": "warn",
      "jsdoc/check-types": "warn",
      "jsdoc/require-param": "warn",
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-param-name": "warn",
      "jsdoc/require-param-type": "warn",
      "jsdoc/require-returns-description": "warn",
      "jsdoc/require-returns-type": "warn",
      "jsdoc/require-returns-check": "warn",
      "jsdoc/require-returns": "warn",
      "jsdoc/require-description": "warn",
      "jsdoc/require-example": "off",
      "jsdoc/require-hyphen-before-param-description": "off",

      "jsdoc/check-alignment": "warn"
    }
  }
];
