// cypress/e2e/seabirdle.cy.js
// Run: npx cypress open   (interactive)
//      npx cypress run    (headless, CI)
//
// Requires the site running locally: npx serve . -l 5000
// or configure baseUrl in cypress.config.js

describe('Seabirdle', () => {

  // ── Fixtures ──────────────────────────────────────────────────────────────
  // Intercept network calls so tests are deterministic and offline-capable.
  beforeEach(() => {
    cy.intercept('GET', '/birds_list.json', { fixture: 'birds_list.json' }).as('birdsList');
    cy.intercept('GET', '/birds.json',      { fixture: 'birds.json'      }).as('birdsJson');
    cy.intercept('GET', '/audio/today.mp3', { statusCode: 200, body: '' }).as('audio');
    cy.intercept('GET', '/img/daily/*',     { statusCode: 200, body: '' }).as('image');

    // Clear localStorage so "already played" state doesn't bleed between tests
    cy.clearLocalStorage();
  });

  // ── Boot ──────────────────────────────────────────────────────────────────
  it('loads and shows the game UI', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);

    cy.get('#bird-preview-wrap').should('be.visible');
    cy.get('#audio-section').should('be.visible');
    cy.get('#guesses-section').should('be.visible');
    cy.get('#input-section').should('be.visible');
    cy.get('#date-badge').should('not.be.empty');
  });

  it('shows 6 empty guess rows on start', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('.guess-row').should('have.length', 6);
    cy.get('.guess-row.empty').should('have.length', 6);
  });

  it('image is blurred on start', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    // CSS custom property --blur should be non-zero on load
    cy.get('#bird-preview').then($img => {
      const blur = $img[0].style.getPropertyValue('--blur');
      expect(parseInt(blur)).to.be.greaterThan(0);
    });
  });

  // ── Autocomplete ──────────────────────────────────────────────────────────
  it('shows autocomplete suggestions when typing', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#guess-input').type('puf');
    cy.get('#autocomplete').should('be.visible');
    cy.get('.ac-item').should('have.length.at.least', 1);
    cy.get('.ac-m').should('exist'); // highlighted match text
  });

  it('fills input when autocomplete item clicked', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#guess-input').type('puf');
    cy.get('.ac-item').first().click();
    cy.get('#guess-input').should('not.have.value', '');
    cy.get('#autocomplete').should('not.be.visible');
  });

  it('ArrowDown/Enter selects autocomplete item', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#guess-input').type('tern');
    cy.get('#autocomplete').should('be.visible');
    cy.get('#guess-input').type('{downarrow}{enter}');
    cy.get('#guess-input').invoke('val').should('not.be.empty');
  });

  // ── Wrong guess ───────────────────────────────────────────────────────────
  it('rejects a name not in the list', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#guess-input').type('Penguin');
    cy.get('#submit-btn').click();
    cy.get('#toast').should('be.visible').and('contain', 'Not in the seabird list');
    cy.get('.guess-row.wrong').should('have.length', 0); // no guess recorded
  });

  it('rejects a duplicate guess', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#guess-input').type('Razorbill');
    cy.get('#submit-btn').click();
    cy.get('#guess-input').type('Razorbill');
    cy.get('#submit-btn').click();
    cy.get('#toast').should('contain', 'Already guessed');
  });

  it('records a wrong guess and reduces blur', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);

    cy.get('#bird-preview').then($img => {
      const blurBefore = parseInt($img[0].style.getPropertyValue('--blur'));

      cy.get('#guess-input').type('Razorbill');
      cy.get('#submit-btn').click();
      cy.get('.guess-row.wrong').should('have.length', 1);

      cy.get('#bird-preview').then($img2 => {
        const blurAfter = parseInt($img2[0].style.getPropertyValue('--blur'));
        expect(blurAfter).to.be.lessThan(blurBefore);
      });
    });
  });

  // ── Correct guess — uses fixture bird name ────────────────────────────────
  // The fixture birds.json must have "name" matching a bird in birds_list.json.
  // Default fixture target: "Atlantic Puffin"
  it('wins on correct guess', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#guess-input').type('Atlantic Puffin');
    cy.get('#submit-btn').click();
    cy.get('#result-panel').should('be.visible');
    cy.get('#res-title').should('contain', 'Correct');
    cy.get('#bird-preview').then($img => {
      expect($img[0].style.getPropertyValue('--blur')).to.equal('0px');
    });
  });

  it('saves play date to localStorage on win', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#guess-input').type('Atlantic Puffin');
    cy.get('#submit-btn').click();
    cy.getAllLocalStorage().then(ls => {
      const key = Object.keys(ls)[0];
      expect(ls[key].lastPlayDate).to.equal(new Date().toISOString().slice(0, 10));
    });
  });

  // ── Already played ────────────────────────────────────────────────────────
  it('shows already-played message on revisit', () => {
    const today = new Date().toISOString().slice(0, 10);
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    // Simulate having played
    cy.window().then(win => win.localStorage.setItem('lastPlayDate', today));
    cy.reload();
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#result-panel').should('be.visible');
    cy.get('#res-title').should('contain', 'Already played');
    // Bird info still shown
    cy.get('#res-name').should('not.be.empty');
    cy.get('#res-fact').should('not.be.empty');
  });

  // ── Six wrong guesses ─────────────────────────────────────────────────────
  it('loses after 6 wrong guesses', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);

    // Wrong birds — must all be in birds_list.json fixture and not the answer
    const wrongGuesses = [
      'Razorbill', 'Common Guillemot', 'Northern Gannet',
      'European Shag', 'Great Cormorant', 'Manx Shearwater',
    ];
    wrongGuesses.forEach(name => {
      cy.get('#guess-input').type(name);
      cy.get('#submit-btn').click();
    });

    cy.get('#result-panel').should('be.visible');
    cy.get('#res-title').should('contain', 'Better luck');
    cy.get('.guess-row.wrong').should('have.length', 6);
  });

  // ── Hint toasts ───────────────────────────────────────────────────────────
  it('shows genus hint after 2 wrong guesses', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#guess-input').type('Razorbill');
    cy.get('#submit-btn').click();
    cy.get('#guess-input').type('Common Guillemot');
    cy.get('#submit-btn').click();
    cy.get('#toast').should('contain', 'Hint: genus');
  });

  // ── Audio ─────────────────────────────────────────────────────────────────
  it('play button is enabled when audio path is available', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#play-btn').should('not.be.disabled');
  });

  it('play dot count decrements on play', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#plays-dots').invoke('text').then(before => {
      // Count filled dots before
      const filled = (before.match(/●/g) || []).length;
      cy.get('#play-btn').click();
      cy.get('#plays-dots').invoke('text').then(after => {
        const filledAfter = (after.match(/●/g) || []).length;
        expect(filledAfter).to.equal(filled - 1);
      });
    });
  });

  // ── Keyboard: Enter submits ───────────────────────────────────────────────
  it('Enter key submits a guess', () => {
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#guess-input').type('Razorbill{enter}');
    cy.get('.guess-row').not('.empty').should('have.length', 1);
  });

  // ── Responsive layout ─────────────────────────────────────────────────────
  it('renders correctly at mobile width', () => {
    cy.viewport(375, 812);
    cy.visit('/');
    cy.wait(['@birdsList', '@birdsJson']);
    cy.get('#app').should('be.visible');
    cy.get('#guess-input').should('be.visible');
    cy.get('#submit-btn').should('be.visible');
  });
});