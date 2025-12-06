// 大台北植牙指南 - 主要 JavaScript
// 2025年12月

document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有功能
    initMobileMenu();
    initNavbarScroll();
    initFilterButtons();
    renderClinics(clinicsData);
    initCharts();
    initFAQ();
    initSmoothScroll();
});

// ===== 手機選單 =====
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });

        // 點擊連結後關閉選單
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}

// ===== 導航列滾動效果 =====
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('shadow-md');
        } else {
            navbar.classList.remove('shadow-md');
        }
    });
}

// ===== 篩選按鈕 =====
function initFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新按鈕樣式
            filterBtns.forEach(b => {
                b.classList.remove('bg-dental', 'text-white');
                b.classList.add('bg-white', 'text-gray-600');
            });
            this.classList.remove('bg-white', 'text-gray-600');
            this.classList.add('bg-dental', 'text-white');

            // 篩選診所
            const filter = this.dataset.filter;
            filterClinics(filter);
        });
    });
}

function filterClinics(filter) {
    let filteredClinics = clinicsData;

    if (filter !== 'all') {
        filteredClinics = clinicsData.filter(clinic => {
            switch(filter) {
                case 'taipei':
                    return clinic.city === 'taipei';
                case 'newtaipei':
                    return clinic.city === 'newtaipei';
                case 'allon4':
                    return clinic.features.includes('allon4');
                case 'sedation':
                    return clinic.features.includes('sedation');
                default:
                    return true;
            }
        });
    }

    renderClinics(filteredClinics);
}

// ===== 渲染診所卡片 =====
function renderClinics(clinics) {
    const grid = document.getElementById('clinic-grid');
    if (!grid) return;

    grid.innerHTML = '';

    clinics.forEach((clinic, index) => {
        const card = createClinicCard(clinic, index);
        grid.appendChild(card);
    });
}

