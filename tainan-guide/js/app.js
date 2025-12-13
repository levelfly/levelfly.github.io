/**
 * 台南旅遊全方位指南 - Main Application
 */

// ===== Global State =====
const state = {
  currentCategory: 'attractions',
  currentSubCategory: null,
  activeFilters: [],
  searchQuery: '',
  data: {
    attractions: null,
    restaurants: null,
    snacks: null,
    nightmarkets: null,
    drinks: null,
    hotels: null,
    transport: null,
    itineraries: null
  }
};

// ===== Main Categories Configuration =====
const mainCategories = [
  { id: 'attractions', name: '景點', icon: '🏛️' },
  { id: 'restaurants', name: '餐廳', icon: '🍽️' },
  { id: 'snacks', name: '小吃', icon: '🍜' },
  { id: 'nightmarkets', name: '夜市', icon: '🌙' },
  { id: 'drinks', name: '飲料甜點', icon: '🧋' },
  { id: 'hotels', name: '住宿', icon: '🏨' },
  { id: 'transport', name: '交通', icon: '🚗' },
  { id: 'itineraries', name: '行程', icon: '📅' }
];

// ===== DOM Elements =====
const elements = {
  categoryNav: null,
  subcategoryNav: null,
  cardGrid: null,
  modal: null,
  searchInput: null
};

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', async () => {
  initElements();
  renderCategoryNav();
  renderBottomNav();
  await loadData(state.currentCategory);
  renderContent();
  initEventListeners();
});

// ===== Initialize DOM Elements =====
function initElements() {
  elements.categoryNav = document.getElementById('category-nav');
  elements.subcategoryNav = document.getElementById('subcategory-nav');
  elements.cardGrid = document.getElementById('card-grid');
  elements.modal = document.getElementById('detail-modal');
  elements.searchInput = document.getElementById('search-input');
}

