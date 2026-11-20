// Leonida Legend — GTA 6 trophy tracker.
// Loads app/data/trophies.json, renders the checklist, saves progress in
// localStorage, and offers export / import, kind filters, search, a spoiler
// setting and a roadmap to the platinum. No network requests besides the
// local data file; source links open only when the reader follows them.

(function () {
  'use strict';

  var STORAGE_KEY = 'leonida-legend-v1';
  var DATA_URL = 'data/trophies.json';

  var trophies = [];
  var sourceLinks = {};
  var earned = {};
  var spoilersOn = false;
  var kindFilter = 'all';
  var searchQuery = '';
  var selectedId = null;
  var currentView = 'tracker';

  var ROADMAP_STAGES = [
    {
      title: 'Play the story',
      text: 'Chapters 1 to 4, the named story missions and the final mission. The mission trophies are flagged missable: play them when they come.',
      ids: [3, 4, 5, 6, 2, 8, 9, 10, 11, 12, 13, 7]
    },
    {
      title: 'Finish the contact strands',
      text: 'Each contact has a final mission of their own. Work through Andy, Kenton, Billy, Randy and Tyrone in any order.',
      ids: [22, 23, 24, 26, 27]
    },
    {
      title: 'Strangers, activities and skills',
      text: 'Stranger strands, stunts, races, the shooting range, fishing, arcade games, meditation spots and the challenge list.',
      ids: [25, 15, 16, 17, 18, 19, 20, 21, 28, 29, 32]
    },
    {
      title: 'Collectibles and exploration',
      text: 'Cards, WAiNK spots, vehicles and the whole map of Leonida, plus the garage properties and vehicle registrations.',
      ids: [30, 31, 35, 42, 54, 55]
    },
    {
      title: 'Open-world feats, money and cleanup',
      text: 'Heists, escapes, the choice trophies and the money trophies. Finish with 100% completion, then the platinum.',
      ids: [33, 34, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 14, 1]
    }
  ];

  var KIND_LABELS = {
    story: 'Story',
    missable: 'Missable',
    collectibles: 'Collectibles',
    activities: 'Activities',
    online: 'Online',
    platinum: 'Platinum'
  };

  function $(id) { return document.getElementById(id); }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.earned)) {
        saved.earned.forEach(function (id) { earned[id] = true; });
      }
      if (saved && typeof saved.spoilers === 'boolean') spoilersOn = saved.spoilers;
      if (saved && typeof saved.kind === 'string') kindFilter = saved.kind;
    } catch (err) { /* a corrupt save starts fresh */ }
  }

  function saveState() {
    var earnedIds = Object.keys(earned).map(Number).sort(function (a, b) { return a - b; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: earnedIds, spoilers: spoilersOn, kind: kindFilter
    }));
  }

  function trophyById(id) {
    for (var i = 0; i < trophies.length; i++) {
      if (trophies[i].id === id) return trophies[i];
    }
    return null;
  }

  function isHiddenBySpoilers(t) {
    return spoilersOn && t.kind === 'story' && !earned[t.id];
  }

  function displayName(t) {
    return isHiddenBySpoilers(t) ? 'Hidden trophy' : t.name;
  }

  function displayDescription(t) {
    return isHiddenBySpoilers(t)
      ? 'A story trophy. Earn it to reveal its name and description.'
      : t.description;
  }

  function gradeChip(t) {
    var span = document.createElement('span');
    span.className = 'chip ' + t.grade;
    span.textContent = t.grade;
    return span;
  }

  function kindChip(t) {
    var span = document.createElement('span');
    span.className = 'chip kind';
    span.textContent = KIND_LABELS[t.kind] || t.kind;
    return span;
  }

  function tagChips(t, container) {
    container.appendChild(gradeChip(t));
    container.appendChild(kindChip(t));
    if (t.missable) {
      var miss = document.createElement('span');
      miss.className = 'chip missable';
      miss.textContent = 'Missable';
      container.appendChild(miss);
    }
    if (t.hidden) {
      var hid = document.createElement('span');
      hid.className = 'chip hidden-flag';
      hid.textContent = 'Hidden on PSN';
      container.appendChild(hid);
    }
    if (t.count) {
      var count = document.createElement('span');
      count.className = 'chip count';
      count.textContent = 'PSN tracks: ' + t.count;
      container.appendChild(count);
    }
  }

  function filteredTrophies() {
    var q = searchQuery.trim().toLowerCase();
    return trophies.filter(function (t) {
      if (kindFilter === 'missable' && !t.missable) return false;
      if (kindFilter === 'online') return false;
      if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
      if (q && t.name.toLowerCase().indexOf(q) === -1 &&
          t.description.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function renderList() {
    var list = $('trophyList');
    list.innerHTML = '';
    var shown = filteredTrophies();
    if (kindFilter === 'online') {
      var note = document.createElement('li');
      note.className = 'empty-note';
      note.textContent = 'No online trophies in this list: all 55 trophies are earned in single-player, so the Online filter is empty by design.';
      list.appendChild(note);
    } else if (shown.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'empty-note';
      empty.textContent = 'No trophies match this filter and search. Clear the search or pick another kind.';
      list.appendChild(empty);
    }
    shown.forEach(function (t) { list.appendChild(trophyRow(t)); });
    $('listCount').textContent = shown.length + ' of 55 trophies shown';
  }

  function trophyRow(t) {
    var li = document.createElement('li');
    li.className = 'trophy-item' + (earned[t.id] ? ' earned' : '') +
      (selectedId === t.id ? ' selected' : '');
    li.dataset.id = t.id;

    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = !!earned[t.id];
    box.setAttribute('aria-label', 'Mark ' + displayName(t) + ' as earned');
    box.addEventListener('click', function (ev) {
      ev.stopPropagation();
      toggleEarned(t.id);
    });
    li.appendChild(box);

    var main = document.createElement('div');
    main.className = 'trophy-main';
    var name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = displayName(t);
    main.appendChild(name);
    var desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = displayDescription(t);
    main.appendChild(desc);
    var tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tagChips(t, tags);
    main.appendChild(tags);
    li.appendChild(main);

    li.addEventListener('click', function () {
      selectedId = t.id;
      renderList();
      renderDetail();
    });
    return li;
  }

  function renderDetail() {
    var pane = $('detailPane');
    pane.innerHTML = '';
    var t = selectedId === null ? null : trophyById(selectedId);
    if (!t) {
      var p = document.createElement('p');
      p.className = 'detail-empty';
      p.textContent = 'Select a trophy to read its guide, its sources and when it can be missed.';
      pane.appendChild(p);
      return;
    }

    var tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tagChips(t, tags);
    pane.appendChild(tags);

    var h = document.createElement('h2');
    h.textContent = displayName(t);
    pane.appendChild(h);

    var official = document.createElement('p');
    official.className = 'official';
    official.textContent = 'Official: "' + displayDescription(t) + '"';
    pane.appendChild(official);

    if (earned[t.id]) {
      var done = document.createElement('p');
      done.className = 'earned-line';
      done.textContent = 'Earned — nice work, Leonida Legend.';
      pane.appendChild(done);
    }

    if (isHiddenBySpoilers(t)) {
      var note = document.createElement('p');
      note.className = 'spoiler-note';
      note.textContent = 'Spoilers are hidden: turn off "Hide story spoilers" or earn this trophy to read its guide.';
      pane.appendChild(note);
      return;
    }

    var guideH = document.createElement('h3');
    guideH.textContent = 'Guide';
    pane.appendChild(guideH);
    var guide = document.createElement('p');
    guide.className = 'guide-text';
    guide.textContent = t.guide;
    pane.appendChild(guide);

    var stage = roadmapStageOf(t.id);
    if (stage) {
      var stageH = document.createElement('h3');
      stageH.textContent = 'Roadmap';
      pane.appendChild(stageH);
      var stageP = document.createElement('p');
      stageP.textContent = stage;
      pane.appendChild(stageP);
    }

    var srcH = document.createElement('h3');
    srcH.textContent = 'Sources';
    pane.appendChild(srcH);
    var srcList = document.createElement('ul');
    srcList.className = 'sources';
    (t.sources || []).forEach(function (key) {
      var link = sourceLinks[key];
      var li = document.createElement('li');
      if (link) {
        var a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = link.name;
        li.appendChild(a);
      } else {
        li.textContent = key;
      }
      srcList.appendChild(li);
    });
    var own = document.createElement('li');
    own.textContent = 'Guide text: our own words from the official description, not yet checked in the game.';
    srcList.appendChild(own);
    pane.appendChild(srcList);
  }

  function roadmapStageOf(id) {
    for (var i = 0; i < ROADMAP_STAGES.length; i++) {
      if (ROADMAP_STAGES[i].ids.indexOf(id) !== -1) {
        return 'Stage ' + (i + 1) + ': ' + ROADMAP_STAGES[i].title;
      }
    }
    return null;
  }

  function renderRoadmap() {
    var list = $('roadmapList');
    list.innerHTML = '';
    ROADMAP_STAGES.forEach(function (stage, index) {
      var li = document.createElement('li');
      var h = document.createElement('h3');
      h.textContent = stage.title;
      li.appendChild(h);
      var p = document.createElement('p');
      p.textContent = stage.text;
      li.appendChild(p);
      var ul = document.createElement('ul');
      stage.ids.forEach(function (id) {
        var t = trophyById(id);
        if (!t) return;
        var item = document.createElement('li');
        item.textContent = (earned[id] ? '✓ ' : '') + t.name + ' (' + t.grade + ')' +
          (t.missable ? ' — missable' : '');
        ul.appendChild(item);
      });
      li.appendChild(ul);
      var count = document.createElement('p');
      count.className = 'stage-count';
      var done = stage.ids.filter(function (id) { return earned[id]; }).length;
      count.textContent = done + ' of ' + stage.ids.length + ' earned in this stage';
      li.appendChild(count);
      list.appendChild(li);
    });
  }

  function renderMissable() {
    var list = $('missableList');
    list.innerHTML = '';
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      list.appendChild(trophyRow(t));
    });
  }

  function renderProgress() {
    var total = trophies.length;
    var count = Object.keys(earned).length;
    $('earnedCount').textContent = count;
    $('progressFill').style.width = (total ? (count / total * 100) : 0) + '%';
    var grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    trophies.forEach(function (t) {
      if (earned[t.id]) grades[t.grade] = (grades[t.grade] || 0) + 1;
    });
    $('progressSub').textContent = grades.platinum + ' platinum · ' + grades.gold +
      ' gold · ' + grades.silver + ' silver · ' + grades.bronze + ' bronze';
  }

  function renderAll() {
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
    renderMissable();
  }

  function toggleEarned(id) {
    if (earned[id]) delete earned[id]; else earned[id] = true;
    saveState();
    renderAll();
  }

  function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(function (section) {
      section.classList.toggle('active', section.id === view + 'View');
    });
  }

  function exportProgress() {
    var data = {
      app: 'Leonida Legend — GTA 6 trophy tracker',
      exportedAt: new Date().toISOString(),
      earned: Object.keys(earned).map(Number).sort(function (a, b) { return a - b; })
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-legend-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(ids)) throw new Error('no earned list');
        earned = {};
        ids.forEach(function (id) {
          if (trophyById(Number(id))) earned[Number(id)] = true;
        });
        saveState();
        renderAll();
      } catch (err) {
        alert('That file is not a Leonida Legend progress export.');
      }
    };
    reader.readAsText(file);
  }

  function init(data) {
    trophies = data.trophies || [];
    (data.sources || []).forEach(function (s) { sourceLinks[s.id] = s; });
    loadState();

    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.kind === kindFilter);
      btn.addEventListener('click', function () {
        kindFilter = btn.dataset.kind;
        document.querySelectorAll('.filter-btn').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        saveState();
        renderList();
      });
    });

    $('spoilerToggle').checked = spoilersOn;
    $('spoilerToggle').addEventListener('change', function (ev) {
      spoilersOn = ev.target.checked;
      saveState();
      renderAll();
    });

    $('searchInput').addEventListener('input', function (ev) {
      searchQuery = ev.target.value;
      renderList();
    });

    document.querySelectorAll('.view-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setView(btn.dataset.view); });
    });

    $('exportBtn').addEventListener('click', exportProgress);
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
      ev.target.value = '';
    });
    $('resetBtn').addEventListener('click', function () {
      if (confirm('Clear all earned trophies?')) {
        earned = {};
        saveState();
        renderAll();
      }
    });

    renderAll();
  }

  fetch(DATA_URL)
    .then(function (res) { return res.json(); })
    .then(init)
    .catch(function (err) {
      $('trophyList').innerHTML = '<li class="empty-note">Could not load data/trophies.json: ' +
        String(err && err.message || err) + '</li>';
    });
})();
