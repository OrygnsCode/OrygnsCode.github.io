// Orygns Client Portal - Enhanced Main JavaScript
class EnhancedPortalApp {
    constructor() {
        this.currentTheme = 'dark';
        this.animations = [];
        this.charts = [];
        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.initializeAnimations();
        this.initializeCharts();
        this.startRealTimeUpdates();
        this.optimizePerformance();
    }

    setupTheme() {
        // Check for saved theme preference or default to dark mode
        const savedTheme = localStorage.getItem('orygns-theme') || 'dark';
        this.currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme toggle button
        this.updateThemeToggle();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.currentTheme = newTheme;
        
        // Add transition class to body
        document.body.classList.add('theme-transition');
        
        // Update theme
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('orygns-theme', newTheme);
        
        // Update charts for new theme
        this.updateChartsTheme();
        
        // Remove transition class after animation
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500);
        
        this.updateThemeToggle();
    }

    updateThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            const icon = toggle.querySelector('svg');
            if (this.currentTheme === 'dark') {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
            } else {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
            }
        }
    }

    updateChartsTheme() {
        this.charts.forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.toggleMobileMenu);
        }

        // Reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.reduceMotion = true;
        }

        // Window resize handler
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));

        // Smooth scroll for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    initializeAnimations() {
        // Staggered page load animation
        this.animatePageLoad();
        
        // Initialize text animations
        this.initializeTextAnimations();
        
        // Animate KPI cards
        this.animateKPICards();
        
        // Animate activity items
        this.animateActivityItems();
    }

    animatePageLoad() {
        const elements = document.querySelectorAll('.card-hover, .metric-card, .kpi-card');
        
        if (this.reduceMotion) {
            elements.forEach(el => el.style.opacity = '1');
            return;
        }

        anime({
            targets: elements,
            translateY: [30, 0],
            opacity: [0, 1],
            delay: anime.stagger(100, {start: 200}),
            duration: 800,
            easing: 'easeOutExpo'
        });
    }

    initializeTextAnimations() {
        // Enhanced typed.js for welcome message
        if (document.getElementById('typed-text')) {
            new Typed('#typed-text', {
                strings: [
                    'Welcome to Orygns Portal',
                    'Your Business Hub',
                    'Professional Management',
                    'Seamless Experience'
                ],
                typeSpeed: 60,
                backSpeed: 40,
                backDelay: 2000,
                loop: true,
                showCursor: true,
                cursorChar: '|',
                autoInsertCss: false
            });
        }

        // Splitting.js for advanced text effects
        if (typeof Splitting !== 'undefined') {
            Splitting({
                target: '.split-text',
                by: 'chars'
            });

            anime({
                targets: '.split-text .char',
                translateY: [100, 0],
                opacity: [0, 1],
                delay: anime.stagger(50),
                duration: 1000,
                easing: 'easeOutExpo'
            });
        }
    }

    animateKPICards() {
        const kpiCards = document.querySelectorAll('.kpi-card, .metric-card');
        
        if (this.reduceMotion) {
            kpiCards.forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
            return;
        }

        // Animate cards with staggered timing
        anime({
            targets: kpiCards,
            scale: [0.9, 1],
            opacity: [0, 1],
            delay: anime.stagger(150, {start: 300}),
            duration: 600,
            easing: 'easeOutBack'
        });

        // Animate KPI numbers with counting effect
        this.animateCounters();
    }

    animateCounters() {
        const counters = [
            { id: 'balance', target: 12847.32, prefix: '$', suffix: '' },
            { id: 'services', target: 8, prefix: '', suffix: '' },
            { id: 'tickets', target: 3, prefix: '', suffix: '' },
            { id: 'usage', target: 2.4, prefix: '', suffix: ' TB' },
            { id: 'totalClients', target: 247, prefix: '', suffix: '' },
            { id: 'monthlyRevenue', target: 184532, prefix: '$', suffix: '' },
            { id: 'openTickets', target: 18, prefix: '', suffix: '' },
            { id: 'serverUptime', target: 99.8, prefix: '', suffix: '%' }
        ];

        counters.forEach(counter => {
            const element = document.getElementById(counter.id);
            if (element) {
                const animation = anime({
                    targets: { value: 0 },
                    value: counter.target,
                    duration: 2000,
                    easing: 'easeOutExpo',
                    update: function(anim) {
                        const value = anim.animatables[0].target.value;
                        const formattedValue = counter.id === 'balance' || counter.id === 'monthlyRevenue'
                            ? Math.floor(value).toLocaleString()
                            : counter.id === 'serverUptime'
                            ? value.toFixed(1)
                            : counter.id === 'usage'
                            ? value.toFixed(1)
                            : Math.floor(value);
                        element.textContent = counter.prefix + formattedValue + counter.suffix;
                    }
                });
                this.animations.push(animation);
            }
        });
    }

    animateActivityItems() {
        const activityItems = document.querySelectorAll('.activity-item, .ticket-item, .table-row');
        
        if (this.reduceMotion) {
            activityItems.forEach(item => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            });
            return;
        }

        anime({
            targets: activityItems,
            translateX: [-20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100, {start: 600}),
            duration: 500,
            easing: 'easeOutExpo'
        });
    }

    initializeCharts() {
        // Wait for DOM to be ready
        setTimeout(() => {
            this.createUsageChart();
            this.createCostChart();
            this.initializeAdminCharts();
        }, 500);
    }

    createUsageChart() {
        const chartElement = document.getElementById('usageChart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        this.charts.push(chart);
        
        const isDark = this.currentTheme === 'dark';
        const textColor = isDark ? '#FFFFFF' : '#374151';
        const gridColor = isDark ? '#2A2F3E' : '#E5E7EB';
        const tooltipBg = isDark ? 'rgba(26, 31, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        const tooltipBorder = isDark ? '#2A2F3E' : '#00D4FF';

        const option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderWidth: 1,
                textStyle: { color: textColor }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                axisLine: { lineStyle: { color: gridColor } },
                axisTick: { show: false },
                axisLabel: { color: textColor }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: textColor },
                splitLine: { lineStyle: { color: gridColor } }
            },
            series: [{
                name: 'Usage (GB)',
                type: 'line',
                smooth: true,
                data: [1200, 1350, 1100, 1500, 1800, 2100, 2400],
                lineStyle: { color: '#00D4FF', width: 3 },
                itemStyle: { color: '#00D4FF' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
                            { offset: 1, color: 'rgba(0, 212, 255, 0.05)' }
                        ]
                    }
                }
            }],
            animation: true,
            animationDuration: 2000,
            animationEasing: 'cubicOut'
        };

        chart.setOption(option);
        
        // Make chart responsive
        window.addEventListener('resize', () => chart.resize());
    }

    createCostChart() {
        const chartElement = document.getElementById('costChart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        this.charts.push(chart);
        
        const isDark = this.currentTheme === 'dark';
        const textColor = isDark ? '#FFFFFF' : '#374151';
        const tooltipBg = isDark ? 'rgba(26, 31, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        const tooltipBorder = isDark ? '#2A2F3E' : '#00D4FF';

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: ${c} ({d}%)',
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderWidth: 1,
                textStyle: { color: textColor }
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                textStyle: { color: textColor }
            },
            series: [{
                name: 'Cost Breakdown',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['60%', '50%'],
                data: [
                    { value: 4500, name: 'Hosting', itemStyle: { color: '#00D4FF' } },
                    { value: 3200, name: 'Storage', itemStyle: { color: '#0F1419' } },
                    { value: 2800, name: 'Bandwidth', itemStyle: { color: '#F59E0B' } },
                    { value: 1500, name: 'Support', itemStyle: { color: '#10B981' } },
                    { value: 847, name: 'Other', itemStyle: { color: '#6B7280' } }
                ],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                animation: true,
                animationType: 'scale',
                animationEasing: 'elasticOut',
                animationDelay: function (idx) {
                    return Math.random() * 200;
                }
            }]
        };

        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
    }

    initializeAdminCharts() {
        // Revenue Chart for admin dashboard
        const revenueChart = document.getElementById('revenueChart');
        if (revenueChart) {
            const chart = echarts.init(revenueChart);
            this.charts.push(chart);
            
            const isDark = this.currentTheme === 'dark';
            const textColor = isDark ? '#FFFFFF' : '#374151';
            const gridColor = isDark ? '#2A2F3E' : '#E5E7EB';

            const option = {
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: isDark ? 'rgba(26, 31, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: isDark ? '#2A2F3E' : '#00D4FF',
                    textStyle: { color: textColor }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    axisLine: { lineStyle: { color: gridColor } },
                    axisLabel: { color: textColor }
                },
                yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    axisLabel: { color: textColor },
                    splitLine: { lineStyle: { color: gridColor } }
                },
                series: [{
                    name: 'Revenue ($)',
                    type: 'bar',
                    data: [145000, 162000, 158000, 184000, 176000, 184532],
                    itemStyle: { color: '#00D4FF' },
                    emphasis: {
                        itemStyle: { color: '#0F1419' }
                    }
                }],
                animation: true,
                animationDuration: 1500,
                animationEasing: 'cubicOut'
            };

            chart.setOption(option);
            window.addEventListener('resize', () => chart.resize());
        }
    }

    startRealTimeUpdates() {
        // Simulate real-time data updates
        this.dataUpdateInterval = setInterval(() => {
            this.updateKPIValues();
        }, 30000);

        // Update notification badge
        this.notificationInterval = setInterval(() => {
            this.updateNotifications();
        }, 45000);
    }

    updateKPIValues() {
        // Simulate small changes in KPI values
        const balance = document.getElementById('balance');
        if (balance) {
            const currentValue = parseFloat(balance.textContent.replace(/[$,]/g, ''));
            const newValue = currentValue + (Math.random() - 0.5) * 100;
            balance.textContent = '$' + newValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
    }

    updateNotifications() {
        const badge = document.querySelector('.notification-badge');
        if (badge && Math.random() > 0.7) {
            this.showToast('New notification received!', 'info');
            badge.style.animation = 'pulse 1s infinite';
        }
    }

    handleResize() {
        // Handle responsive chart resizing
        this.charts.forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    optimizePerformance() {
        // Lazy loading for images
        this.setupLazyLoading();
        
        // Intersection Observer for animations
        this.setupIntersectionObserver();
        
        // Preload critical resources
        this.preloadCriticalResources();
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }

    setupIntersectionObserver() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        if ('IntersectionObserver' in window) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                    }
                });
            }, { threshold: 0.1 });

            animatedElements.forEach(el => animationObserver.observe(el));
        }
    }

    preloadCriticalResources() {
        const criticalResources = [
            'resources/business-team.jpg',
            'resources/office-modern.jpg'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showToast(message, type = 'success') {
        // Prevent multiple toasts
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
        
        // Theme-aware styling
        const isDark = this.currentTheme === 'dark';
        const bgColor = type === 'success' ? (isDark ? '#10B981' : '#10B981') :
                       type === 'error' ? (isDark ? '#EF4444' : '#EF4444') :
                       (isDark ? '#3B82F6' : '#3B82F6');
        
        toast.style.backgroundColor = bgColor;
        toast.style.color = 'white';
        
        toast.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    destroy() {
        // Clean up animations
        this.animations.forEach(animation => {
            if (animation.pause) animation.pause();
        });
        
        // Clean up charts
        this.charts.forEach(chart => {
            if (chart.dispose) chart.dispose();
        });
        
        // Clear intervals
        if (this.dataUpdateInterval) clearInterval(this.dataUpdateInterval);
        if (this.notificationInterval) clearInterval(this.notificationInterval);
    }
}

// Enhanced modal functions
function openSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Add backdrop blur
        document.body.style.overflow = 'hidden';
        
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutExpo'
        });
        
        // Animate backdrop
        anime({
            targets: modal,
            opacity: [0, 1],
            duration: 200,
            easing: 'easeOutQuad'
        });
    }
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInExpo',
            complete: () => {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
        
        anime({
            targets: modal,
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInQuad'
        });
    }
}

