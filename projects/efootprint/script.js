// Navigation active state
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section');

    // Update active nav link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            navbar.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
            navbar.classList.remove('scroll-up');
            navbar.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
            navbar.classList.remove('scroll-down');
            navbar.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });

    // Animate stats when in viewport
    const animateStats = () => {
        const stats = document.querySelectorAll('.stat-number');
        
        stats.forEach(stat => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = entry.target;
                        const value = target.textContent;
                        const isPercentage = value.includes('%');
                        const isPlus = value.includes('+');
                        const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ''));
                        
                        let start = 0;
                        const duration = 2000;
                        const startTime = performance.now();
                        
                        const updateValue = (currentTime) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            
                            const currentValue = Math.floor(progress * numericValue);
                            target.textContent = isPercentage ? 
                                `${currentValue}%` : 
                                isPlus ? 
                                    `${currentValue}+` : 
                                    currentValue.toLocaleString();
                            
                            if (progress < 1) {
                                requestAnimationFrame(updateValue);
                            }
                        };
                        
                        requestAnimationFrame(updateValue);
                        observer.unobserve(target);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(stat);
        });
    };

    // Initialize animations
    animateStats();

    // Newsletter form handling
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            
            // Simulate API call
            setTimeout(() => {
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Thank you for subscribing!';
                newsletterForm.appendChild(successMessage);
                
                setTimeout(() => {
                    successMessage.remove();
                    newsletterForm.reset();
                }, 3000);
            }, 1000);
        });
    }

    // Pricing card hover effect
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            pricingCards.forEach(c => c.classList.remove('featured'));
            card.classList.add('featured');
        });
    });

    // Activity feed animation
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.2}s`;
    });

    // Feature cards hover effect
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // Mobile menu toggle
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'mobile-menu-button';
    mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.navbar').appendChild(mobileMenuButton);

    mobileMenuButton.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        navLinks.classList.toggle('active');
        mobileMenuButton.querySelector('i').classList.toggle('fa-bars');
        mobileMenuButton.querySelector('i').classList.toggle('fa-times');
    });

    // Add loading animation to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.classList.contains('no-loading')) {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    
                    // If this is the Start Tracking button, show the tracking modal
                    if (this.classList.contains('cta-button') && this.textContent.includes('Start Tracking')) {
                        showTrackingModal();
                    }
                }, 1000);
            }
        });
    });

    // Tracking Modal Functionality
    function showTrackingModal() {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'tracking-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Start Tracking Your Digital Footprint</h2>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="tracking-options">
                        <div class="tracking-option">
                            <h3>Manual Entry</h3>
                            <p>Track your digital activities by entering them manually. Perfect for getting started!</p>
                            <button class="manual-entry-btn">Start Manual Entry</button>
                        </div>
                        <div class="tracking-option">
                            <h3>Connect Your Devices</h3>
                            <p>Link your devices to automatically track their energy usage and carbon impact</p>
                            <button class="connect-device-btn">Connect Device</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.appendChild(modal);

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .tracking-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease;
            }

            .modal-content {
                background: white;
                padding: 2rem;
                border-radius: var(--border-radius);
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }

            .close-modal {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--text-color);
            }

            .tracking-options {
                display: grid;
                gap: 1.5rem;
            }

            .tracking-option {
                background: var(--light-background);
                padding: 1.5rem;
                border-radius: var(--border-radius);
                text-align: center;
            }

            .tracking-option h3 {
                margin-bottom: 0.5rem;
                color: var(--text-color);
            }

            .tracking-option p {
                margin-bottom: 1rem;
                color: var(--light-text);
            }

            .connect-device-btn,
            .manual-entry-btn {
                background: var(--primary-color);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: var(--border-radius);
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .connect-device-btn:hover,
            .manual-entry-btn:hover {
                background: var(--secondary-color);
                transform: translateY(-2px);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @media (max-width: 768px) {
                .modal-content {
                    width: 95%;
                    padding: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.remove();
            style.remove();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                style.remove();
            }
        });

        // Add functionality to tracking option buttons
        const connectDeviceBtn = modal.querySelector('.connect-device-btn');
        const manualEntryBtn = modal.querySelector('.manual-entry-btn');

        connectDeviceBtn.addEventListener('click', () => {
            alert('Device connection feature coming soon!');
        });

        manualEntryBtn.addEventListener('click', () => {
            showManualEntryForm();
        });
    }

    function showManualEntryForm() {
        const modal = document.createElement('div');
        modal.className = 'tracking-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Manual Activity Entry</h2>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <form class="manual-entry-form">
                        <div class="form-group">
                            <label for="activity-type">Activity Type</label>
                            <select id="activity-type" required>
                                <option value="">Select an activity</option>
                                <option value="streaming">Video Streaming</option>
                                <option value="gaming">Gaming</option>
                                <option value="social">Social Media</option>
                                <option value="work">Work/Productivity</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="duration">Duration (hours)</label>
                            <input type="number" id="duration" min="0.1" step="0.1" required>
                        </div>
                        <div class="form-group">
                            <label for="device">Device Used</label>
                            <select id="device" required>
                                <option value="">Select a device</option>
                                <option value="laptop">Laptop</option>
                                <option value="desktop">Desktop PC</option>
                                <option value="mobile">Mobile Phone</option>
                                <option value="tablet">Tablet</option>
                            </select>
                        </div>
                        <button type="submit" class="submit-btn">Save Activity</button>
                    </form>
                </div>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .manual-entry-form {
                display: grid;
                gap: 1.5rem;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .form-group label {
                color: var(--text-color);
                font-weight: 500;
            }

            .form-group select,
            .form-group input {
                padding: 0.75rem;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                font-size: 1rem;
            }

            .submit-btn {
                background: var(--primary-color);
                color: white;
                border: none;
                padding: 1rem;
                border-radius: var(--border-radius);
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .submit-btn:hover {
                background: var(--secondary-color);
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);

        // Add modal to body
        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.remove();
            style.remove();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                style.remove();
            }
        });

        // Update form submission
        const form = modal.querySelector('.manual-entry-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const activityType = form.querySelector('#activity-type').value;
            const duration = parseFloat(form.querySelector('#duration').value);
            const device = form.querySelector('#device').value;

            // Save activity to local storage
            const data = JSON.parse(localStorage.getItem('efootprint_guest_data'));
            data.activities.push({
                type: activityType,
                duration: duration,
                device: device,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('efootprint_guest_data', JSON.stringify(data));

            // Update dashboard
            updateDashboard();

            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Activity saved successfully!';
            form.appendChild(successMessage);

            // Close modal after delay
            setTimeout(() => {
                modal.remove();
                style.remove();
            }, 1500);
        });
    }

    // Initialize guest mode and load data
    function initializeGuestMode() {
        if (!localStorage.getItem('efootprint_guest_data')) {
            localStorage.setItem('efootprint_guest_data', JSON.stringify({
                activities: [],
                totalCarbonFootprint: 0,
                lastUpdated: new Date().toISOString()
            }));
        }
        updateDashboard();
    }

    // Update dashboard with user data
    function updateDashboard() {
        const data = JSON.parse(localStorage.getItem('efootprint_guest_data'));
        const activities = data.activities;
        
        // Calculate today's impact
        const today = new Date().toDateString();
        const todayActivities = activities.filter(activity => 
            new Date(activity.timestamp).toDateString() === today
        );
        const todayImpact = todayActivities.reduce((sum, activity) => 
            sum + calculateCarbonImpact(activity), 0
        );

        // Calculate weekly trend
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekActivities = activities.filter(activity => 
            new Date(activity.timestamp) >= lastWeek
        );
        const lastWeekImpact = lastWeekActivities.reduce((sum, activity) => 
            sum + calculateCarbonImpact(activity), 0
        );

        // Update dashboard stats
        document.querySelector('.stat-value:nth-child(1)').textContent = 
            `${todayImpact.toFixed(1)} kg`;
        
        const weeklyTrend = lastWeekImpact > 0 ? 
            ((todayImpact - lastWeekImpact) / lastWeekImpact * 100).toFixed(0) : 0;
        document.querySelector('.stat-value:nth-child(2)').textContent = 
            `${weeklyTrend}%`;
        
        // Update activity feed
        const activityFeed = document.querySelector('.activity-feed');
        if (activityFeed) {
            const recentActivities = activities.slice(-3).reverse();
            activityFeed.innerHTML = `
                <h3>Recent Activities</h3>
                ${recentActivities.map(activity => `
                    <div class="activity-item">
                        <i class="fas ${getActivityIcon(activity.type)}"></i>
                        <div class="activity-content">
                            <h4>${formatActivityType(activity.type)}</h4>
                            <p>${activity.duration} hours on ${formatDevice(activity.device)}</p>
                            <span class="activity-time">${formatTimestamp(activity.timestamp)}</span>
                        </div>
                    </div>
                `).join('')}
            `;
        }
    }

    // Calculate carbon impact based on activity
    function calculateCarbonImpact(activity) {
        const deviceFactors = {
            laptop: 0.05,
            desktop: 0.1,
            mobile: 0.02,
            tablet: 0.03
        };

        const activityFactors = {
            streaming: 0.1,
            gaming: 0.15,
            social: 0.05,
            work: 0.08,
            other: 0.07
        };

        return activity.duration * deviceFactors[activity.device] * activityFactors[activity.type];
    }

    // Helper functions
    function getActivityIcon(type) {
        const icons = {
            streaming: 'fa-video',
            gaming: 'fa-gamepad',
            social: 'fa-users',
            work: 'fa-laptop',
            other: 'fa-desktop'
        };
        return icons[type] || 'fa-desktop';
    }

    function formatActivityType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
    }

    function formatDevice(device) {
        return device.charAt(0).toUpperCase() + device.slice(1);
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff/60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff/3600000)} hours ago`;
        return date.toLocaleDateString();
    }

    // Initialize everything when the DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // ... existing initialization code ...

        // Initialize guest mode
        initializeGuestMode();

        // Update dashboard periodically
        setInterval(updateDashboard, 60000); // Update every minute
    });
}); 