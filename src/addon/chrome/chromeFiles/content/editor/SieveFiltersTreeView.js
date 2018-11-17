/*
 * The contents of this file are licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

(function (exports) {

  "use strict";

  // This is our custom view, based on the treeview interface

  function SieveTreeView(rules, listener) {
    this.listener = listener;
    this.rules = rules;
    this.rowCount = rules.length;
  }

  SieveTreeView.prototype.update
    = function (rules) {
      this.rules = rules;
      this.rowCount = this.rules.length;

      this.rules.sort(function (a, b) {
        return a.script.toLocaleLowerCase().localeCompare(b.script.toLocaleLowerCase());
      });
    };

  SieveTreeView.prototype.getCellValue
    = function (row, column) {
      if (column.id === "namecol")
        return this.rules[row].script;

      return this.rules[row].active;
    };

  SieveTreeView.prototype.getCellText
    = function (row, column) {
      if (column.id === "namecol")
        return this.rules[row].script;

      return "";
    };

  SieveTreeView.prototype.setTree
    = function (treebox) { this.treebox = treebox; };

  SieveTreeView.prototype.isContainer
    = function () { return false; };

  SieveTreeView.prototype.isSeparator
    = function () { return false; };

  SieveTreeView.prototype.isSorted
    = function () { return false; };

  SieveTreeView.prototype.getLevel
    = function () { return 0; };

  SieveTreeView.prototype.getImageSrc
    = function (row, column) {
      if (column.id === "namecol")
        return null;

      if (this.rules[row].active)
        return "chrome://sieve/content/images/active.png";

      return "chrome://sieve/content/images/passive.png";
    };

  SieveTreeView.prototype.getRowProperties
    = function () { };

  SieveTreeView.prototype.getCellProperties
    = function () { };

  SieveTreeView.prototype.getColumnProperties
    = function () { };

  SieveTreeView.prototype.cycleHeader
    = function () { };

  SieveTreeView.prototype.cycleCell
    = function (row, col) {
      this.listener(row, col, this.rules[row].script, this.rules[row].active);
      this.selection.select(row);
    };

  exports.SieveTreeView = SieveTreeView;

})(window);
