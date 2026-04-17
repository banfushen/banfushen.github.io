(function () {
  const root = document.getElementById('resume-app');
  const data = window.__RESUME_WORLD__;

  if (!root || !data) return;

  const state = {
    mode: (data.game.navigation && data.game.navigation.defaultMode) || 'prologue',
    activeChapterId: null,
    activeQuestId: null,
    quickResumeSection: 'profile',
    visitedChapterIds: [],
    hoveredChapterId: null
  };

  const chapterMap = new Map(data.game.chapters.map(chapter => [chapter.id, chapter]));
  const questMap = new Map(data.game.quests.map(quest => [quest.id, quest]));
  const experienceMap = new Map(data.facts.experiences.map(experience => [experience.id, experience]));
  const projectMap = new Map(data.facts.projects.map(project => [project.id, project]));
  const abilityMap = new Map(data.game.abilities.map(ability => [ability.id, ability]));
  const regionMap = new Map(data.game.regions.map(region => [region.id, region]));

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function badgeList(items, emptyText) {
    if (!items || !items.length) return `<p class="resume-empty">${escapeHtml(emptyText)}</p>`;
    return `<div class="resume-badges">${items.map(item => `<span class="resume-badge">${escapeHtml(item)}</span>`).join('')}</div>`;
  }

  function getActiveChapter() {
    return state.activeChapterId ? chapterMap.get(state.activeChapterId) : null;
  }

  function getActiveQuest() {
    return state.activeQuestId ? questMap.get(state.activeQuestId) : null;
  }

  function getFocusedChapterId() {
    return state.hoveredChapterId || state.activeChapterId || null;
  }

  function getChapterLinkClass(chapterId, baseClassName) {
    const classNames = [baseClassName];
    if (state.activeChapterId === chapterId) classNames.push('is-active');
    if (getFocusedChapterId() === chapterId) classNames.push('is-linked');
    return classNames.join(' ');
  }

  function getChapterRegionClass(chapterId, baseClassName) {
    const classNames = [baseClassName];
    if (getFocusedChapterId() === chapterId) classNames.push('is-linked');
    return classNames.join(' ');
  }

  function getChapterExperience(chapter) {
    return chapter && chapter.experienceId ? experienceMap.get(chapter.experienceId) : null;
  }

  function getQuestProjects(quest) {
    return (quest?.projectIds || []).map(id => projectMap.get(id)).filter(Boolean);
  }

  function getAbilityNames(ids) {
    return (ids || []).map(id => abilityMap.get(id)?.name).filter(Boolean);
  }

  function renderTopBar() {
    const links = data.facts.links;

    return `
      <header class="resume-topbar">
        <button class="resume-brand" data-action="go-prologue">Resume Journey</button>
        <nav class="resume-topnav">
          <button data-action="go-world-map">World Map</button>
          <button data-action="go-quick-resume">Quick Resume</button>
          <button data-action="go-codex">Codex</button>
          <a href="${escapeHtml(links.blog.url)}">${escapeHtml(links.blog.label)}</a>
          <a href="${escapeHtml(links.github.url)}" target="_blank" rel="noopener">${escapeHtml(links.github.label)}</a>
        </nav>
      </header>
    `;
  }

  function renderLeftPanel() {
    const chapters = data.game.chapters.filter(chapter => chapter.id !== 'chapter-final-form');
    const activeChapter = getActiveChapter();
    const activeQuest = getActiveQuest();
    const quests = activeChapter ? activeChapter.questIds.map(id => questMap.get(id)).filter(Boolean) : [];
    const unlockedNames = activeChapter ? getAbilityNames(activeChapter.unlockedAbilityIds) : [];

    return `
      <aside class="resume-sidebar">
        <section class="resume-panel">
          <h2>Chapter Panel</h2>
          <div class="resume-sidebar-list">
            ${chapters.map(chapter => `
              <button class="resume-nav-item${activeChapter?.id === chapter.id ? ' is-active' : ''}" data-action="open-chapter" data-chapter-id="${escapeHtml(chapter.id)}">
                ${escapeHtml(chapter.title)}
              </button>
            `).join('')}
            <button class="resume-nav-item${state.mode === 'codex' ? ' is-active' : ''}" data-action="go-codex">档案馆</button>
          </div>
        </section>

        <section class="resume-panel">
          <h2>Quest Log</h2>
          <div class="resume-sidebar-list">
            ${quests.length ? quests.map(quest => `
              <button class="resume-nav-item${activeQuest?.id === quest.id ? ' is-active' : ''}" data-action="open-quest" data-quest-id="${escapeHtml(quest.id)}">
                ${escapeHtml(quest.title)}
              </button>
            `).join('') : '<p class="resume-empty">选择章节后显示任务。</p>'}
          </div>
        </section>

        <section class="resume-panel">
          <h2>Unlocked Abilities</h2>
          ${badgeList(unlockedNames, '选择章节后显示能力。')}
        </section>
      </aside>
    `;
  }

  function renderPrologue() {
    const { profile } = data.facts;
    const { prologue } = data.game;

    return `
      <section class="resume-view resume-view--prologue">
        <p class="resume-eyebrow">${escapeHtml(prologue.title)}</p>
        <h1>${escapeHtml(profile.name)}</h1>
        <h2>${escapeHtml(profile.title)}</h2>
        <p class="resume-lead">${escapeHtml(profile.tagline)}</p>
        <div class="resume-actions">
          <button class="resume-button resume-button--primary" data-action="go-world-map">进入旅程 Enter Journey</button>
          <button class="resume-button" data-action="go-quick-resume">快速查看简历 Quick Resume</button>
        </div>
        <div class="resume-panel">
          <h3>Summary</h3>
          <ul class="resume-list">
            <li>${escapeHtml(profile.summary.short)}</li>
            ${prologue.introText.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      </section>
    `;
  }

  function renderQuickResume() {
    const { profile, experiences, projects, skills, links } = data.facts;

    return `
      <section class="resume-view resume-view--quick">
        <div class="resume-panel">
          <p class="resume-eyebrow">Quick Resume</p>
          <h1>${escapeHtml(profile.name)}</h1>
          <p class="resume-lead">${escapeHtml(profile.title)} · ${escapeHtml(profile.yearsOfExperience)} 年经验</p>
          <p>${escapeHtml(profile.summary.full)}</p>
        </div>

        <div class="resume-grid resume-grid--two">
          <section class="resume-panel">
            <h2>Experience Timeline</h2>
            <ul class="resume-list">
              ${experiences.map(item => `<li><strong>${escapeHtml(item.company)}</strong> · ${escapeHtml(item.stageLabel)}</li>`).join('')}
            </ul>
          </section>

          <section class="resume-panel">
            <h2>Projects Summary</h2>
            <ul class="resume-list">
              ${projects.map(item => `<li><strong>${escapeHtml(item.name)}</strong> · ${escapeHtml(item.type)}</li>`).join('')}
            </ul>
          </section>
        </div>

        <div class="resume-grid resume-grid--two">
          <section class="resume-panel">
            <h2>Skills Summary</h2>
            ${badgeList(skills.technical.map(skill => skill.name), '暂无技术栈')}
            <div class="resume-spacer"></div>
            ${badgeList(skills.capability.map(skill => skill.name), '暂无能力标签')}
          </section>

          <section class="resume-panel">
            <h2>Links</h2>
            <ul class="resume-list">
              <li><a href="${escapeHtml(links.blog.url)}">${escapeHtml(links.blog.label)}</a></li>
              <li><a href="${escapeHtml(links.github.url)}" target="_blank" rel="noopener">${escapeHtml(links.github.label)}</a></li>
              <li>${links.contact.email ? escapeHtml(links.contact.email) : '联系方式待补充'}</li>
            </ul>
          </section>
        </div>
      </section>
    `;
  }

  function renderWorldMap() {
    const chapters = data.game.chapters.filter(chapter => chapter.id !== 'chapter-final-form');
    const finalChapter = chapterMap.get('chapter-final-form');
    const regions = data.game.regions.filter(region => region.chapterId || region.codexEnabled);
    const chapterRegions = regions.filter(region => region.chapterId && region.chapterId !== 'chapter-final-form');
    const finalRegion = regions.find(region => region.chapterId === 'chapter-final-form');
    const archiveRegion = regions.find(region => region.codexEnabled);
    const activeChapter = getActiveChapter();
    const focusedChapter = getFocusedChapterId() ? chapterMap.get(getFocusedChapterId()) : null;
    const focusedExperience = getChapterExperience(focusedChapter);
    const regionToneClassNames = ['origin', 'transfer', 'builder'];

    return `
      <section class="resume-view resume-view--world-map">
        <section class="resume-map-shell">
          <section class="resume-map-stage resume-panel">
            <div class="resume-map-stage__header">
              <div>
                <p class="resume-eyebrow">World Map</p>
                <h1>职业成长地图</h1>
                <p class="resume-empty">点击节点进入详情。</p>
              </div>
            </div>

            <div class="resume-map-regions">
              ${chapterRegions.map((region, index) => {
                const chapter = chapterMap.get(region.chapterId);
                const experience = getChapterExperience(chapter);
                const toneClassName = regionToneClassNames[index] || 'origin';
                const stepLabel = `0${index + 1}`.slice(-2);
                const alignmentClassName = index % 2 === 0 ? 'resume-map-region--north' : 'resume-map-region--south';
                return `
                  <section class="${escapeHtml(getChapterRegionClass(chapter.id, `resume-map-region resume-map-region--${toneClassName} ${alignmentClassName}`))}">
                    <div class="resume-map-region__label">
                      <span class="resume-map-region__step">Region ${escapeHtml(stepLabel)}</span>
                      <strong>${escapeHtml(region.name)}</strong>
                      <span>${escapeHtml(experience?.company || chapter.subtitle)}</span>
                    </div>
                    <button class="${escapeHtml(getChapterLinkClass(chapter.id, 'resume-map-node resume-map-node--band'))}" data-action="open-chapter" data-chapter-id="${escapeHtml(chapter.id)}" data-hover-chapter-id="${escapeHtml(chapter.id)}">
                      <span class="resume-map-node__badge">${escapeHtml(stepLabel)}</span>
                      <span class="resume-map-node__region">${escapeHtml(region.name)}</span>
                      <span class="resume-map-node__chapter">${escapeHtml(chapter.title)}</span>
                      <span class="resume-map-node__subtitle">${escapeHtml(chapter.subtitle)}</span>
                    </button>
                  </section>
                `;
              }).join('<span class="resume-map-connector"></span>')}
            </div>

            ${(finalChapter || archiveRegion) ? `
              <section class="resume-map-terminal-shell">
                <span class="resume-map-terminal-shell__label">Terminal</span>
                <section class="resume-map-terminal">
                  ${finalChapter && finalRegion ? `
                    <button class="${escapeHtml(getChapterLinkClass(finalChapter.id, 'resume-map-node resume-map-node--terminal'))}" data-action="open-chapter" data-chapter-id="${escapeHtml(finalChapter.id)}" data-hover-chapter-id="${escapeHtml(finalChapter.id)}">
                      <span class="resume-map-node__badge">Final</span>
                      <span class="resume-map-node__region">${escapeHtml(finalRegion.name)}</span>
                      <span class="resume-map-node__chapter">${escapeHtml(finalChapter.title)}</span>
                      <span class="resume-map-node__subtitle">${escapeHtml(finalChapter.subtitle)}</span>
                    </button>
                  ` : ''}
                  ${archiveRegion ? `
                    <button class="resume-map-node resume-map-node--archive resume-map-node--terminal" data-action="go-codex">
                      <span class="resume-map-node__badge">Codex</span>
                      <span class="resume-map-node__region">${escapeHtml(archiveRegion.name)}</span>
                      <span class="resume-map-node__chapter">档案馆</span>
                      <span class="resume-map-node__subtitle">进入扩展记录</span>
                    </button>
                  ` : ''}
                </section>
              </section>
            ` : ''}
          </section>

          <aside class="resume-map-rail">
            <section class="resume-map-summary resume-panel">
              <div>
                <p class="resume-eyebrow">Map Status</p>
                <h2>${escapeHtml(focusedChapter?.title || '当前焦点')}</h2>
                <p class="resume-lead">${escapeHtml(focusedExperience?.company || focusedChapter?.subtitle || '先选择章节节点')}</p>
              </div>
              <div class="resume-map-hero__stats">
                <div class="resume-map-stat">
                  <span class="resume-map-stat__label">已解锁</span>
                  <strong>${escapeHtml(String(state.visitedChapterIds.length || 0))}</strong>
                </div>
                <div class="resume-map-stat">
                  <span class="resume-map-stat__label">当前</span>
                  <strong>${escapeHtml(activeChapter ? activeChapter.title : '未选择')}</strong>
                </div>
              </div>
            </section>

            <section class="resume-map-overview resume-panel">
              <div class="resume-map-stage__header">
                <div>
                  <h2>Chapter Overview</h2>
                </div>
              </div>
              <div class="resume-map-overview__list">
                ${chapters.map(chapter => {
                  const experience = getChapterExperience(chapter);
                  return `
                    <button class="${escapeHtml(getChapterLinkClass(chapter.id, 'resume-card resume-card--interactive resume-card--chapter'))}" data-action="open-chapter" data-chapter-id="${escapeHtml(chapter.id)}" data-hover-chapter-id="${escapeHtml(chapter.id)}">
                      <p class="resume-eyebrow">${escapeHtml(String(chapters.indexOf(chapter) + 1).padStart(2, '0'))}</p>
                      <strong>${escapeHtml(chapter.subtitle)}</strong>
                      <span>${escapeHtml(experience?.company || '')}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </section>
          </aside>
        </section>
      </section>
    `;
  }

  function renderChapterDetail() {
    const chapter = getActiveChapter();
    if (!chapter) return renderWorldMap();

    const experience = getChapterExperience(chapter);
    const quests = chapter.questIds.map(id => questMap.get(id)).filter(Boolean);
    const unlocked = getAbilityNames(chapter.unlockedAbilityIds);

    return `
      <section class="resume-view resume-view--chapter">
        <div class="resume-panel">
          <p class="resume-eyebrow">${escapeHtml(chapter.title)}</p>
          <h1>${escapeHtml(chapter.subtitle)}</h1>
          <p class="resume-lead">${escapeHtml(experience?.company || '职业阶段')}</p>
        </div>

        <div class="resume-grid resume-grid--two">
          <section class="resume-panel">
            <h2>Story Panel</h2>
            <ul class="resume-list">
              ${(experience?.outcomes || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </section>

          <section class="resume-panel">
            <h2>Tech Stack</h2>
            ${badgeList(experience?.techStack || [], '暂无技术栈')}
          </section>
        </div>

        <div class="resume-grid resume-grid--two">
          <section class="resume-panel">
            <h2>Quest List</h2>
            <div class="resume-sidebar-list">
              ${quests.map(quest => `
                <button class="resume-nav-item${state.activeQuestId === quest.id ? ' is-active' : ''}" data-action="open-quest" data-quest-id="${escapeHtml(quest.id)}">
                  ${escapeHtml(quest.title)}
                </button>
              `).join('')}
            </div>
          </section>

          <section class="resume-panel">
            <h2>Unlocked Abilities</h2>
            ${badgeList(unlocked, '暂无能力')}
          </section>
        </div>
      </section>
    `;
  }

  function renderQuestDetail() {
    const quest = getActiveQuest();
    if (!quest) return renderChapterDetail();

    const projects = getQuestProjects(quest);
    const rewardNames = getAbilityNames(quest.rewardAbilityIds);
    const chapter = chapterMap.get(quest.chapterId);

    return `
      <section class="resume-view resume-view--quest">
        <div class="resume-panel">
          <p class="resume-eyebrow">Quest Detail</p>
          <h1>${escapeHtml(quest.title)}</h1>
          <p class="resume-lead">${escapeHtml(chapter?.title || '')} · ${escapeHtml(quest.questType)}</p>
        </div>

        ${projects.map(project => `
          <section class="resume-panel">
            <h2>${escapeHtml(project.name)}</h2>
            <p><strong>类型：</strong>${escapeHtml(project.type)}</p>
            <p><strong>角色：</strong>${escapeHtml(project.role || '待补充')}</p>
            <h3>做了什么</h3>
            <ul class="resume-list">
              ${project.summary.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
            <h3>关键结果</h3>
            <ul class="resume-list">
              ${project.impact.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </section>
        `).join('')}

        <section class="resume-panel">
          <h2>Reward Abilities</h2>
          ${badgeList(rewardNames, '暂无能力奖励')}
        </section>
      </section>
    `;
  }

  function renderCodex() {
    const entries = data.game.codex.entries.map(entry => {
      const link = data.facts.links[entry.linkKey];
      return { title: entry.title, link };
    }).filter(item => item.link);

    return `
      <section class="resume-view resume-view--codex">
        <div class="resume-panel">
          <p class="resume-eyebrow">Codex</p>
          <h1>${escapeHtml(data.game.codex.title)}</h1>
          <p class="resume-lead">${escapeHtml(data.game.codex.subtitle)}</p>
        </div>

        <div class="resume-grid resume-grid--two">
          ${entries.map(item => `
            <section class="resume-panel">
              <h2>${escapeHtml(item.title)}</h2>
              <p>技术记录、长期观察与扩展阅读入口。</p>
              <a class="resume-button" href="${escapeHtml(item.link.url)}"${/^https?:/i.test(item.link.url) ? ' target="_blank" rel="noopener"' : ''}>进入 ${escapeHtml(item.link.label)}</a>
            </section>
          `).join('')}
        </div>
      </section>
    `;
  }

  function renderStatusBar() {
    const chapter = getActiveChapter();
    const quest = getActiveQuest();
    const modeLabelMap = {
      prologue: '起始之章',
      'world-map': 'World Map',
      chapter: 'Chapter Detail',
      quest: 'Quest Detail',
      codex: 'Codex',
      'quick-resume': 'Quick Resume'
    };
    const unlocked = chapter ? getAbilityNames(chapter.unlockedAbilityIds).slice(0, 3).join(' / ') : data.facts.profile.currentRoleTheme;

    return `
      <footer class="resume-statusbar">
        <span>Status: ${escapeHtml(modeLabelMap[state.mode] || state.mode)}</span>
        <span>当前章节：${escapeHtml(chapter?.title || '未选择')}</span>
        <span>当前任务：${escapeHtml(quest?.title || '未选择')}</span>
        <span>已解锁：${escapeHtml(unlocked || '无')}</span>
      </footer>
    `;
  }

  function renderMainStage() {
    switch (state.mode) {
      case 'quick-resume':
        return renderQuickResume();
      case 'world-map':
        return renderWorldMap();
      case 'chapter':
        return renderChapterDetail();
      case 'quest':
        return renderQuestDetail();
      case 'codex':
        return renderCodex();
      case 'prologue':
      default:
        return renderPrologue();
    }
  }

  function render() {
    root.innerHTML = `
      <div class="resume-app">
        ${renderTopBar()}
        <div class="resume-layout${state.mode === 'world-map' ? ' resume-layout--map-focus' : ''}">
          ${state.mode === 'world-map' ? '' : renderLeftPanel()}
          <main class="resume-main-stage${state.mode === 'world-map' ? ' resume-main-stage--map-focus' : ''}">
            ${renderMainStage()}
          </main>
        </div>
        ${renderStatusBar()}
      </div>
    `;
  }

  function visitChapter(chapterId) {
    if (!chapterId) return;
    state.activeChapterId = chapterId;
    state.activeQuestId = null;
    if (!state.visitedChapterIds.includes(chapterId)) state.visitedChapterIds.push(chapterId);
  }

  root.addEventListener('mouseover', event => {
    const target = event.target.closest('[data-hover-chapter-id]');
    const hoveredChapterId = target?.dataset.hoverChapterId || null;
    if (state.hoveredChapterId === hoveredChapterId) return;
    state.hoveredChapterId = hoveredChapterId;
    render();
  });

  root.addEventListener('mouseout', event => {
    const target = event.target.closest('[data-hover-chapter-id]');
    if (!target) return;
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && target.contains(relatedTarget)) return;
    if (relatedTarget && relatedTarget.closest(`[data-hover-chapter-id="${target.dataset.hoverChapterId}"]`)) return;
    if (!state.hoveredChapterId) return;
    state.hoveredChapterId = null;
    render();
  });

  root.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const { action, chapterId, questId } = target.dataset;

    switch (action) {
      case 'go-prologue':
        state.mode = 'prologue';
        break;
      case 'go-world-map':
        state.mode = 'world-map';
        break;
      case 'go-quick-resume':
        state.mode = 'quick-resume';
        break;
      case 'go-codex':
        state.mode = 'codex';
        break;
      case 'open-chapter':
        visitChapter(chapterId);
        state.mode = 'chapter';
        break;
      case 'open-quest': {
        const quest = questMap.get(questId);
        if (!quest) break;
        visitChapter(quest.chapterId);
        state.activeQuestId = questId;
        state.mode = 'quest';
        break;
      }
      default:
        return;
    }

    render();
  });

  render();
})();