function createClinicCard(clinic, index) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg overflow-hidden card-hover fade-in';
    card.style.animationDelay = `${index * 0.05}s`;

    // 產生標籤
    const tagsHtml = clinic.tags.slice(0, 3).map(tag => {
        let tagClass = 'tag ';
        if (tag.includes('All-on') || tag.includes('全口')) tagClass += 'tag-premium';
        else if (tag.includes('高性價比') || tag.includes('高評價')) tagClass += 'tag-value';
        else if (tag.includes('導航') || tag.includes('數位') || tag.includes('微創')) tagClass += 'tag-tech';
        else if (tag.includes('舒眠')) tagClass += 'tag-comfort';
        else tagClass += 'bg-gray-100 text-gray-600';
        return `<span class="${tagClass}">${tag}</span>`;
    }).join('');

    // 產生評分星星
    const stars = generateStars(clinic.rating);

    // 產生特色列表
    const highlightsHtml = clinic.highlights.slice(0, 3).map(h =>
        `<li class="flex items-start text-sm text-gray-600">
            <i class="fas fa-check-circle text-green-500 mr-2 mt-0.5 flex-shrink-0"></i>
            <span>${h}</span>
        </li>`
    ).join('');

    // 城市標籤
    const cityLabel = clinic.city === 'taipei' ? '台北市' : '新北市';
    const cityClass = clinic.city === 'taipei' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';

    card.innerHTML = `
        <div class="p-6">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs px-2 py-0.5 rounded ${cityClass}">${cityLabel}</span>
                        <span class="text-xs text-gray-500">${clinic.district}</span>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800">${clinic.name}</h3>
                </div>
                <div class="text-right">
                    <div class="flex items-center">
                        ${stars}
                        <span class="ml-1 text-sm font-medium text-gray-700">${clinic.rating}</span>
                    </div>
                    <span class="text-xs text-gray-500">(${clinic.reviewCount}則評價)</span>
                </div>
            </div>

            <div class="flex flex-wrap gap-1 mb-4">
                ${tagsHtml}
            </div>

            <div class="mb-4">
                <div class="flex items-center text-sm text-gray-600 mb-1">
                    <i class="fas fa-money-bill-wave text-dental mr-2"></i>
                    <span class="font-medium">${clinic.priceRange}</span>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <i class="fas fa-tooth text-dental mr-2"></i>
                    <span>${clinic.implantBrands.join('、')}</span>
                </div>
            </div>

            <ul class="space-y-2 mb-4">
                ${highlightsHtml}
            </ul>

            <div class="pt-4 border-t flex justify-between items-center">
                <div class="text-xs text-gray-400">
                    資料來源：${clinic.source}
                </div>
                ${clinic.website ?
                    `<a href="${clinic.website}" target="_blank" rel="noopener noreferrer"
                        class="text-dental hover:text-dental-dark text-sm font-medium">
                        官網 <i class="fas fa-external-link-alt ml-1"></i>
                    </a>` : ''
                }
            </div>
        </div>

        <button class="w-full bg-gray-50 hover:bg-gray-100 py-3 text-sm text-gray-600 transition expand-btn"
                onclick="toggleClinicDetails(this, ${clinic.id})">
            <i class="fas fa-chevron-down mr-1"></i> 查看更多資訊
        </button>

        <div class="clinic-details hidden bg-gray-50 px-6 pb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">
                        <i class="fas fa-thumbs-up text-green-500 mr-2"></i>優點
                    </h4>
                    <ul class="space-y-1">
                        ${clinic.pros.map(p => `<li class="text-sm text-gray-600">• ${p}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">
                        <i class="fas fa-exclamation-circle text-yellow-500 mr-2"></i>注意事項
                    </h4>
                    <ul class="space-y-1">
                        ${clinic.cons.map(c => `<li class="text-sm text-gray-600">• ${c}</li>`).join('')}
                    </ul>
                </div>
            </div>

            ${clinic.doctors.length > 0 ? `
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-800 mb-2">
                        <i class="fas fa-user-md text-dental mr-2"></i>醫師團隊
                    </h4>
                    <div class="space-y-1">
                        ${clinic.doctors.map(d =>
                            `<p class="text-sm text-gray-600">
                                <span class="font-medium">${d.name}</span> - ${d.specialty}
                            </p>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="mt-4 pt-4 border-t">
                <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                    ${clinic.address ? `
                        <div class="flex items-center">
                            <i class="fas fa-map-marker-alt text-dental mr-2"></i>
                            <span>${clinic.address}</span>
                        </div>
                    ` : ''}
                    ${clinic.phone ? `
                        <div class="flex items-center">
                            <i class="fas fa-phone text-dental mr-2"></i>
                            <a href="tel:${clinic.phone}" class="hover:text-dental">${clinic.phone}</a>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    return card;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let starsHtml = '';

    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star text-yellow-400 text-xs"></i>';
    }
    if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt text-yellow-400 text-xs"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star text-yellow-400 text-xs"></i>';
    }

    return starsHtml;
}

function toggleClinicDetails(btn, clinicId) {
    const card = btn.closest('.card-hover');
    const details = card.querySelector('.clinic-details');
    const icon = btn.querySelector('i');

    details.classList.toggle('hidden');

    if (details.classList.contains('hidden')) {
        btn.innerHTML = '<i class="fas fa-chevron-down mr-1"></i> 查看更多資訊';
    } else {
        btn.innerHTML = '<i class="fas fa-chevron-up mr-1"></i> 收起資訊';
    }
}

// ===== 圖表初始化 =====
function initCharts() {
    initPriceChart();
    initMarketShareChart();
    initRiskChart();
}

function initPriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['單顆植牙', '植牙手術費\n（一般）', '植牙手術費\n（困難）', '全瓷牙冠', '補骨手術', '舒眠麻醉', '微創加價'],
            datasets: [{
                label: '最低價格',
                data: [7, 3, 5, 2.2, 2, 1.5, 1],
                backgroundColor: 'rgba(14, 165, 233, 0.6)',
                borderColor: 'rgba(14, 165, 233, 1)',
                borderWidth: 1
            }, {
                label: '最高價格',
                data: [12, 5, 7, 3.5, 3, 2, 2],
                backgroundColor: 'rgba(124, 58, 237, 0.6)',
                borderColor: 'rgba(124, 58, 237, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + ' 萬元';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '費用（萬元）'
                    }
                }
            }
        }
    });
}

function initMarketShareChart() {
    const ctx = document.getElementById('marketShareChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Straumann (瑞士)', 'Nobel Biocare (瑞典)', 'Astra Tech (瑞典)', '其他品牌'],
            datasets: [{
                data: [32, 25, 18, 25],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(156, 163, 175, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

function initRiskChart() {
    const ctx = document.getElementById('riskChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['骨整合不佳', '傷口感染', '術後清潔不當', '醫師技術問題', '植體品質問題', '其他'],
            datasets: [{
                data: [30, 25, 20, 10, 10, 5],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        usePointStyle: true,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

// ===== FAQ 手風琴 =====
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const toggle = item.querySelector('.faq-toggle');
        const content = item.querySelector('.faq-content');
        const icon = toggle.querySelector('i');

        toggle.addEventListener('click', function() {
            const isOpen = !content.classList.contains('hidden');

            // 關閉所有
            faqItems.forEach(faq => {
                faq.querySelector('.faq-content').classList.add('hidden');
                faq.querySelector('.faq-toggle i').classList.remove('rotate-180');
            });

            // 如果原本是關閉的，則打開
            if (!isOpen) {
                content.classList.remove('hidden');
                icon.classList.add('rotate-180');
            }
        });
    });
}

// ===== 平滑滾動 =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== 全局函數（供 HTML 調用）=====
window.toggleClinicDetails = toggleClinicDetails;
