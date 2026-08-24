/**
 * Zolto Interactive Runtime — the single source of truth for wiring up
 * quizzes, flashcard decks, polls, @itabs, and code-block copy buttons
 * after their HTML is in the DOM.
 *
 * Two consumers share this exact function:
 *   1. The live editor app (index.html) calls it directly on the preview
 *      pane after every render.
 *   2. The standalone .zl-to-JS export (src/export/js-bundle-export.js)
 *      embeds its literal source (via .toString()) into every compiled
 *      bundle format, so exported documents work offline with no
 *      framework or build step.
 *
 * Previously these were two independent, hand-maintained copies that
 * had drifted out of sync with the renderer and with each other —
 * the root cause of quizzes, flashcards, and polls being non-functional
 * in the live app, and partially non-functional in exports too. Keeping
 * this as the one real, executable, testable definition — with the
 * export string *derived* from it rather than duplicated — prevents
 * that class of bug from recurring.
 *
 * Must stay self-contained: only `root` and browser globals (document,
 * navigator, setTimeout) — no closures over module-level state — since
 * Function.prototype.toString() is used to lift its exact source into
 * exported bundles verbatim.
 *
 * @param {Element|Document} root — the container to wire up (the live
 *   preview pane, or an exported bundle's mount point / shadow root).
 */
