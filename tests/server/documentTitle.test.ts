import assert from 'node:assert/strict';
import { DEFAULT_DOCUMENT_TITLE, getWebBookDocumentTitle } from '../../src/services/documentTitle.ts';

assert.equal(
  getWebBookDocumentTitle('Climate Change'),
  'Climate Change',
  'A real Web-book topic should become the browser document title.'
);

assert.equal(
  getWebBookDocumentTitle('  Sustainable Cities  '),
  'Sustainable Cities',
  'Whitespace around the topic should be trimmed before being used as a title.'
);

assert.equal(
  getWebBookDocumentTitle(''),
  DEFAULT_DOCUMENT_TITLE,
  'Blank topics should fall back to the app title.'
);

assert.equal(
  getWebBookDocumentTitle(undefined),
  DEFAULT_DOCUMENT_TITLE,
  'Missing topics should fall back to the app title.'
);

console.log('documentTitle regression checks passed');
