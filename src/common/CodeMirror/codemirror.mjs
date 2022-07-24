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


/**
 * Useless boilerplate code, only used for packaging code mirror.
 */

import { StreamLanguage } from "@codemirror/language";
import { sieve } from "@codemirror/legacy-modes/mode/sieve";

import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState, Compartment, Transaction } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";

import {
  search, openSearchPanel, closeSearchPanel,
  findPrevious, findNext,
  replaceNext, replaceAll,
  getSearchQuery, setSearchQuery, SearchQuery
} from "@codemirror/search";

import { undo, redo, undoDepth } from "@codemirror/commands";


export {
  EditorView, basicSetup,
  StreamLanguage, sieve,
  EditorState, Compartment, Transaction,
  keymap,
  indentWithTab, indentUnit,

  search, openSearchPanel, closeSearchPanel,
  findPrevious, findNext,
  replaceNext, replaceAll,
  getSearchQuery, setSearchQuery, SearchQuery,
  undo, redo, undoDepth
};
