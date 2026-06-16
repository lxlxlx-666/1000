(function () {
  const params = new URLSearchParams(location.search);
  const groupId = params.get('id') || 'g01';
  const group = GROUP_CATALOG.find(item => item.id === groupId);

  const groupBadgeEl = document.getElementById('groupBadge');
  const groupTitleEl = document.getElementById('groupTitle');
  const groupSummaryEl = document.getElementById('groupSummary');
  const triggerTableEl = document.getElementById('triggerTable');
  const idiomListEl = document.getElementById('idiomList');
  const resultSummaryEl = document.getElementById('resultSummary');
  const searchEl = document.getElementById('groupSearch');
  const clearBtn = document.getElementById('clearGroupSearch');
  const detailModalEl = document.getElementById('detailModal');
  const modalBodyEl = document.getElementById('modalBody');
  const closeModalBtnEl = document.getElementById('closeModalBtn');
  const prevGroupEl = document.getElementById('prevGroup');
  const nextGroupEl = document.getElementById('nextGroup');

  let keyword = '';
  let searchScrollTimer = null;
  let groupData = null;

  if (!group || group.status !== 'active') { renderNotFound(); return; }

  loadGroupData(groupId).then(data => { groupData = data; initGroup(); }).catch(renderLoadError);

  function loadGroupData(id) {
    return new Promise((resolve, reject) => {
      window.CHENGYU_GROUP_DATA = undefined;
      const script = document.createElement('script');
      script.src = `./data/groups/${id}.js`;
      script.onload = () => window.CHENGYU_GROUP_DATA ? resolve(window.CHENGYU_GROUP_DATA) : reject();
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function initGroup() {
    document.title = `第${group.no}组：${group.title} - 行测成语辨析资料库`;
    groupBadgeEl.textContent = `第${String(group.no).padStart(2, '0')}组`;
    groupTitleEl.textContent = group.title;
    groupSummaryEl.textContent = groupData.summary || group.summary;
    setupNav();
    render();
    bindEvents();
  }

  function bindEvents() {
    searchEl.addEventListener('input', e => {
      keyword = e.target.value.trim();
      render();
      window.clearTimeout(searchScrollTimer);
      if (keyword) {
        searchScrollTimer = window.setTimeout(() => {
          const first = document.querySelector('.idiom-card[data-search-result="true"]');
          if (first) {
            first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            first.classList.add('is-highlighted');
            window.setTimeout(() => first.classList.remove('is-highlighted'), 1400);
          }
        }, 220);
      }
    });
    clearBtn.addEventListener('click', () => { keyword = ''; searchEl.value = ''; render(); searchEl.focus(); });
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-action="open-detail"]');
      if (btn) {
        const idiom = groupData.idioms.find(item => item.id === btn.getAttribute('data-id'));
        if (idiom) openModal(idiom);
        return;
      }
      if (e.target.matches('[data-close="true"]')) closeModal();
    });
    closeModalBtnEl.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  function setupNav() {
    const active = GROUP_CATALOG.filter(item => item.status === 'active');
    const i = active.findIndex(item => item.id === group.id);
    const prev = active[i - 1], next = active[i + 1];
    if (prev) { prevGroupEl.href = `./group.html?id=${prev.id}`; prevGroupEl.textContent = `← 第${prev.no}组`; }
    else { prevGroupEl.classList.add('is-disabled'); prevGroupEl.textContent = '← 无上一组'; }
    if (next) { nextGroupEl.href = `./group.html?id=${next.id}`; nextGroupEl.textContent = `第${next.no}组 →`; }
    else { nextGroupEl.classList.add('is-disabled'); nextGroupEl.textContent = '无下一组 →'; }
  }

  function render() {
    const idioms = filterIdioms(groupData.idioms, keyword);
    resultSummaryEl.textContent = keyword ? `检索词：“${keyword}” · 匹配 ${idioms.length} 个词条` : `本组共 ${groupData.idioms.length} 个词条`;
    triggerTableEl.innerHTML = renderTriggerSummary(idioms);
    idiomListEl.innerHTML = renderIdiomList(idioms);
  }

  function filterIdioms(items, q) {
    if (!q) return items;
    const query = q.toLowerCase();
    return items.filter(item => [
      item.category, item.word, item.pinyin, item.coreMeaning, item.focus, item.objects,
      item.collocations.join(' '), item.triggerClues.join(' '), item.tone, item.toneDetail,
      item.intensity, item.register.join(' '),
      item.confusion.map(c => `${c.word} ${c.difference}`).join(' ')
    ].join(' ').toLowerCase().includes(query));
  }

  function renderTriggerSummary(items) {
    if (!items.length) return '<div class="empty-state">未找到匹配词条。</div>';
    return `<div class="trigger-table-wrap"><table class="trigger-table"><thead><tr><th>成语</th><th>小类</th><th>优先触发信号</th><th>辨析抓手</th></tr></thead><tbody>
      ${items.map(item => `<tr><td><strong>${item.word}</strong><span>${item.pinyin}</span></td><td>${item.category}</td><td><div class="mini-chip-row">${item.triggerClues.map(x => `<span>${x}</span>`).join('')}</div></td><td>${item.focus}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function renderIdiomList(items) {
    if (!items.length) return '<div class="empty-state">未找到匹配词条。</div>';
    const categories = Array.from(new Set(items.map(item => item.category)));
    return categories.map(category => {
      const arr = items.filter(item => item.category === category);
      return `<section class="category-section"><div class="category-title"><h3>${category}</h3><span>${arr.length} 词</span></div><div class="idiom-grid">${arr.map(renderIdiomCard).join('')}</div></section>`;
    }).join('');
  }

  function renderIdiomCard(item) {
    return `<article class="idiom-card" id="idiom-${item.id}" data-search-result="true">
      <div class="idiom-card__meta"><span class="idiom-card__category">${item.category}</span><span class="idiom-card__tone">${item.tone}</span></div>
      <h4>${item.word}</h4><div class="idiom-card__pinyin">${item.pinyin}</div>
      <p class="idiom-card__core">${item.coreMeaning}</p>
      <div class="chip-row">${item.triggerClues.slice(0, 4).map(x => `<span class="chip">${x}</span>`).join('')}</div>
      <div class="idiom-card__footer"><span class="idiom-card__hint">完整栏目 / 易混辨析 / 官媒语境</span><button type="button" class="idiom-card__btn" data-action="open-detail" data-id="${item.id}">查看详情</button></div>
    </article>`;
  }

  function openModal(item) {
    modalBodyEl.innerHTML = renderDetail(item);
    detailModalEl.classList.add('is-open');
    detailModalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() { detailModalEl.classList.remove('is-open'); detailModalEl.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

  function renderDetail(item) {
    return `<div class="detail-header"><div><div class="eyebrow">第${group.no}组 · ${group.title}</div><h2 id="modalTitle">${item.word}</h2><div class="detail-pinyin">${item.pinyin}</div></div><div class="detail-badges"><span class="detail-badge">${item.category}</span><span class="detail-badge">${item.tone}</span><span class="detail-badge">${item.register.join(' / ')}</span></div></div>
      <div class="detail-grid">
        ${field('核心义', item.coreMeaning)}
        ${field('侧重点', item.focus)}
        ${field('适用对象', item.objects)}
        ${field('感情色彩', `<strong>${item.tone}</strong><br>${item.toneDetail || ''}`)}
        ${field('常见搭配', chipList(item.collocations), true)}
        ${field('触发线索', chipList(item.triggerClues), true)}
        ${field('程度轻重', item.intensity)}
        ${field('语体风格', item.register.join('、'))}
        ${field('易混辨析', compareList(item.confusion), true)}
        ${field('官媒 / 权威语境', contextList(item.officialContext), true)}
      </div>
      <div class="note-box"><strong>填写提示：</strong>官媒语境在 <code>officialContext</code> 中填写，每条由 <code>sentence</code> 和 <code>usage</code> 组成。</div><div class="detail-action-box"><a class="xuexi-btn" href="${xuexiSearchUrl(item.word)}" target="_blank" rel="noopener noreferrer">去学习强国搜索“${item.word}” →</a><span>打开学习强国搜索页，用于查找官媒/权威语境。</span></div>`;
  }

  function field(label, value, full = false) { return `<div class="detail-item ${full ? 'detail-item--full' : ''}"><span class="detail-item__label">${label}</span><div class="detail-item__value">${value}</div></div>`; }
  function chipList(list) { return `<div class="inline-list">${list.map(x => `<span class="chip">${x}</span>`).join('')}</div>`; }
  function compareList(list) { return `<div class="compare-list">${list.map(x => `<div class="compare-card"><strong>${x.word}</strong><div>${x.difference}</div></div>`).join('')}</div>`; }
  function contextList(list) { return `<div class="context-list">${list.map((e, i) => `<div class="context-card"><div><span class="context-card__index">${i + 1}</span><strong>例句</strong></div><div class="context-placeholder">${e.sentence || '句子：待填写'}</div><div class="context-placeholder">${e.usage || '用法说明：待填写'}</div></div>`).join('')}</div>`; }


  function xuexiSearchUrl(word) {
    const base = 'https://www.xuexi.cn/dc12897105c8c496d783c5e4d3b680a2/9a75e290b9cf8cb8fb529a6e503db78d.html';
    const params = new URLSearchParams({
      query: word,
      page: '1',
      search_source: '1',
      program_id: '0',
      product_params: JSON.stringify({
        time_filter: 'all',
        type_filter: 'all',
        sort_method: 'integrated',
        wenhui_sort_method: 'near_far',
        search_method: 'all'
      }),
      _t: Date.now().toString()
    });
    return `${base}?${params.toString()}`;
  }

  function renderNotFound() {
    groupTitleEl.textContent = '该分组尚未启用';
    groupSummaryEl.textContent = '请返回总目录选择已启用分组。';
    triggerTableEl.innerHTML = '<div class="empty-state">当前组还没有数据文件。</div>';
    idiomListEl.innerHTML = '';
  }
  function renderLoadError() {
    groupTitleEl.textContent = `第${group.no}组：${group.title}`;
    groupSummaryEl.textContent = '没有找到对应数据文件。请检查 data/groups 目录下是否存在该组 JS 文件。';
    triggerTableEl.innerHTML = `<div class="empty-state">缺少数据文件：data/groups/${groupId}.js</div>`;
    idiomListEl.innerHTML = '';
  }
})();