function submitSupportRequest(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // Add loading animation
    anime({
        targets: submitBtn,
        scale: [1, 0.95, 1],
        duration: 1000,
        loop: true,
        easing: 'easeInOutQuad'
    });
    
    // Simulate API call
    setTimeout(() => {
        closeSupportModal();
        
        if (window.enhancedApp) {
            window.enhancedApp.showToast('Support request submitted successfully!', 'success');
        }
        
        event.target.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Stop loading animation
        anime.remove(submitBtn);
        submitBtn.style.transform = '';
    }, 2000);
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        const fileNames = Array.from(files).map(file => file.name).join(', ');
        
        if (window.enhancedApp) {
            window.enhancedApp.showToast(`Uploading ${files.length} file(s)...`, 'info');
        }
        
        // Simulate upload progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                clearInterval(progressInterval);
                if (window.enhancedApp) {
                    window.enhancedApp.showToast('Files uploaded successfully!', 'success');
                }
            }
        }, 200);
    }
}

function downloadReport() {
    if (window.enhancedApp) {
        window.enhancedApp.showToast('Generating report...', 'info');
    }
    
    // Simulate report generation with progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            clearInterval(progressInterval);
            
            if (window.enhancedApp) {
                window.enhancedApp.showToast('Report downloaded successfully!', 'success');
            }
            
            // Create download
            const link = document.createElement('a');
            link.href = 'data:text/plain;charset=utf-8,Orygns Client Portal Report Data';
            link.download = 'orygns-client-report.pdf';
            link.click();
        }
    }, 100);
}

// Enhanced navigation functions
function navigateToPage(page) {
    // Add page transition animation
    anime({
        targets: 'main',
        opacity: [1, 0],
        duration: 200,
        easing: 'easeInQuad',
        complete: () => {
            window.location.href = page;
        }
    });
}

function showComingSoon() {
    if (window.enhancedApp) {
        window.enhancedApp.showToast('Feature coming soon!', 'info', {
            icon: '⚡'
        });
    }
}

// Initialize enhanced application
document.addEventListener('DOMContentLoaded', function() {
    window.enhancedApp = new EnhancedPortalApp();
    
    // Add CSS for theme transitions
    const style = document.createElement('style');
    style.textContent = `
        .theme-transition * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
        }
        
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s ease;
        }
        
        .animate-on-scroll.animated {
            opacity: 1;
            transform: translateY(0);
        }
        
        .toast-notification {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        
        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    `;
    document.head.appendChild(style);
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.enhancedApp) {
        window.enhancedApp.destroy();
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedPortalApp };
}