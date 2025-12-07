// Main JavaScript for Tainan Car Rental Guide

document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initNavbarScroll();
    renderCompanyCards();
    renderComparisonTable();
    renderVehicleCards();
    renderTips();
    renderFAQ();
    initFilterButtons();
    initPriceChart();
    initSmoothScroll();
});

// Mobile Menu
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const closeBtn = document.getElementById('closeMobileMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuLinks = mobileMenu.querySelectorAll('a');

    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });
}

// Navbar Scroll Effect
function initNavbarScroll() {
    const navbar = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow-lg');
        } else {
            navbar.classList.remove('shadow-lg');
        }
    });
}

// Render Company Cards
function renderCompanyCards() {
    const container = document.getElementById('companyList');
    if (!container) return;

    container.innerHTML = rentalCompanies.map((company, index) => {
        const isRecommended = company.id === 1 || company.id === 3;
        const isBudget = company.id === 8;

        return `
            <div class="company-card ${isRecommended ? 'recommended' : ''} ${isBudget ? 'budget' : ''} bg-white rounded-xl shadow-lg p-6 card-hover animate-fade-in-up"
                 style="animation-delay: ${index * 0.1}s"
                 data-type="${company.type}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-xl font-bold text-gray-800">${company.name}</h3>
                            ${isRecommended ? '<span class="badge badge-green">推薦</span>' : ''}
                            ${isBudget ? '<span class="badge badge-yellow">平價</span>' : ''}
                        </div>
                        <p class="text-gray-500 text-sm">${company.englishName}</p>
                    </div>
                    <div class="text-right">
                        <div class="flex items-center gap-1 star-rating">
                            <i class="fas fa-star"></i>
                            <span class="text-gray-800 font-semibold">${company.rating}</span>
                        </div>
                        <p class="text-gray-400 text-xs">${company.reviewCount} 則評價</p>
                    </div>
                </div>

                <div class="mb-4">
                    <div class="text-sm text-gray-600 mb-2">
                        <i class="fas fa-map-marker-alt text-red-500 mr-1"></i>
                        ${company.locations.map(loc => loc.name).join('、')}
                    </div>
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-phone text-green-500 mr-1"></i>
                        ${company.phone}
                    </div>
                </div>

                <div class="mb-4">
                    <div class="text-sm font-semibold text-gray-700 mb-2">7人座車款</div>
                    <div class="space-y-1">
                        ${company.sevenSeaterModels.slice(0, 2).map(model => `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">${model.model}</span>
                                <span class="font-semibold text-blue-600">$${model.price.toLocaleString()}/${model.priceType === 'day' ? '日' : model.priceType}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex flex-wrap gap-2 mb-4">
                    ${company.features.slice(0, 4).map(feature => `
                        <span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">${feature}</span>
                    `).join('')}
                </div>

                <div class="border-t pt-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="text-gray-500 text-sm">兩天一夜預估</span>
                            <div class="text-2xl font-bold text-green-600">$${company.twoDayEstimate.toLocaleString()}</div>
                        </div>
                        <a href="${company.website}" target="_blank" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition">
                            前往官網
                        </a>
                    </div>
                </div>

                <div class="mt-4 pt-4 border-t">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div class="text-green-600 font-semibold mb-1"><i class="fas fa-check-circle mr-1"></i>優點</div>
                            <ul class="text-gray-600 text-xs space-y-1">
                                ${company.pros.slice(0, 2).map(pro => `<li>• ${pro}</li>`).join('')}
                            </ul>
                        </div>
                        <div>
                            <div class="text-red-500 font-semibold mb-1"><i class="fas fa-exclamation-circle mr-1"></i>注意</div>
                            <ul class="text-gray-600 text-xs space-y-1">
                                ${company.cons.slice(0, 2).map(con => `<li>• ${con}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Comparison Table
function renderComparisonTable() {
    const table = document.getElementById('comparisonTable');
    if (!table) return;

    const sortedCompanies = [...rentalCompanies].sort((a, b) => a.twoDayEstimate - b.twoDayEstimate);

    table.innerHTML = sortedCompanies.map((company, index) => {
        const lowestPrice = company.sevenSeaterModels[0]?.price || 0;
        const isLowest = index === 0;

        return `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="px-4 py-4">
                    <div class="font-semibold text-gray-800">${company.name}</div>
                    <div class="text-gray-500 text-xs">${company.englishName}</div>
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="font-semibold">$${lowestPrice.toLocaleString()}</span>
                    <span class="text-gray-400 text-xs">起/日</span>
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="font-bold ${isLowest ? 'text-green-600' : 'text-gray-800'}">
                        $${company.twoDayEstimate.toLocaleString()}
                    </span>
                    ${isLowest ? '<span class="badge badge-green ml-1">最低</span>' : ''}
                </td>
                <td class="px-4 py-4 text-center text-sm text-gray-600">
                    ${company.mileageLimit}
                </td>
                <td class="px-4 py-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <i class="fas fa-star text-yellow-400"></i>
                        <span>${company.rating}</span>
                    </div>
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="text-xs text-gray-600">${company.bestFor}</span>
                </td>
            </tr>
        `;
    }).join('');
}

// Render Vehicle Cards
function renderVehicleCards() {
    const container = document.getElementById('vehicleList');
    if (!container) return;

    container.innerHTML = vehicleModels.map(vehicle => `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden card-hover">
            <div class="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-6">
                <div class="text-4xl mb-2">🚐</div>
                <h3 class="text-xl font-bold">${vehicle.name}</h3>
                <p class="text-gray-300 text-sm">${vehicle.seats}人座 | ${vehicle.engine}</p>
            </div>
            <div class="p-6">
                <div class="mb-4">
                    <div class="text-sm text-gray-500 mb-2">特色功能</div>
                    <div class="flex flex-wrap gap-2">
                        ${vehicle.features.map(f => `
                            <span class="badge badge-blue">${f}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="mb-4">
                    <div class="text-sm text-gray-500 mb-1">行李容量</div>
                    <p class="text-gray-700 text-sm">${vehicle.luggage}</p>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                        <div class="text-green-600 font-semibold text-xs">優點</div>
                        <p class="text-gray-600 text-xs">${vehicle.pros}</p>
                    </div>
                    <div>
                        <div class="text-red-500 font-semibold text-xs">缺點</div>
                        <p class="text-gray-600 text-xs">${vehicle.cons}</p>
                    </div>
                </div>
                <div class="border-t pt-4 flex justify-between items-center">
                    <span class="text-gray-500 text-sm">平均日租</span>
                    <span class="text-xl font-bold text-blue-600">$${vehicle.avgPrice.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Render Tips
function renderTips() {
    const container = document.getElementById('tipsList');
    if (!container) return;

    container.innerHTML = rentalTips.map(tip => `
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover">
            <div class="text-4xl mb-4">${tip.icon}</div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">${tip.title}</h3>
            <p class="text-gray-600 text-sm">${tip.content}</p>
        </div>
    `).join('');
}

// Render FAQ
function renderFAQ() {
    const container = document.getElementById('faqList');
    if (!container) return;

    container.innerHTML = faqData.map((faq, index) => `
        <div class="faq-item bg-white rounded-xl shadow-lg overflow-hidden">
            <button class="faq-question w-full px-6 py-4 flex justify-between items-center text-left" onclick="toggleFAQ(${index})">
                <span class="font-semibold text-gray-800 pr-4">${faq.question}</span>
                <i class="faq-icon fas fa-chevron-down text-gray-400 transition-transform"></i>
            </button>
            <div class="faq-answer px-6 pb-4">
                <p class="text-gray-600">${faq.answer}</p>
            </div>
        </div>
    `).join('');
}

// Toggle FAQ
function toggleFAQ(index) {
    const items = document.querySelectorAll('.faq-item');
    items[index].classList.toggle('active');
}

// Filter Buttons
function initFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('#companyList > div');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            buttons.forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });
            btn.classList.remove('bg-gray-200', 'text-gray-700');
            btn.classList.add('bg-blue-600', 'text-white');

            // Filter cards
            const filter = btn.dataset.filter;
            cards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else {
                    const type = card.dataset.type;
                    if (filter === 'local' && (type === 'local' || type === 'local-chain')) {
                        card.style.display = 'block';
                    } else if (filter === 'chain' && (type === 'chain' || type === 'international')) {
                        card.style.display = 'block';
                    } else if (filter === 'self-service' && (type === 'self-service' || type === 'platform')) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });
}

// Price Chart
function initPriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    const sortedCompanies = [...rentalCompanies].sort((a, b) => a.twoDayEstimate - b.twoDayEstimate);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedCompanies.map(c => c.name),
            datasets: [{
                label: '兩天一夜預估費用 (元)',
                data: sortedCompanies.map(c => c.twoDayEstimate),
                backgroundColor: sortedCompanies.map((c, i) => {
                    if (i === 0) return 'rgba(16, 185, 129, 0.8)';
                    if (i === 1) return 'rgba(59, 130, 246, 0.8)';
                    return 'rgba(156, 163, 175, 0.8)';
                }),
                borderColor: sortedCompanies.map((c, i) => {
                    if (i === 0) return 'rgba(16, 185, 129, 1)';
                    if (i === 1) return 'rgba(59, 130, 246, 1)';
                    return 'rgba(156, 163, 175, 1)';
                }),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '預估費用: $' + context.raw.toLocaleString() + ' 元';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}