export function initZoltoInteractivity(root) {
  if (!root) return;

  // 1. Code Block Copy to Clipboard
  const copyButtons = root.querySelectorAll('.zl-copy, [data-copy-btn]');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const codeBlock = btn.closest('.zl-cb') || btn.closest('pre');
      const codeElem = codeBlock ? codeBlock.querySelector('code') : null;
      const textToCopy = codeElem ? (codeElem.innerText || codeElem.textContent) : btn.getAttribute('data-copy-text') || '';
      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy.trim());
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        btn.classList.add('zl-copied');
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.classList.remove('zl-copied');
        }, 2000);
      } catch (err) {
        console.warn('[Zolto] Clipboard write error:', err);
      }
    });
  });

  // 2. Interactive Tabs (@tabs directive) — this feature already ships its
  // own self-contained inline onclick handler (see TAB_FN in
  // src/directive-renderer.js), which toggles panels via the 'hidden'
  // attribute. A second handler used to be registered here matching the
  // same .zl-tabs/.zl-tab-btn/.zl-tab-panel classes and toggling
  // 'style.display'/'.active' instead — an inline style set after the
  // inline handler already ran would fight the 'hidden' attribute's
  // effect, producing inconsistent panel visibility. Intentionally no
  // extra wiring needed here; see section 5 for the separate @itabs
  // feature, which genuinely had none.

  // 3. Quiz Engine — grades every question type the renderer actually emits
  // (single/multi MCQ, true/false, fill-in-the-blank), reveals hints,
  // rationale, and per-option explanations only after grading, and reports
  // a real earned/possible score — mirrors src/interactive/quizzes.js.
  const quizzes = root.querySelectorAll('.zl-quiz, [data-zl-quiz]');
  quizzes.forEach(quiz => {
    const submitBtn = quiz.querySelector('[data-zl-quiz-submit], .zl-quiz-submit, .zl-quiz-btn');
    const scoreEl = quiz.querySelector('[data-zl-quiz-score], .zl-quiz-score');
    if (!submitBtn) return;

    function gradeQuestion(q) {
      const kind = q.getAttribute('data-zl-question');
      const optionEls = q.querySelectorAll('.zl-option');
      let earned = 0, possible = 1, answered = false;

      if (kind === 'radio' || kind === 'truefalse') {
        possible = 1;
        const inputs = q.querySelectorAll('input[type="radio"]');
        let selected = null;
        inputs.forEach(inp => { if (inp.checked) selected = inp; });
        answered = !!selected;
        const isCorrect = !!selected && selected.getAttribute('data-zl-correct') === 'true';
        if (isCorrect) earned = 1;
        optionEls.forEach(opt => {
          const input = opt.querySelector('input');
          if (!input) return;
          if (input.getAttribute('data-zl-correct') === 'true') opt.classList.add('zl-opt-correct');
          else if (input === selected) opt.classList.add('zl-opt-incorrect');
          input.disabled = true;
          revealOptionExplain(opt);
        });
      } else if (kind === 'checkbox') {
        const inputs = [...q.querySelectorAll('input[type="checkbox"]')];
        const correctCount = inputs.filter(i => i.getAttribute('data-zl-correct') === 'true').length;
        possible = correctCount || 1;
        const selected = inputs.filter(i => i.checked);
        answered = selected.length > 0;
        selected.forEach(inp => {
          if (inp.getAttribute('data-zl-correct') === 'true') earned++; else earned--;
        });
        earned = Math.max(0, earned);
        optionEls.forEach(opt => {
          const input = opt.querySelector('input');
          if (!input) return;
          const isCorrectOpt = input.getAttribute('data-zl-correct') === 'true';
          if (isCorrectOpt) opt.classList.add('zl-opt-correct');
          else if (input.checked) opt.classList.add('zl-opt-incorrect');
          input.disabled = true;
          revealOptionExplain(opt);
        });
      } else if (kind === 'fillblank') {
        possible = 1;
        const input = q.querySelector('[data-zl-blank]');
        const expected = q.getAttribute('data-zl-answer') || '';
        const caseSensitive = q.hasAttribute('data-zl-case-sensitive');
        const raw = input ? input.value.trim() : '';
        answered = raw.length > 0;
        const isCorrect = caseSensitive ? raw === expected.trim() : raw.toLowerCase() === expected.trim().toLowerCase();
        if (isCorrect) earned = 1;
        if (input) {
          input.disabled = true;
          input.classList.add(isCorrect ? 'zl-opt-correct' : 'zl-opt-incorrect');
        }
      } else {
        // Matching / matrix / other display-only question types aren't
        // gradable inputs yet — skip scoring rather than misreport 0%.
        possible = 0;
      }

      if (possible > 0) q.classList.add(earned >= possible ? 'zl-answered-correct' : 'zl-answered-incorrect');
      const hint = q.querySelector('.zl-quiz-hint');
      if (hint) hint.hidden = false;
      const explain = q.querySelector('[data-zl-explain]');
      if (explain) explain.hidden = false;

      return { earned, possible };
    }

    function revealOptionExplain(opt) {
      const text = opt.getAttribute('data-zl-opt-explain');
      const target = opt.querySelector('[data-zl-opt-explain-text]');
      if (text && target) { target.textContent = text; target.hidden = false; }
    }

    function handleSubmit(e) {
      e.preventDefault();
      if (submitBtn.disabled) return; // already graded — avoid double negative-credit on checkboxes
      const questions = quiz.querySelectorAll('.zl-question');
      let totalEarned = 0, totalPossible = 0;
      questions.forEach(q => {
        const { earned, possible } = gradeQuestion(q);
        totalEarned += earned;
        totalPossible += possible;
      });
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-disabled', 'true');
      if (scoreEl) {
        const pct = totalPossible === 0 ? 0 : Math.round((totalEarned / totalPossible) * 100);
        scoreEl.textContent = totalPossible === 0
          ? 'Reviewed.'
          : ('Score: ' + totalEarned + ' / ' + totalPossible + ' (' + pct + '%)');
        scoreEl.style.display = 'block';
      }
    }

    if (quiz.tagName === 'FORM') quiz.addEventListener('submit', handleSubmit);
    else submitBtn.addEventListener('click', handleSubmit);
  });

  // 4. Flashcard Deck Engine — the renderer (src/interactive/renderer.js
  // renderDeck()) only ever puts ONE card element in the DOM; the rest of
  // the deck is embedded as JSON in a <script data-zl-deck-data> tag for
  // the runtime to read. The previous version of this handler looked for
  // .zl-flashcard-deck/.zl-flashcard/.zl-fc-prev/.zl-fc-next/.zl-fc-counter
  // — none of which the renderer emits (real: .zl-deck, data-zl-deck-prev,
  // data-zl-deck-next, data-zl-deck-counter) — and never read the JSON
  // data at all, so navigation past card 1 was structurally impossible.
  const decks = root.querySelectorAll('.zl-deck');
  decks.forEach(deck => {
    const dataScript = deck.querySelector('[data-zl-deck-data]');
    let cards = [];
    try { cards = dataScript ? JSON.parse(dataScript.textContent) : []; } catch (err) { cards = []; }
    if (cards.length === 0) return;

    const cardInner = deck.querySelector('[data-zl-card]');
    const faceEl     = deck.querySelector('.zl-card-face');
    const backEl     = deck.querySelector('.zl-card-back');
    const counterEl  = deck.querySelector('[data-zl-deck-counter]');
    const progressEl = deck.querySelector('[data-zl-deck-progress]');
    const prevBtn    = deck.querySelector('[data-zl-deck-prev]');
    const nextBtn    = deck.querySelector('[data-zl-deck-next]');
    const flipBtn    = deck.querySelector('[data-zl-deck-flip]');
    let idx = 0;

    function renderCard() {
      const card = cards[idx];
      if (faceEl) faceEl.textContent = card.f;
      if (backEl) backEl.textContent = card.b;
      if (cardInner) {
        cardInner.classList.remove('flipped');
        cardInner.setAttribute('data-zl-card-index', String(idx));
      }
      if (counterEl) counterEl.textContent = (idx + 1) + ' / ' + cards.length;
      if (progressEl) progressEl.style.width = (((idx + 1) / cards.length) * 100) + '%';
    }
    function flip() { if (cardInner) cardInner.classList.toggle('flipped'); }
    function goPrev() { idx = (idx - 1 + cards.length) % cards.length; renderCard(); }
    function goNext() { idx = (idx + 1) % cards.length; renderCard(); }

    if (cardInner) {
      cardInner.addEventListener('click', flip);
      cardInner.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
      });
    }
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
    if (flipBtn) flipBtn.addEventListener('click', (e) => { e.stopPropagation(); flip(); });

    renderCard();
  });

  // 5. Interactive Tabs (Phase 10 @itabs — .zl-itabs/.zl-itab-btn/
  // .zl-itab-panel) — a *different* feature from the @tabs directive
  // (.zl-tabs/.zl-tab-btn), which already ships its own inline onclick
  // handler and needs no help here. The previous version of this section
  // queried .zl-tabs/.zl-tab-btn/.zl-tab-panel: it matched the directive
  // version by class-name coincidence and duplicated/fought its already-
  // working inline handler (setting conflicting inline 'style.display'
  // alongside the directive's own 'hidden' toggling), while never
  // matching .zl-itabs at all, leaving it with zero interactivity.
  const itabGroups = root.querySelectorAll('.zl-itabs');
  itabGroups.forEach(group => {
    const btns = group.querySelectorAll('.zl-itab-btn');
    const panels = group.querySelectorAll('.zl-itab-panel');
    btns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        btns.forEach(b => { b.setAttribute('aria-selected', 'false'); b.classList.remove('active'); b.tabIndex = -1; });
        panels.forEach(p => { p.hidden = true; p.classList.remove('active'); });
        btn.setAttribute('aria-selected', 'true');
        btn.classList.add('active');
        btn.tabIndex = 0;
        if (panels[idx]) { panels[idx].hidden = false; panels[idx].classList.add('active'); }
      });
    });
  });

  // 6. Poll Engine — was entirely unimplemented; the "Vote" button
  // (data-zl-poll-submit) did nothing in any context.
  const polls = root.querySelectorAll('.zl-poll');
  polls.forEach(poll => {
    const submitBtn = poll.querySelector('[data-zl-poll-submit]');
    const optionsEl = poll.querySelector('.zl-poll-options');
    const resultsEl = poll.querySelector('[data-zl-poll-results]');
    if (!submitBtn || !optionsEl) return;

    submitBtn.addEventListener('click', () => {
      if (submitBtn.disabled) return;
      const inputs = [...optionsEl.querySelectorAll('input')];
      const selected = inputs.filter(i => i.checked);
      if (selected.length === 0) return;

      const counts = inputs.map(() => 0);
      selected.forEach(inp => { counts[inputs.indexOf(inp)] = 1; });
      const total = selected.length;

      inputs.forEach((inp, i) => {
        inp.disabled = true;
        const label = inp.closest('.zl-poll-option');
        const text = label ? label.querySelector('span').textContent : '';
        const pct = total === 0 ? 0 : Math.round((counts[i] / total) * 100);
        if (label && resultsEl) {
          const row = document.createElement('div');
          row.className = 'zl-poll-bar-row';
          const labelRow = document.createElement('div');
          labelRow.className = 'zl-poll-bar-label';
          const nameSpan = document.createElement('span');
          nameSpan.textContent = text;
          const pctSpan = document.createElement('span');
          pctSpan.textContent = pct + '%';
          labelRow.appendChild(nameSpan);
          labelRow.appendChild(pctSpan);
          const track = document.createElement('div');
          track.className = 'zl-poll-bar-track';
          const fill = document.createElement('div');
          fill.className = 'zl-poll-bar-fill';
          fill.style.width = pct + '%';
          track.appendChild(fill);
          row.appendChild(labelRow);
          row.appendChild(track);
          resultsEl.appendChild(row);
        }
      });
      if (resultsEl) resultsEl.hidden = false;
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-disabled', 'true');
      submitBtn.textContent = 'Voted';
    });
  });
}
