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
                }, 1000);
            }
        });
    });
}); 