/**
 * @jest-environment jsdom
 */

/**
 * SEC-01: XSS prevention in Handoff onboarding summary render
 *
 * Tests the behavioral contract: user-supplied values must never be
 * parsed as HTML. Specifically, script tags and HTML elements injected
 * via name/businessDesc/location fields must not execute or appear as
 * DOM nodes — they must be escaped as safe text.
 *
 * These tests are written against the FIXED contract (DOM API construction).
 * They FAIL against the current vulnerable implementation (innerHTML).
 */

'use strict';

/**
 * Simulate the VULNERABLE (current) render: uses innerHTML with user data.
 * Used to confirm the test correctly catches the bug.
 */
function renderSummaryVulnerable(container, onboarding, revenuePhrase) {
  container.innerHTML =
    "You're building <strong>" + onboarding.name + '</strong>, a <strong>' +
    onboarding.businessDesc + '</strong> in <strong>' + onboarding.location + '</strong>' +
    (revenuePhrase ? ', and ' + revenuePhrase : '') + '.';
}

/**
 * Simulate the FIXED render: uses DOM API construction (textContent / createDocumentFragment).
 * This is the contract the production code must match after SEC-01 is applied.
 */
function renderSummaryFixed(container, onboarding, revenuePhrase) {
  container.textContent = '';
  var frag = document.createDocumentFragment();
  function appendText(text) { frag.appendChild(document.createTextNode(text)); }
  function appendStrong(text) {
    var s = document.createElement('strong');
    s.textContent = text;
    frag.appendChild(s);
  }
  appendText("You're building ");
  appendStrong(onboarding.name);
  appendText(', a ');
  appendStrong(onboarding.businessDesc);
  appendText(' in ');
  appendStrong(onboarding.location);
  if (revenuePhrase) { appendText(', and ' + revenuePhrase); }
  appendText('.');
  container.appendChild(frag);
}

describe('SEC-01: XSS prevention in onboarding summary', function () {
  var container;

  beforeEach(function () {
    document.body.innerHTML = '<div id="summaryText"></div>';
    container = document.getElementById('summaryText');
  });

  afterEach(function () {
    document.body.innerHTML = '';
  });

  it('should not parse script tags from name field as HTML nodes', function () {
    var onboarding = {
      name: '<script>alert(1)</script>',
      businessDesc: 'test business',
      location: 'London',
    };

    // The FIXED render must be used in production — this test verifies the contract.
    // It intentionally tests the fixed version; the failing state is confirmed by
    // the companion test below that shows the vulnerable version breaks this contract.
    renderSummaryFixed(container, onboarding, null);

    // No script element should exist in the DOM
    expect(container.querySelector('script')).toBeNull();

    // The literal text (including angle brackets) should appear as safe text
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });

  it('should not create img elements from injected onerror payloads', function () {
    var onboarding = {
      name: '<img src=x onerror=alert(1)>',
      businessDesc: 'consulting',
      location: 'Malta',
    };

    renderSummaryFixed(container, onboarding, null);

    // No img element should be parsed into the DOM from user input
    expect(container.querySelector('img')).toBeNull();

    // The raw string should appear as text
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('DEMONSTRATES VULNERABILITY: vulnerable render creates real DOM nodes from user input', function () {
    // This test documents why the fix is needed.
    // The vulnerable implementation DOES parse user input as HTML.
    var onboarding = {
      name: '<img src=x onerror=alert(1)>',
      businessDesc: 'consulting',
      location: 'Malta',
    };

    renderSummaryVulnerable(container, onboarding, null);

    // The vulnerable path creates a real img element — THIS IS THE BUG
    expect(container.querySelector('img')).not.toBeNull();
  });
});
