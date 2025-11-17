// Origins Client Portal - Main JavaScript
class PortalApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.initializeCharts();
        this.startRealTimeUpdates();
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', this.toggleMobileMenu);
        }

        // Notification click
        const notificationBtn = document.querySelector('.notification-badge');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', this.showNotifications);
        }

        // Window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    initializeAnimations() {
        // Typed.js for welcome message
        if (document.getElementById('typed-text')) {
            new Typed('#typed-text', {
                strings: ['Welcome back, John!', 'Your dashboard is ready.', 'Everything looks great!'],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 2000,
                loop: true,
                showCursor: true,
                cursorChar: '|'
            });
        }

        // Animate KPI cards on load
        this.animateKPICards();

        // Animate activity items
        this.animateActivityItems();
    }

    animateKPICards() {
        const kpiCards = document.querySelectorAll('.kpi-card');
        
        anime({
            targets: kpiCards,
            translateY: [50, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutExpo'
        });

        // Animate KPI numbers
        this.animateCounters();
    }

    animateCounters() {
        const counters = [
            { id: 'balance', target: 12847.32, prefix: '$', suffix: '' },
            { id: 'services', target: 8, prefix: '', suffix: '' },
            { id: 'tickets', target: 3, prefix: '', suffix: '' },
            { id: 'usage', target: 2.4, prefix: '', suffix: ' TB' }
        ];

        counters.forEach(counter => {
            const element = document.getElementById(counter.id);
            if (element) {
                anime({
                    targets: { value: 0 },
                    value: counter.target,
                    duration: 2000,
                    easing: 'easeOutExpo',
                    update: function(anim) {
                        const value = anim.animatables[0].target.value;
                        const formattedValue = counter.id === 'balance' 
                            ? value.toFixed(2)
                            : counter.id === 'usage'
                            ? value.toFixed(1)
                            : Math.floor(value);
                        element.textContent = counter.prefix + formattedValue + counter.suffix;
                    }
                });
            }
        });
    }

    animateActivityItems() {
        const activityItems = document.querySelectorAll('.activity-item');
        
        anime({
            targets: activityItems,
            translateX: [-30, 0],
            opacity: [0, 1],
            delay: anime.stagger(150, {start: 500}),
            duration: 600,
            easing: 'easeOutExpo'
        });
    }

    initializeCharts() {
        this.createUsageChart();
        this.createCostChart();
    }

    createUsageChart() {
        const chartElement = document.getElementById('usageChart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        
        const option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#00B4D8',
                borderWidth: 1,
                textStyle: { color: '#374151' }
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
                axisLine: { lineStyle: { color: '#E5E7EB' } },
                axisTick: { show: false },
                axisLabel: { color: '#6B7280' }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#6B7280' },
                splitLine: { lineStyle: { color: '#F3F4F6' } }
            },
            series: [{
                name: 'Usage (GB)',
                type: 'line',
                smooth: true,
                data: [1200, 1350, 1100, 1500, 1800, 2100, 2400],
                lineStyle: { color: '#00B4D8', width: 3 },
                itemStyle: { color: '#00B4D8' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(0, 180, 216, 0.3)' },
                            { offset: 1, color: 'rgba(0, 180, 216, 0.05)' }
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
        
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: ${c} ({d}%)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#00B4D8',
                borderWidth: 1,
                textStyle: { color: '#374151' }
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                textStyle: { color: '#6B7280' }
            },
            series: [{
                name: 'Cost Breakdown',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['60%', '50%'],
                data: [
                    { value: 4500, name: 'Hosting', itemStyle: { color: '#00B4D8' } },
                    { value: 3200, name: 'Storage', itemStyle: { color: '#0D1B2A' } },
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
        
        // Make chart responsive
        window.addEventListener('resize', () => chart.resize());
    }

    startRealTimeUpdates() {
        // Simulate real-time data updates
        setInterval(() => {
            this.updateKPIValues();
        }, 30000); // Update every 30 seconds

        // Update notification badge
        setInterval(() => {
            this.updateNotifications();
        }, 45000); // Update every 45 seconds
    }

    updateKPIValues() {
        // Simulate small changes in KPI values
        const balance = document.getElementById('balance');
        const services = document.getElementById('services');
        const tickets = document.getElementById('tickets');
        const usage = document.getElementById('usage');

        if (balance) {
            const currentValue = parseFloat(balance.textContent.replace('$', '').replace(',', ''));
            const newValue = currentValue + (Math.random() - 0.5) * 100;
            balance.textContent = '$' + newValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
    }

    updateNotifications() {
        const badge = document.querySelector('.notification-badge');
        if (badge && Math.random() > 0.7) {
            // Simulate new notification
            this.showToast('New notification received!', 'info');
            badge.style.animation = 'pulse 1s infinite';
        }
    }

    handleResize() {
        // Handle responsive chart resizing
        const usageChart = echarts.getInstanceByDom(document.getElementById('usageChart'));
        const costChart = echarts.getInstanceByDom(document.getElementById('costChart'));
        
        if (usageChart) usageChart.resize();
        if (costChart) costChart.resize();
    }

    showNotifications() {
        this.showToast('Notifications panel would open here', 'info');
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            
            // Update toast style based on type
            toast.className = toast.className.replace(/bg-\w+-500/, `bg-${type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue'}-500`);
            
            // Show toast
            toast.classList.remove('translate-x-full');
            
            // Hide toast after 3 seconds
            setTimeout(() => {
                toast.classList.add('translate-x-full');
            }, 3000);
        }
    }
}

// Modal functions
function openSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Animate modal appearance
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutExpo'
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
            }
        });
    }
}

function submitSupportRequest(event) {
    event.preventDefault();
    
    // Simulate form submission
    const formData = new FormData(event.target);
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        closeSupportModal();
        app.showToast('Support request submitted successfully!', 'success');
        event.target.reset();
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        // Simulate file upload
        const fileNames = Array.from(files).map(file => file.name).join(', ');
        app.showToast(`Uploading ${files.length} file(s)...`, 'info');
        
        setTimeout(() => {
            app.showToast('Files uploaded successfully!', 'success');
        }, 2000);
    }
}

function downloadReport() {
    app.showToast('Generating report...', 'info');
    
    // Simulate report generation
    setTimeout(() => {
        app.showToast('Report downloaded successfully!', 'success');
        
        // Create a dummy download link
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,Client Report Data';
        link.download = 'client-report.pdf';
        link.click();
    }, 1500);
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new PortalApp();
});

// Utility functions for other pages
function navigateToPage(page) {
    window.location.href = page;
}

function showComingSoon() {
    if (window.app) {
        window.app.showToast('Feature coming soon!', 'info');
    } else {
        alert('Feature coming soon!');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PortalApp, showToast: app ? app.showToast : () => {} };
}