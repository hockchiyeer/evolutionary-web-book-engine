// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import { objects } from '../pageObjects';

const SEARCH_FALLBACK_ROUTE = '**/api/search-fallback*';
const PDF_EXPORT_ROUTE = '**/__pdf';

function normalizeComparableText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if locator is XPath
function isXPath(locatorStr) {
  return locatorStr.startsWith('//') || locatorStr.startsWith('(') || locatorStr.startsWith('./');
}

// Get the actual Element from POM (Page Object Model)
function getElement(page_name, locator_name) {
  const page = page_name.replace(/\s+/g, '');
  const locatorKey = locator_name.replaceAll(' ', '_');

  if (!objects[page] || !objects[page][locatorKey]) {
    throw new Error(`Locator not found: objects['${page}']['${locatorKey}']`);
  }

  const locatorStr = objects[page][locatorKey];

  // Return a Cypress chainable
  if (isXPath(locatorStr)) {
    return cy.xpath(locatorStr, { timeout: 60000 });
  } else {
    return cy.get(locatorStr, { timeout: 60000 });
  }
}

function getRawLocator(page_name, locator_name) {
  const page = page_name.replace(/\s+/g, '');
  const locatorKey = locator_name.replaceAll(' ', '_');
  return objects[page][locatorKey];
}

function buildExportWindowStub() {
  return {
    document: {
      write() {},
      close() {},
    },
    focus() {},
    print() {},
    close() {},
    onload: null,
  };
}

Cypress.Commands.add('injectFakeOneTrustCookies', () => {
  var bannerClosed = 'OptanonAlertBoxClosed';
  var bannerClosedValue = new Date(Date.now() - 60 * 1000).toISOString();
  Cypress.on('window:before:load', (win) => {
    var hostname = win.location.hostname || '';
    var expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    var domainPart = hostname ? `; domain=${hostname}` : '';
    win.document.cookie = `${bannerClosed}=${bannerClosedValue}; expires=${expires}; path=/${domainPart}`;
  });
});

Cypress.Commands.add('clearCookiesAndStorage', () => {
  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
});

Cypress.Commands.add('mockFallbackSearchResults', (fixtureName = 'search-fallback-quantum-physics.json') => {
  cy.fixture(fixtureName).then((payload) => {
    cy.intercept('GET', SEARCH_FALLBACK_ROUTE, {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
    }).as('searchFallback');
  });
});

Cypress.Commands.add('stubWebBookExportHandlers', () => {
  cy.intercept('POST', PDF_EXPORT_ROUTE, {
    statusCode: 200,
    headers: {
      'content-type': 'application/pdf',
    },
    body: 'Mock PDF content',
  }).as('pdfExport');

  cy.window().then((win) => {
    cy.stub(win, 'open').callsFake(() => buildExportWindowStub()).as('windowOpen');
    cy.stub(win.URL, 'createObjectURL').returns('blob:mock-export').as('createObjectURL');
    cy.stub(win.URL, 'revokeObjectURL').as('revokeObjectURL');
    cy.stub(win.HTMLAnchorElement.prototype, 'click').as('downloadClick');
  });
});

Cypress.Commands.add('navigateToUrlAndCloseCookiesPopUp', (url) => {
  cy.viewport(2560, 1440);
  const targetUrl = Cypress.env(url) || Cypress.env('baseUrl') || url;
  cy.visit(targetUrl);
  cy.document().its('readyState').should('eq', 'complete');
  // Generalized cookie closed implementation could be added here if specific popups are known
});

Cypress.Commands.add('navigateToUrlWithoutClosingCookiesPopUp', (url) => {
  cy.viewport(2560, 1440);
  const targetUrl = Cypress.env(url) || Cypress.env('baseUrl') || url;
  cy.visit(targetUrl);
  cy.document().its('readyState').should('eq', 'complete');
});

Cypress.Commands.add('clickOnTheElement', (locator_name, page_name) => {
  getElement(page_name, locator_name).first().click({ force: true });
});

Cypress.Commands.add('clickOnElementContainsText', (locator_name, value, page_name) => {
  getElement(page_name, locator_name).contains(value, { timeout: 60000 }).click({ force: true });
});

Cypress.Commands.add('doubleClickOnTheElement', (locator_name, page_name) => {
  getElement(page_name, locator_name).first().dblclick({ force: true });
});

Cypress.Commands.add('clickUsingTrigger', (locator_name, page_name) => {
  getElement(page_name, locator_name).first().trigger("click");
});

Cypress.Commands.add('enterTheValue', (locator_name, page_name, value) => {
  let selectedValue = Cypress.env(value) || value;
  getElement(page_name, locator_name).clear({ force: true }).type(selectedValue, { force: true });
});

Cypress.Commands.add('selectByValue', (value, locator_name, page_name) => {
  getElement(page_name, locator_name).select(value);
});

Cypress.Commands.add('verifyElementIsVisible', (locator_name, page_name) => {
  getElement(page_name, locator_name).should('be.visible');
});

Cypress.Commands.add('verifyTextIsDisplayed', (locator_name, page_name, value) => {
  const expectedValue = normalizeComparableText(value);

  getElement(page_name, locator_name).should(($element) => {
    const candidates = [
      normalizeComparableText($element.text()),
      normalizeComparableText($element.val()),
      normalizeComparableText($element.html()),
    ];

    const isMatched = candidates.some((candidate) => candidate.includes(expectedValue));
    expect(
      isMatched,
      `Expected ${locator_name} on ${page_name} to contain "${value}"`
    ).to.be.true;
  });
});

Cypress.Commands.add('verifyTextIsNotDisplayed', (locator_name, page_name, value) => {
  const expectedValue = normalizeComparableText(value);

  getElement(page_name, locator_name).should(($element) => {
    const candidates = [
      normalizeComparableText($element.text()),
      normalizeComparableText($element.val()),
      normalizeComparableText($element.html()),
    ];

    const isMatched = candidates.some((candidate) => candidate.includes(expectedValue));
    expect(
      isMatched,
      `Expected ${locator_name} on ${page_name} not to contain "${value}"`
    ).to.be.false;
  });
});

Cypress.Commands.add('verifyElementIsEnabled', (locator_name, page_name) => {
  getElement(page_name, locator_name).should('not.be.disabled');
});

Cypress.Commands.add('verifyElementIsDisabled', (locator_name, page_name) => {
  getElement(page_name, locator_name).should('be.disabled');
});

Cypress.Commands.add('verifyTitle', (title) => {
  const expectedTitle = normalizeComparableText(title);

  cy.title().should((actualTitle) => {
    expect(normalizeComparableText(actualTitle)).to.include(expectedTitle);
  });
});

Cypress.Commands.add('pageContainsText', (text) => {
  cy.contains(text.trim(), { timeout: 60000 }).should("exist");
});

Cypress.Commands.add('pageNotContainsText', (text) => {
  cy.contains(text.trim(), { timeout: 60000 }).should("not.exist");
});
