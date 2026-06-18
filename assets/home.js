(function () {
  const siteTitleEl = document.getElementById('siteTitle');
  const siteSubtitleEl = document.getElementById('siteSubtitle');
  const siteDescriptionEl = document.getElementById('siteDescription');
  const statsGridEl = document.getElementById('statsGrid');
  const catalogGridEl = document.getElementById('catalogGrid');
  const searchEl = document.getElementById('catalogSearch');
  const clearBtn = document.getElementById('clearCatalogSearch');

  let keyword = '';
  let groupWordIndex = {};
  let indexReady = false;
  let indexLoading = false;

  init();

  function init() {
    siteTitleEl.textContent = SITE_META.title;
    siteSubtitleEl.textContent = SITE_META.subtitle;
    siteDescriptionEl.textContent = SITE_META.description;

    renderStats();
    renderCatalog();
    buildGroupWordIndex();

    searchEl.addEventListener('input', e => {
      keyword = e.target.value.trim();
      renderCatalog();
    });

    clearBtn.addEventListener('click', () => {
      keyword = '';
      searchEl.value = '';
      renderCatalog();
      searchEl.focus();
    });
  }

  function renderStats() {
    const activeGroups = GROUP_CATALOG.filter(g => g.status === 'active');
    const totalIdioms = GROUP_CATALOG.reduce((sum, g) => sum + (g.idiomCount || 0), 0);
    const stats = [
      ['已启用分组', activeGroups.length, '当前示例启用前两组'],
      ['已录入词条', totalIdioms, '后续每组独立维护'],
      ['规划分组', GROUP_CATALOG.length, '已预留到第 100 组'],
      ['推荐规模', '1000', '约 100 组 × 每组 10 词']
    ];

    statsGridEl.innerHTML = stats.map(([label, value, sub]) => `
      <article class="card stat-card"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}</div><div class="stat-card__sub">${sub}</div></article>
    `).join('');
  }

  function renderCatalog() {
    const q = normalizeSearchText(keyword);

    const groups = GROUP_CATALOG
      .map(g => {
        const matchedWords = getMatchedWords(g, q);
        const matchedCategories = getMatchedCategories(g, q);
        return { ...g, matchedWords, matchedCategories };
      })
      .filter(g => {
        if (!q) return true;

        const catalogText = [
          `第${g.no}组`,
          `第${String(g.no).padStart(2, '0')}组`,
          g.id,
          g.title,
          g.summary,
          g.status,
          ...(g.keywords || []),
          ...(g.words || [])
        ].join(' ');

        return normalizeSearchText(catalogText).includes(q)
          || g.matchedWords.length > 0
          || g.matchedCategories.length > 0;
      });

    if (!groups.length) {
      catalogGridEl.innerHTML = `<div class="empty-state">没有找到匹配目录。${indexLoading && !indexReady ? '词条索引仍在加载中，稍等片刻会自动刷新。' : ''}</div>`;
      return;
    }

    const hint = q
      ? `<div class="catalog-search-tip">${indexReady ? '已同时检索：组名、主题、关键词、组号、每组完整词条。' : '正在读取各组词条索引：已先检索组名、主题、关键词，加载完成后会自动补充“具体词条”搜索。'}</div>`
      : '';

    catalogGridEl.innerHTML = `
      ${hint}
      <div class="catalog-list-compact">
        ${groups.map(g => renderCatalogRow(g)).join('')}
      </div>
    `;
  }

  function renderCatalogRow(g) {
    const active = g.status === 'active';
    const href = active ? `./group.html?id=${g.id}` : '#';
    const title = active ? '进入本组' : '该组暂未补充';

    return `
      <a class="catalog-row ${active ? '' : 'catalog-row--placeholder'}" href="${href}" ${active ? '' : 'aria-disabled="true"'} title="${title}">
        <span class="catalog-row__no">第${String(g.no).padStart(2, '0')}组</span>
        <span class="catalog-row__main">
          <strong>${escapeHtml(g.title)}</strong>
          <em>${escapeHtml(g.summary)}</em>
        </span>
        <span class="catalog-row__keywords">${renderKeywordBadges(g)}</span>
        <span class="catalog-row__count">${active ? `${g.idiomCount} 词` : '待补充'}</span>
        <span class="catalog-row__action">${active ? '进入 →' : '预留'}</span>
      </a>
    `;
  }

  function renderKeywordBadges(group) {
    if (group.matchedWords && group.matchedWords.length) {
      return group.matchedWords
        .slice(0, 6)
        .map(word => `<b class="is-match" title="命中词条：${escapeHtml(word)}">${escapeHtml(word)}</b>`)
        .join('');
    }

    if (group.matchedCategories && group.matchedCategories.length) {
      return group.matchedCategories
        .slice(0, 4)
        .map(category => `<b class="is-match" title="命中分类：${escapeHtml(category)}">${escapeHtml(category)}</b>`)
        .join('');
    }

    return (group.keywords || [])
      .slice(0, 3)
      .map(k => `<b>${escapeHtml(k)}</b>`)
      .join('');
  }

  async function buildGroupWordIndex() {
    if (indexLoading) return;
    indexLoading = true;

    const activeGroups = GROUP_CATALOG.filter(g => g.status === 'active');
    const nextIndex = {};

    await Promise.all(activeGroups.map(async group => {
      const data = await loadGroupData(group.id);
      if (!data || !Array.isArray(data.idioms)) return;

      nextIndex[group.id] = {
        words: data.idioms.map(item => item.word).filter(Boolean),
        categories: [...new Set(data.idioms.map(item => item.category).filter(Boolean))],
        searchableItems: data.idioms.map(item => ({
          word: item.word || '',
          pinyin: item.pinyin || '',
          category: item.category || '',
          coreMeaning: item.coreMeaning || '',
          focus: item.focus || '',
          usageScenes: JSON.stringify(item.usageScenes || []),
          examCalibration: JSON.stringify(item.examCalibration || [])
        }))
      };
    }));

    groupWordIndex = nextIndex;
    indexReady = true;
    indexLoading = false;
    renderCatalog();
  }

  function loadGroupData(groupId) {
    return new Promise(resolve => {
      const previous = window.CHENGYU_GROUP_DATA;
      const script = document.createElement('script');

      script.src = `./data/groups/${groupId}.js`;
      script.async = true;

      script.onload = () => {
        const data = window.CHENGYU_GROUP_DATA;
        window.CHENGYU_GROUP_DATA = previous;
        script.remove();
        resolve(data && data.id === groupId ? data : null);
      };

      script.onerror = () => {
        window.CHENGYU_GROUP_DATA = previous;
        script.remove();
        resolve(null);
      };

      document.head.appendChild(script);
    });
  }

  function getMatchedWords(group, q) {
    if (!q) return [];

    const fromCatalog = (group.words || [])
      .filter(word => normalizeSearchText(word).includes(q));

    const index = groupWordIndex[group.id];
    if (!index) {
      return [...new Set(fromCatalog)].slice(0, 8);
    }

    const fromGroupFile = index.searchableItems
      .filter(item => {
        const text = [
          item.word,
          item.pinyin,
          item.category,
          item.coreMeaning,
          item.focus,
          item.usageScenes,
          item.examCalibration
        ].join(' ');
        return normalizeSearchText(text).includes(q);
      })
      .map(item => item.word)
      .filter(Boolean);

    return [...new Set([...fromCatalog, ...fromGroupFile])].slice(0, 8);
  }

  function getMatchedCategories(group, q) {
    if (!q) return [];
    const index = groupWordIndex[group.id];
    if (!index) return [];

    return index.categories
      .filter(category => normalizeSearchText(category).includes(q))
      .slice(0, 6);
  }

  function normalizeSearchText(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[，。、“”‘’：:；;（）()【】\[\]《》<>·\-—_/|]/g, '');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
