(function () {
  const siteTitleEl = document.getElementById('siteTitle');
  const siteSubtitleEl = document.getElementById('siteSubtitle');
  const siteDescriptionEl = document.getElementById('siteDescription');
  const statsGridEl = document.getElementById('statsGrid');
  const catalogGridEl = document.getElementById('catalogGrid');
  const searchEl = document.getElementById('catalogSearch');
  const clearBtn = document.getElementById('clearCatalogSearch');
  let keyword = '';
  init();

  function init() {
    siteTitleEl.textContent = SITE_META.title;
    siteSubtitleEl.textContent = SITE_META.subtitle;
    siteDescriptionEl.textContent = SITE_META.description;
    renderStats();
    renderCatalog();
    searchEl.addEventListener('input', e => { keyword = e.target.value.trim(); renderCatalog(); });
    clearBtn.addEventListener('click', () => { keyword = ''; searchEl.value = ''; renderCatalog(); searchEl.focus(); });
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
    const q = keyword.toLowerCase();
    const groups = GROUP_CATALOG.filter(g => {
      if (!q) return true;
      return [g.title, g.summary, g.status, ...(g.keywords || [])].join(' ').toLowerCase().includes(q);
    });
    catalogGridEl.innerHTML = `
      <div class="catalog-list-compact">
        ${groups.map(g => {
          const active = g.status === 'active';
          return `
            <a class="catalog-row ${active ? '' : 'catalog-row--placeholder'}" href="${active ? `./group.html?id=${g.id}` : '#'}" ${active ? '' : 'aria-disabled="true"'} title="${active ? '进入本组' : '该组暂未补充'}">
              <span class="catalog-row__no">第${String(g.no).padStart(2, '0')}组</span>
              <span class="catalog-row__main">
                <strong>${g.title}</strong>
                <em>${g.summary}</em>
              </span>
              <span class="catalog-row__keywords">${(g.keywords || []).slice(0, 3).map(k => `<b>${k}</b>`).join('')}</span>
              <span class="catalog-row__count">${active ? `${g.idiomCount} 词` : '待补充'}</span>
              <span class="catalog-row__action">${active ? '进入 →' : '预留'}</span>
            </a>
          `;
        }).join('')}
      </div>
    ` || '<div class="empty-state">没有找到匹配目录。</div>';
  }
})();
