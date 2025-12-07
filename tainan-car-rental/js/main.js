// Main JavaScript for Tainan Car Rental Guide

document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initNavbarScroll();
    renderCompanies();
    renderComparisonTable();
    renderVehicles();
    renderFAQs();
    initFilterButtons();
    initPriceChart();
    initSmoothScroll();
});

// Mobile Menu
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const closeBtn = document.getElementById('closeMobileMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('translate-x-full');
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                mobileMenu.classList.add('translate-x-full');
            });
        }

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('translate-x-full');
            });
        });
    }
}

// Navbar Scroll Effect
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('shadow-md');
            } else {
                navbar.classList.remove('shadow-md');
            }
        });
    }
}

// Render Companies
function renderCompanies(filter = 'all') {
    const container = document.getElementById('companyList');
    if (!container) return;

    const filtered = filter === 'all'
        ? companies
        : companies.filter(c => c.type === filter);

    container.innerHTML = filtered.map(c => {
        const featuresHtml = c.features.map(f =>
            `<span class="px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-600">${f}</span>`
        ).join('');

        const priceDisplay = c.priceNote
            ? c.priceNote
            : `$${c.dailyPrice.toLocaleString()}`;

        const badgeHtml = c.badge
            ? `<span class="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">${c.badge}</span>`
            : '';

        return `
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 card-hover group" data-type="${c.type}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center ${c.color} text-lg">
                            <i class="fas ${c.icon}"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-lg text-slate-800">${c.name}</h3>
                                ${badgeHtml}
                            </div>
                            <div class="flex text-yellow-400 text-xs">
                                ${'<i class="fas fa-star"></i>'.repeat(Math.floor(c.rating))}
                                ${c.rating % 1 !== 0 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                                <span class="text-slate-400 ml-1">(${c.rating})</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xl font-bold text-slate-900">${priceDisplay}</span>
                        ${!c.priceNote ? '<span class="text-xs text-slate-400">/日</span>' : ''}
                    </div>
                </div>

                <div class="mb-3 text-sm text-slate-600">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fas fa-map-marker-alt text-red-400 w-4"></i>
                        <span>${c.location}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-car text-blue-400 w-4"></i>
                        <span>${c.vehicle}</span>
                    </div>
                </div>

                <div class="flex flex-wrap gap-2 mb-6">
                    ${featuresHtml}
                </div>

                <a href="${c.website}" target="_blank" class="block w-full py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors text-center">
                    查看方案
                </a>
            </div>
        `;
    }).join('');
}

// Render Comparison Table
function renderComparisonTable() {
    const tableBody = document.getElementById('comparisonTable');
    if (!tableBody) return;

    // Filter out companies with no price and sort by two-day price
    const sortedCompanies = companies
        .filter(c => c.twoDayPrice > 0)
        .sort((a, b) => a.twoDayPrice - b.twoDayPrice);

    tableBody.innerHTML = sortedCompanies.map((c, index) => {
        const isLowest = index === 0;

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4">
                    <div class="font-medium text-slate-800">${c.name}</div>
                    <div class="text-slate-400 text-xs">${c.englishName}</div>
                </td>
                <td class="p-4 text-center text-sm text-slate-600">${c.vehicle}</td>
                <td class="p-4 text-center">
                    <span class="font-bold ${isLowest ? 'text-green-600' : 'text-primary'}">
                        $${c.twoDayPrice.toLocaleString()}
                    </span>
                    ${isLowest ? '<span class="ml-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">最低</span>' : ''}
                </td>
                <td class="p-4 text-center text-sm text-slate-500">${c.mileageLimit}</td>
                <td class="p-4 text-center">
                    <span class="text-yellow-500 font-bold">${c.rating}</span>
                </td>
            </tr>
        `;
    }).join('');
}

// Render Vehicles
function renderVehicles() {
    const container = document.getElementById('vehicleList');
    if (!container) return;

    container.innerHTML = vehicles.map(v => `
        <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10 hover:bg-white/20 transition duration-300">
            <div class="flex justify-between items-start mb-4">
                <span class="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/20">${v.tag}</span>
                <span class="text-white font-bold">$${v.price} <span class="text-sm text-slate-400 font-normal">/日</span></span>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">${v.name}</h3>
            <p class="text-slate-400 text-sm mb-4 min-h-[48px]">${v.desc}</p>

            <div class="grid grid-cols-2 gap-4 text-sm text-slate-300 mb-4">
                <div class="flex items-center gap-2">
                    <i class="fas fa-chair text-slate-500"></i>
                    <span>${v.seats} 人座</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fas fa-suitcase text-slate-500"></i>
                    <span>${v.bags}</span>
                </div>
            </div>

            <div class="pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                <div>
                    <span class="text-green-400"><i class="fas fa-check mr-1"></i></span>
                    <span class="text-slate-400">${v.pros}</span>
                </div>
                <div>
                    <span class="text-red-400"><i class="fas fa-times mr-1"></i></span>
                    <span class="text-slate-400">${v.cons}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Render FAQs
function renderFAQs() {
    const container = document.getElementById('faqList');
    if (!container) return;

    container.innerHTML = faqs.map((item, index) => `
        <div class="faq-item bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onclick="toggleFAQ(this)">
            <div class="p-5 flex justify-between items-center">
                <h3 class="font-bold text-slate-800 pr-4">Q${index + 1}. ${item.q}</h3>
                <i class="fas fa-chevron-down text-slate-400 faq-icon"></i>
            </div>
            <div class="faq-answer px-5 bg-slate-50">
                <div class="pb-5 text-slate-600 text-sm leading-relaxed">
                    ${item.a}
                </div>
            </div>
        </div>
    `).join('');
}

// Toggle FAQ
function toggleFAQ(element) {
    const isActive = element.classList.contains('active');
    // Close all
    document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));
    // Toggle clicked
    if (!isActive) {
        element.classList.add('active');
    }
}

// Filter Buttons
function initFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active button styles
            buttons.forEach(b => {
                b.classList.remove('bg-slate-800', 'text-white', 'shadow-lg');
                b.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
            });
            e.target.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200');
            e.target.classList.add('bg-slate-800', 'text-white', 'shadow-lg');

            // Re-render companies
            renderCompanies(e.target.dataset.filter);
        });
    });
}

// Price Chart
function initPriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    // Get companies with valid prices, sorted
    const chartData = companies
        .filter(c => c.twoDayPrice > 0)
        .sort((a, b) => a.twoDayPrice - b.twoDayPrice)
        .slice(0, 8); // Top 8 for chart clarity

    const colors = chartData.map((c, i) => {
        if (i === 0) return 'rgba(16, 185, 129, 0.8)'; // Green for lowest
        if (i === 1) return 'rgba(14, 165, 233, 0.8)'; // Primary blue
        return 'rgba(148, 163, 184, 0.6)'; // Slate for others
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(c => c.name),
            datasets: [{
                label: '兩天一夜預估費用',
                data: chartData.map(c => c.twoDayPrice),
                backgroundColor: colors,
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
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
                    grid: { display: false },
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'k';
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 10 }
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
