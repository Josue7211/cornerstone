import { CONNECTION_DISCIPLINES, PAGE_SIZE_ALL } from './config.js';

export function refreshSceneScroll(scene) {
  if (!scene) return;
  const content = scene.querySelector('.pfs-content');
  if (!content) return;
  requestAnimationFrame(() => {
    const available = window.innerHeight - 180;
    const needed = content.scrollHeight;
    scene.style.overflowY = needed > available ? 'auto' : 'hidden';
  });
}

export function setupConnectionsScene(mode, scene) {
  const inner = scene.querySelector('.pfs-slide-inner');
  if (!inner) {
    return { reset() {}, destroy() {} };
  }
  const tags = Array.from(inner.querySelectorAll('.discipline-tag'));
  const items = Array.from(inner.querySelectorAll('.connection-item'));
  if (!tags.length || !items.length) {
    return { reset() {}, destroy() {} };
  }

  const pager = document.createElement('div');
  pager.className = 'pfs-connections-pager';
  pager.innerHTML = `
    <button type="button" class="pfs-connections-page-btn" data-dir="-1">Prev</button>
    <span class="pfs-connections-page-status">1 / 1</span>
    <button type="button" class="pfs-connections-page-btn" data-dir="1">Next</button>
  `;
  const connectionsWrap = inner.querySelector('.slide-connections');
  if (connectionsWrap && connectionsWrap.parentNode) {
    connectionsWrap.parentNode.insertBefore(pager, connectionsWrap.nextSibling);
  }

  const prevBtn = pager.querySelector('[data-dir="-1"]');
  const nextBtn = pager.querySelector('[data-dir="1"]');
  const status = pager.querySelector('.pfs-connections-page-status');

  const grouped = CONNECTION_DISCIPLINES.reduce((acc, discipline) => {
    acc[discipline] = items.filter((item) => item.dataset.discipline === discipline);
    return acc;
  }, {});

  const roundRobin = [];
  let remaining = true;
  let depth = 0;
  while (remaining) {
    remaining = false;
    CONNECTION_DISCIPLINES.forEach((discipline) => {
      const candidate = grouped[discipline][depth];
      if (candidate) {
        roundRobin.push(candidate);
        remaining = true;
      }
    });
    depth += 1;
  }

  const state = { target: 'all', page: 0 };
  const setTarget = (target) => {
    state.target = target;
    state.page = 0;
    render();
  };

  const render = () => {
    tags.forEach((tag) => {
      tag.classList.toggle('is-active', tag.dataset.target === state.target);
    });

    let visible = [];
    let totalPages = 1;
    if (state.target === 'all') {
      totalPages = Math.max(1, Math.ceil(roundRobin.length / PAGE_SIZE_ALL));
      if (state.page > totalPages - 1) state.page = totalPages - 1;
      const start = state.page * PAGE_SIZE_ALL;
      visible = roundRobin.slice(start, start + PAGE_SIZE_ALL);
      pager.style.display = 'flex';
    } else {
      visible = items.filter((item) => item.dataset.discipline === state.target);
      pager.style.display = 'none';
      totalPages = 1;
      state.page = 0;
    }

    items.forEach((item) => {
      item.style.display = visible.includes(item) ? '' : 'none';
    });

    status.textContent = `${state.page + 1} / ${totalPages}`;
    prevBtn.disabled = state.page <= 0;
    nextBtn.disabled = state.page >= totalPages - 1;

    refreshSceneScroll(scene);
  };

  const onTagClick = (event) => {
    const target = event.currentTarget.dataset.target || 'all';
    setTarget(target);
    if (target === 'all') mode._setBonziBubble('Connections', 'Pageing all categories in sequence.');
    else mode._setBonziBubble('Connections', `Showing ${target.replace('-', ' ')}.`);
  };
  tags.forEach((tag) => tag.addEventListener('click', onTagClick));

  const onPageClick = (event) => {
    const dir = Number(event.currentTarget.dataset.dir || 0);
    state.page = Math.max(0, state.page + dir);
    render();
  };
  prevBtn.addEventListener('click', onPageClick);
  nextBtn.addEventListener('click', onPageClick);
  const reset = () => {
    setTarget('all');
  };

  render();

  const destroy = () => {
    tags.forEach((tag) => tag.removeEventListener('click', onTagClick));
    prevBtn.removeEventListener('click', onPageClick);
    nextBtn.removeEventListener('click', onPageClick);
    if (pager.parentNode) pager.parentNode.removeChild(pager);
  };

  return { reset, destroy };
}

export function registerSceneInteraction(mode, scene, index) {
  const teardown = [];
  const inner = scene.querySelector('.pfs-slide-inner');
  if (!inner) return;

  if (index === 2) {
    const cards = Array.from(inner.querySelectorAll('.rq-item'));
    cards.forEach((card, cardIndex) => {
      const onClick = () => {
        const isFlipped = card.classList.toggle('is-flipped');
        cards.forEach((other) => other.classList.remove('is-focus'));
        card.classList.add('is-focus');
        const text = isFlipped ? `RQ${cardIndex + 1} flipped.` : `RQ${cardIndex + 1} reset.`;
        mode._setBonziBubble('Interact', text);
      };
      card.addEventListener('click', onClick);
      teardown.push(() => card.removeEventListener('click', onClick));
    });
  }

  if (index === 4) {
    const controls = setupConnectionsScene(mode, scene);
    teardown.push(() => {
      if (controls && typeof controls.destroy === 'function') controls.destroy();
    });
  }

  if (index === 5) {
    const items = Array.from(inner.querySelectorAll('.impl-item'));
    items.forEach((item, itemIndex) => {
      const onClick = () => {
        items.forEach((other) => other.classList.remove('is-focus'));
        item.classList.add('is-focus');
        item.classList.toggle('is-flipped');
        mode._setBonziBubble('Implications', `Spotlighting implication ${itemIndex + 1}.`);
      };
      item.addEventListener('click', onClick);
      teardown.push(() => item.removeEventListener('click', onClick));
    });
  }

  mode.cleanupFns.push(() => teardown.forEach((fn) => fn()));
}
