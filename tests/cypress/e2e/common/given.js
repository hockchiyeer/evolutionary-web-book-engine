import { Given } from "@badeball/cypress-cucumber-preprocessor";

Given('I navigate to {string} URL and close cookies pop up window', (env) => {
  cy.navigateToUrlAndCloseCookiesPopUp(env);
});

Given('I navigate to {string} URL without closing cookies pop up window', (env) => {
  cy.navigateToUrlWithoutClosingCookiesPopUp(env)
});

Given('I clear Web browser cookies', () => {
  cy.clearCookiesAndStorage();
});

Given('I inject fake OneTrust cookies to the Web browser', () => {
  cy.injectFakeOneTrustCookies();
});

Given('I stub fallback search results using fixture {string}', (fixtureName) => {
  cy.mockFallbackSearchResults(fixtureName);
});

Given('I stub Web-book export handlers', () => {
  cy.stubWebBookExportHandlers();
});