// ===== Data Loading =====
async function loadData(category) {
  if (state.data[category]) return state.data[category];

  try {
    showLoading();
    const response = await fetch(`data/${category}.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    state.data[category] = await response.json();
    return state.data[category];
  } catch (error) {
    console.error(`Error loading ${category} data:`, error);
    showError(`無法載入${category}資料`);
    return null;
  }
}

// ===== Render Functions =====

// Render Main Category Navigation
function renderCategoryNav() {
  if (!elements.categoryNav) return;

  elements.categoryNav.innerHTML = mainCategories.map(cat => `
    <button class="category-nav__item ${cat.id === state.currentCategory ? 'active' : ''}"
            data-category="${cat.id}">
      <span class="category-nav__icon">${cat.icon}</span>
      <span class="category-nav__name">${cat.name}</span>
    </button>
  `).join('');
}

// Render Subcategory Navigation
function renderSubcategoryNav(data) {
  if (!elements.subcategoryNav || !data || !data.categories) {
    if (elements.subcategoryNav) {
      elements.subcategoryNav.innerHTML = '';
    }
    return;
  }

  const categories = data.categories;
  const items = Object.entries(categories).map(([key, value]) => `
    <button class="subcategory-nav__item ${key === state.currentSubCategory ? 'active' : ''}"
            data-subcategory="${key}">
      ${value}
    </button>
  `);

  elements.subcategoryNav.innerHTML = `
    <button class="subcategory-nav__item ${!state.currentSubCategory ? 'active' : ''}"
            data-subcategory="">
      全部
    </button>
    ${items.join('')}
  `;
}

// Render Bottom Navigation
function renderBottomNav() {
  const bottomNav = document.getElementById('bottom-nav');
  if (!bottomNav) return;

  bottomNav.innerHTML = mainCategories.slice(0, 5).map(cat => `
    <a href="#" class="bottom-nav__item ${cat.id === state.currentCategory ? 'active' : ''}"
       data-category="${cat.id}">
      <span class="bottom-nav__icon">${cat.icon}</span>
      <span class="bottom-nav__label">${cat.name}</span>
    </a>
  `).join('');
}

// Render Main Content
function renderContent() {
  const data = state.data[state.currentCategory];
  if (!data) {
    showLoading();
    return;
  }

  renderSubcategoryNav(data);

  switch (state.currentCategory) {
    case 'nightmarkets':
      renderNightMarkets(data);
      break;
    case 'transport':
      renderTransport(data);
      break;
    case 'itineraries':
      renderItineraries(data);
      break;
    default:
      renderCards(data);
  }
}

// Render Cards (Generic)
function renderCards(data) {
  if (!elements.cardGrid) return;

  let items = getItemsArray(data);

  // Apply filters
  if (state.currentSubCategory) {
    items = items.filter(item => {
      if (Array.isArray(item.category)) {
        return item.category.includes(state.currentSubCategory);
      }
      return item.category === state.currentSubCategory;
    });
  }

  // Apply search
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.address && item.address.toLowerCase().includes(query))
    );
  }

  if (items.length === 0) {
    showEmpty();
    return;
  }

  elements.cardGrid.innerHTML = items.map(item => createCardHTML(item)).join('');
}

// Get items array from data
function getItemsArray(data) {
  if (data.attractions) return data.attractions;
  if (data.restaurants) return data.restaurants;
  if (data.snacks) return data.snacks;
  if (data.drinks) return data.drinks;
  if (data.hotels) return data.hotels;
  return [];
}

// Create Card HTML
function createCardHTML(item) {
  const priceDisplay = getPriceDisplay(item.priceLevel);
  const ratingDisplay = item.rating ? `⭐ ${item.rating}` : '';
  const tags = getItemTags(item);

  return `
    <article class="card" data-id="${item.id}">
      <div class="card__image card__image--placeholder">
        ${item.name.charAt(0)}
      </div>
      <div class="card__content">
        <div class="card__header">
          <h3 class="card__title">${item.name}</h3>
          <span class="card__rating">${ratingDisplay}</span>
        </div>
        <div class="card__tags">
          ${tags.map(tag => `<span class="card__tag ${tag.class || ''}">${tag.text}</span>`).join('')}
        </div>
        <p class="card__description">${item.description || ''}</p>
        <div class="card__meta">
          ${item.address ? `<div class="card__meta-item">📍 ${item.address}</div>` : ''}
          ${item.hours ? `<div class="card__meta-item">🕐 ${item.hours}</div>` : ''}
        </div>
        <div class="card__footer">
          <span class="card__price">${priceDisplay}</span>
          <button class="card__action" onclick="showDetail('${item.id}')">詳細資訊</button>
        </div>
      </div>
    </article>
  `;
}

// Get price display
function getPriceDisplay(level) {
  if (level === undefined || level === null) return '';
  if (level === 0) return '免費';
  return Array(level).fill('$').join('');
}

// Get item tags
function getItemTags(item) {
  const tags = [];

  if (item.features) {
    item.features.slice(0, 3).forEach(f => {
      const isMichelin = f.includes('米其林') || f.includes('必比登');
      tags.push({
        text: f,
        class: isMichelin ? 'card__tag--michelin' : ''
      });
    });
  }

  return tags;
}

// Render Night Markets
function renderNightMarkets(data) {
  if (!elements.cardGrid || !data.nightmarkets) return;

  // Render schedule first
  const scheduleHTML = renderScheduleGrid(data.scheduleByDay);

  // Then render market cards
  const marketsHTML = data.nightmarkets.map(market => `
    <article class="card" data-id="${market.id}">
      <div class="card__image card__image--placeholder">🌙</div>
      <div class="card__content">
        <div class="card__header">
          <h3 class="card__title">${market.name}</h3>
          <span class="card__rating">${market.rating ? `⭐ ${market.rating}` : ''}</span>
        </div>
        <div class="card__tags">
          ${market.features ? market.features.map(f => `<span class="card__tag">${f}</span>`).join('') : ''}
        </div>
        <p class="card__description">${market.description}</p>
        <div class="card__meta">
          <div class="card__meta-item">📍 ${market.address}</div>
          <div class="card__meta-item">🕐 ${market.hours}</div>
        </div>
        <div class="card__footer">
          <span class="card__price">攤位約 ${market.stalls ? market.stalls.length : '數十'} 攤</span>
          <button class="card__action" onclick="showNightMarketDetail('${market.id}')">查看攤位</button>
        </div>
      </div>
    </article>
  `).join('');

  elements.cardGrid.innerHTML = scheduleHTML + `<div class="card-grid">${marketsHTML}</div>`;
}

// Render Schedule Grid
function renderScheduleGrid(scheduleByDay) {
  if (!scheduleByDay) return '';

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return `
    <div class="schedule-section mb-lg">
      <h3 class="mb-md">本週夜市營業表</h3>
      <div class="schedule-grid">
        ${days.map((day, index) => `
          <div class="schedule-day ${index === todayIndex ? 'today' : ''}">
            <div class="schedule-day__name">週${dayNames[index]}</div>
            <div class="schedule-day__markets">
              ${scheduleByDay[day] ? scheduleByDay[day].join('<br>') : '-'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render Transport
function renderTransport(data) {
  if (!elements.cardGrid || !data) return;

  let html = '';

  // Car Rentals
  if (data.carRentals && data.carRentals.length > 0) {
    html += `<h3 class="mb-md">租車公司</h3><div class="card-grid mb-lg">`;
    html += data.carRentals.map(item => createTransportCardHTML(item, '🚗')).join('');
    html += `</div>`;
  }

  // Scooter Rentals
  if (data.scooterRentals && data.scooterRentals.length > 0) {
    html += `<h3 class="mb-md">機車租借</h3><div class="card-grid mb-lg">`;
    html += data.scooterRentals.map(item => createTransportCardHTML(item, '🛵')).join('');
    html += `</div>`;
  }

  // Parking Lots
  if (data.parkingLots && data.parkingLots.length > 0) {
    html += `<h3 class="mb-md">停車場</h3><div class="card-grid mb-lg">`;
    html += data.parkingLots.map(item => createParkingCardHTML(item)).join('');
    html += `</div>`;
  }

  // Public Transport Tips
  if (data.publicTransport) {
    html += renderPublicTransport(data.publicTransport);
  }

  elements.cardGrid.innerHTML = html;
}

// Create Transport Card HTML
function createTransportCardHTML(item, icon) {
  return `
    <article class="card">
      <div class="card__content">
        <div class="card__header">
          <h3 class="card__title">${icon} ${item.name}</h3>
        </div>
        <p class="card__description">${item.description}</p>
        <div class="card__meta">
          <div class="card__meta-item">📍 ${item.address}</div>
          <div class="card__meta-item">📞 ${item.phone || '-'}</div>
          <div class="card__meta-item">💰 ${item.priceRange}</div>
        </div>
        <div class="card__footer">
          ${item.mapUrl ? `<a href="${item.mapUrl}" target="_blank" class="card__action">查看地圖</a>` : ''}
        </div>
      </div>
    </article>
  `;
}

// Create Parking Card HTML
function createParkingCardHTML(item) {
  return `
    <article class="card">
      <div class="card__content">
        <div class="card__header">
          <h3 class="card__title">🅿️ ${item.name}</h3>
        </div>
        <p class="card__description">${item.description || ''}</p>
        <div class="card__meta">
          <div class="card__meta-item">📍 ${item.address}</div>
          <div class="card__meta-item">💰 ${item.priceRange}</div>
          ${item.nearbyAttractions ? `<div class="card__meta-item">📍 鄰近：${item.nearbyAttractions.join('、')}</div>` : ''}
        </div>
        <div class="card__footer">
          ${item.mapUrl ? `<a href="${item.mapUrl}" target="_blank" class="card__action">查看地圖</a>` : ''}
        </div>
      </div>
    </article>
  `;
}

// Render Public Transport Info
function renderPublicTransport(transport) {
  let html = `<h3 class="mb-md">大眾運輸</h3>`;

  if (transport.busRoutes) {
    html += `<div class="itinerary-card mb-md">
      <h4 class="mb-sm">🚌 實用公車路線</h4>
      ${transport.busRoutes.map(route => `
        <div class="mb-sm">
          <strong>${route.name}</strong>
          <p class="card__description">${route.description}</p>
          <small>主要站點：${route.keyStops.join(' → ')}</small>
        </div>
      `).join('')}
    </div>`;
  }

  if (transport.tips) {
    html += `<div class="itinerary-card">
      <h4 class="mb-sm">💡 交通小提醒</h4>
      <ul style="padding-left: 20px;">
        ${transport.tips.map(tip => `<li>${tip}</li>`).join('')}
      </ul>
    </div>`;
  }

  return html;
}

// Render Itineraries
function renderItineraries(data) {
  if (!elements.cardGrid || !data.itineraries) return;

  elements.cardGrid.innerHTML = data.itineraries.map(itinerary => `
    <div class="itinerary-card">
      <div class="itinerary-card__header">
        <h3 class="itinerary-card__title">${itinerary.name}</h3>
        <span class="itinerary-card__badge">${itinerary.duration}</span>
      </div>
      <p class="card__description mb-sm">${itinerary.description}</p>
      <div class="itinerary-card__highlights mb-sm">
        ${itinerary.highlights.map(h => `<span class="itinerary-card__highlight">${h}</span>`).join('')}
      </div>
      <div class="card__meta mb-sm">
        <div class="card__meta-item">👥 適合：${itinerary.suitable.join('、')}</div>
        <div class="card__meta-item">💰 預算：${itinerary.budget.total}</div>
      </div>
      <button class="card__action" onclick="showItineraryDetail('${itinerary.id}')">查看詳細行程</button>
    </div>
  `).join('');
}

// ===== Modal Functions =====

// Show Detail Modal
function showDetail(id) {
  const data = state.data[state.currentCategory];
  const items = getItemsArray(data);
  const item = items.find(i => i.id === id);

  if (!item) return;

  const modal = elements.modal;
  if (!modal) return;

  modal.innerHTML = `
    <div class="modal__content">
      <div class="modal__header">
        <h2>${item.name}</h2>
        <button class="modal__close" onclick="closeModal()">×</button>
      </div>
      <div class="modal__body">
        <div class="modal__image modal__image--placeholder" style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, var(--primary-color), var(--secondary-color));color:white;font-size:48px;">
          ${item.name.charAt(0)}
        </div>

        ${item.description ? `
        <div class="modal__section">
          <div class="modal__section-title">介紹</div>
          <div class="modal__section-content">${item.description}</div>
        </div>
        ` : ''}

        ${item.signature ? `
        <div class="modal__section">
          <div class="modal__section-title">招牌</div>
          <div class="modal__section-content">${item.signature.join('、')}</div>
        </div>
        ` : ''}

        ${item.address ? `
        <div class="modal__section">
          <div class="modal__section-title">地址</div>
          <div class="modal__section-content">${item.address}</div>
        </div>
        ` : ''}

        ${item.phone ? `
        <div class="modal__section">
          <div class="modal__section-title">電話</div>
          <div class="modal__section-content">${item.phone}</div>
        </div>
        ` : ''}

        ${item.hours ? `
        <div class="modal__section">
          <div class="modal__section-title">營業時間</div>
          <div class="modal__section-content">${item.hours}</div>
        </div>
        ` : ''}

        ${item.priceRange || item.admission ? `
        <div class="modal__section">
          <div class="modal__section-title">價位</div>
          <div class="modal__section-content">${item.priceRange || item.admission}</div>
        </div>
        ` : ''}

        ${item.tips ? `
        <div class="modal__section">
          <div class="modal__section-title">小提醒</div>
          <div class="modal__section-content">${item.tips}</div>
        </div>
        ` : ''}
      </div>
      <div class="modal__footer">
        ${item.mapUrl ? `<a href="${item.mapUrl}" target="_blank" class="modal__btn modal__btn--primary">查看地圖</a>` : ''}
        ${item.website ? `<a href="${item.website}" target="_blank" class="modal__btn modal__btn--secondary">官方網站</a>` : ''}
        ${!item.mapUrl && !item.website ? `<button class="modal__btn modal__btn--secondary" onclick="closeModal()">關閉</button>` : ''}
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Show Night Market Detail
function showNightMarketDetail(id) {
  const data = state.data.nightmarkets;
  const market = data.nightmarkets.find(m => m.id === id);

  if (!market) return;

  const modal = elements.modal;
  if (!modal) return;

  const stallsHTML = market.stalls && market.stalls.length > 0
    ? market.stalls.map(stall => `
        <div class="mb-sm" style="padding: var(--spacing-sm); background: var(--background-color); border-radius: var(--radius-sm);">
          <strong>${stall.name}</strong> - ${stall.category}
          <p class="card__description">${stall.description}</p>
          <small>招牌：${stall.signature.join('、')} | ${stall.priceRange}</small>
        </div>
      `).join('')
    : '<p>暫無詳細攤位資訊</p>';

  modal.innerHTML = `
    <div class="modal__content">
      <div class="modal__header">
        <h2>${market.name}</h2>
        <button class="modal__close" onclick="closeModal()">×</button>
      </div>
      <div class="modal__body">
        <div class="modal__section">
          <div class="modal__section-title">介紹</div>
          <div class="modal__section-content">${market.description}</div>
        </div>
        <div class="modal__section">
          <div class="modal__section-title">營業時間</div>
          <div class="modal__section-content">${market.hours}</div>
        </div>
        <div class="modal__section">
          <div class="modal__section-title">地址</div>
          <div class="modal__section-content">${market.address}</div>
        </div>
        ${market.tips ? `
        <div class="modal__section">
          <div class="modal__section-title">小提醒</div>
          <div class="modal__section-content">${market.tips}</div>
        </div>
        ` : ''}
        <div class="modal__section">
          <div class="modal__section-title">推薦攤位</div>
          <div class="modal__section-content">${stallsHTML}</div>
        </div>
      </div>
      <div class="modal__footer">
        ${market.mapUrl ? `<a href="${market.mapUrl}" target="_blank" class="modal__btn modal__btn--primary">查看地圖</a>` : ''}
        <button class="modal__btn modal__btn--secondary" onclick="closeModal()">關閉</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Show Itinerary Detail
function showItineraryDetail(id) {
  const data = state.data.itineraries;
  const itinerary = data.itineraries.find(i => i.id === id);

  if (!itinerary) return;

  const modal = elements.modal;
  if (!modal) return;

  let scheduleHTML = '';

  if (itinerary.schedule) {
    if (Array.isArray(itinerary.schedule) && itinerary.schedule[0].day) {
      // Multi-day itinerary
      scheduleHTML = itinerary.schedule.map(day => `
        <div class="mb-md">
          <h4>Day ${day.day}${day.theme ? ` - ${day.theme}` : ''}</h4>
          <div class="itinerary-card__timeline">
            ${day.activities.map(act => {
              if (typeof act === 'string') {
                return `<div class="itinerary-card__time-item">
                  <div class="itinerary-card__activity">${act}</div>
                </div>`;
              }
              return `<div class="itinerary-card__time-item">
                <div class="itinerary-card__time">${act.time}</div>
                <div class="itinerary-card__activity">${act.activity}</div>
                ${act.tips ? `<small style="color: var(--text-light);">${act.tips}</small>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>
      `).join('');
    } else {
      // Single day itinerary
      scheduleHTML = `
        <div class="itinerary-card__timeline">
          ${itinerary.schedule.map(item => `
            <div class="itinerary-card__time-item">
              <div class="itinerary-card__time">${item.time}</div>
              <div class="itinerary-card__activity">${item.activity}</div>
              ${item.tips ? `<small style="color: var(--text-light);">${item.tips}</small>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  modal.innerHTML = `
    <div class="modal__content">
      <div class="modal__header">
        <h2>${itinerary.name}</h2>
        <button class="modal__close" onclick="closeModal()">×</button>
      </div>
      <div class="modal__body">
        <div class="modal__section">
          <div class="modal__section-title">行程說明</div>
          <div class="modal__section-content">${itinerary.description}</div>
        </div>
        <div class="modal__section">
          <div class="modal__section-title">行程亮點</div>
          <div class="itinerary-card__highlights">
            ${itinerary.highlights.map(h => `<span class="itinerary-card__highlight">${h}</span>`).join('')}
          </div>
        </div>
        <div class="modal__section">
          <div class="modal__section-title">詳細行程</div>
          ${scheduleHTML}
        </div>
        <div class="modal__section">
          <div class="modal__section-title">預算估計</div>
          <div class="modal__section-content">
            ${Object.entries(itinerary.budget).map(([key, value]) => {
              const labels = { food: '餐飲', attractions: '門票', accommodation: '住宿', transport: '交通', total: '總計' };
              return `<div>${labels[key] || key}：${value}</div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="modal__btn modal__btn--secondary" onclick="closeModal()">關閉</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close Modal
function closeModal() {
  if (elements.modal) {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ===== Event Listeners =====
function initEventListeners() {
  // Category navigation click
  if (elements.categoryNav) {
    elements.categoryNav.addEventListener('click', async (e) => {
      const item = e.target.closest('.category-nav__item');
      if (!item) return;

      const category = item.dataset.category;
      if (category === state.currentCategory) return;

      state.currentCategory = category;
      state.currentSubCategory = null;
      renderCategoryNav();
      renderBottomNav();
      await loadData(category);
      renderContent();
    });
  }

  // Subcategory navigation click
  if (elements.subcategoryNav) {
    elements.subcategoryNav.addEventListener('click', (e) => {
      const item = e.target.closest('.subcategory-nav__item');
      if (!item) return;

      state.currentSubCategory = item.dataset.subcategory || null;
      renderContent();
    });
  }

  // Bottom navigation click
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    bottomNav.addEventListener('click', async (e) => {
      e.preventDefault();
      const item = e.target.closest('.bottom-nav__item');
      if (!item) return;

      const category = item.dataset.category;
      if (category === state.currentCategory) return;

      state.currentCategory = category;
      state.currentSubCategory = null;
      renderCategoryNav();
      renderBottomNav();
      await loadData(category);
      renderContent();
    });
  }

  // Search input
  if (elements.searchInput) {
    let debounceTimer;
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = e.target.value;
        renderContent();
      }, 300);
    });
  }

  // Modal close on backdrop click
  if (elements.modal) {
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) {
        closeModal();
      }
    });
  }

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// ===== UI State Functions =====
function showLoading() {
  if (elements.cardGrid) {
    elements.cardGrid.innerHTML = `
      <div class="loading">
        <div class="loading__spinner"></div>
        <span>載入中...</span>
      </div>
    `;
  }
}

function showError(message) {
  if (elements.cardGrid) {
    elements.cardGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">😕</div>
        <p>${message}</p>
      </div>
    `;
  }
}

function showEmpty() {
  if (elements.cardGrid) {
    elements.cardGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <p>找不到符合條件的結果</p>
      </div>
    `;
  }
}
