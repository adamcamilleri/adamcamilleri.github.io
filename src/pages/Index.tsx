
import { useEffect, useRef, useState } from "react";

const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [navActive, setNavActive] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const skillProgressRefs = useRef<HTMLDivElement[]>([]);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      // Animate skill bars when in viewport
      skillProgressRefs.current.forEach((element) => {
        if (element && isElementInViewport(element)) {
          const width = element.getAttribute('data-width');
          if (width) {
            element.style.width = width;
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if element is in viewport
  const isElementInViewport = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  // Toggle dark theme
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    document.body.classList.toggle('dark-theme');
  };

  // Initialize loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Preloader */}
      <div className={`preloader ${isLoading ? '' : 'fade-out'}`}>
        <div className="loader"></div>
      </div>

      {/* Parallax Background */}
      <div className="parallax-container">
        <div className="scene">
          <div className="layer bg-gradient"></div>
          <div className="layer">
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            <div className="particle particle-4"></div>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="theme-toggle" onClick={toggleTheme}>
        {isDarkTheme ? '☀️' : '🌙'}
      </div>

      {/* Header */}
      <header className={isScrolled ? 'scrolled' : ''}>
        <nav className="navbar container">
          <div className="logo">
            <a href="#">Portfolio</a>
          </div>
          <ul className={`nav-links ${navActive ? 'nav-active' : ''}`}>
            <li><a href="#home" className="active">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <div className={`burger ${navActive ? 'toggle' : ''}`} onClick={() => setNavActive(!navActive)}>
            <div className="line1"></div>
            <div className="line2"></div>
            <div className="line3"></div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content fade-in-up">
          <h1>John Doe</h1>
          <h2>I'm a <span className="typing">Web Developer</span></h2>
          <p>
            A passionate front-end developer crafting beautiful and functional web experiences
            with modern technologies and creative design.
          </p>
          <div className="cta-buttons">
            <a href="#projects" className="btn primary">View My Work</a>
            <a href="#contact" className="btn secondary">Contact Me</a>
          </div>
        </div>
        <div className="scroll-indicator">
          <div className="mouse">
            <div className="wheel"></div>
          </div>
          <div className="arrow">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about section">
        <div className="container">
          <h2 className="section-title">About Me</h2>
          <div className="about-content">
            <div className="about-image fade-in-left">
              <div className="image-container">
                <img src="https://via.placeholder.com/500x600" alt="Profile" />
                <div className="image-overlay"></div>
              </div>
            </div>
            <div className="about-text fade-in-right">
              <h3>Who am I?</h3>
              <p>
                I'm a passionate front-end developer with 5 years of experience in creating beautiful and 
                functional web applications. I specialize in modern JavaScript frameworks like React, Vue, and Angular.
              </p>
              <p>
                My goal is to build user-friendly interfaces that not only look great but also provide 
                exceptional user experiences. I love solving complex problems and turning ideas into reality.
              </p>
              <div className="personal-info">
                <div className="info-item">
                  <span className="info-title">Name:</span>
                  <span className="info-value">John Doe</span>
                </div>
                <div className="info-item">
                  <span className="info-title">Email:</span>
                  <span className="info-value">john@example.com</span>
                </div>
                <div className="info-item">
                  <span className="info-title">Phone:</span>
                  <span className="info-value">+1 234 567 890</span>
                </div>
                <div className="info-item">
                  <span className="info-title">Location:</span>
                  <span className="info-value">New York, USA</span>
                </div>
              </div>
              <div className="social-links">
                <a href="#" className="social-icon">
                  <i>🔗</i>
                </a>
                <a href="#" className="social-icon">
                  <i>🔗</i>
                </a>
                <a href="#" className="social-icon">
                  <i>🔗</i>
                </a>
                <a href="#" className="social-icon">
                  <i>🔗</i>
                </a>
              </div>
              <a href="#" className="btn primary download-cv">
                Download CV <i>⬇️</i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="skills section">
        <div className="container">
          <h2 className="section-title">My Skills</h2>
          <div className="skills-container">
            <div className="skill-category fade-in-up">
              <h3>Frontend Development</h3>
              <div className="skill-grid">
                <div className="skill-item">
                  <div className="skill-icon">
                    <i>💻</i>
                  </div>
                  <h4>HTML/CSS</h4>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      data-width="95%" 
                      style={{width: "0%"}}
                      ref={(el) => el && skillProgressRefs.current.push(el)}
                    ></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-icon">
                    <i>💻</i>
                  </div>
                  <h4>JavaScript</h4>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      data-width="90%" 
                      style={{width: "0%"}}
                      ref={(el) => el && skillProgressRefs.current.push(el)}
                    ></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-icon">
                    <i>💻</i>
                  </div>
                  <h4>React</h4>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      data-width="85%" 
                      style={{width: "0%"}}
                      ref={(el) => el && skillProgressRefs.current.push(el)}
                    ></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-icon">
                    <i>💻</i>
                  </div>
                  <h4>Vue</h4>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      data-width="80%" 
                      style={{width: "0%"}}
                      ref={(el) => el && skillProgressRefs.current.push(el)}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="skill-category fade-in-up">
              <h3>Backend Development</h3>
              <div className="skill-grid">
                <div className="skill-item">
                  <div className="skill-icon">
                    <i>💻</i>
                  </div>
                  <h4>Node.js</h4>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      data-width="85%" 
                      style={{width: "0%"}}
                      ref={(el) => el && skillProgressRefs.current.push(el)}
                    ></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-icon">
                    <i>💻</i>
                  </div>
                  <h4>Express</h4>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      data-width="80%" 
                      style={{width: "0%"}}
                      ref={(el) => el && skillProgressRefs.current.push(el)}
                    ></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-icon">
                    <i>💻</i>
                  </div>
                  <h4>MongoDB</h4>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      data-width="75%" 
                      style={{width: "0%"}}
                      ref={(el) => el && skillProgressRefs.current.push(el)}
                    ></div>
                  </div>
                </div>
                <div className="skill-item">
                  <div className="skill-icon">
                    <i>💻</i>
                  </div>
                  <h4>SQL</h4>
                  <div className="skill-bar">
                    <div 
                      className="skill-progress" 
                      data-width="70%" 
                      style={{width: "0%"}}
                      ref={(el) => el && skillProgressRefs.current.push(el)}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="projects section">
        <div className="container">
          <h2 className="section-title">My Projects</h2>
          <div className="project-filters">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Web Design</button>
            <button className="filter-btn">App Development</button>
            <button className="filter-btn">E-Commerce</button>
          </div>
          <div className="projects-grid">
            <div className="project-card fade-in-up">
              <div className="project-img">
                <img src="https://via.placeholder.com/600x400" alt="Project" />
                <div className="project-overlay">
                  <div className="project-links">
                    <a href="#" className="project-link">🔗</a>
                    <a href="#" className="project-github">🔗</a>
                  </div>
                </div>
              </div>
              <div className="project-info">
                <h3>E-Commerce Website</h3>
                <p>A modern e-commerce platform with product filtering, cart functionality, and secure payment processing.</p>
                <div className="project-tech">
                  <span>React</span>
                  <span>Node.js</span>
                  <span>MongoDB</span>
                  <span>Stripe</span>
                </div>
              </div>
            </div>
            <div className="project-card fade-in-up">
              <div className="project-img">
                <img src="https://via.placeholder.com/600x400" alt="Project" />
                <div className="project-overlay">
                  <div className="project-links">
                    <a href="#" className="project-link">🔗</a>
                    <a href="#" className="project-github">🔗</a>
                  </div>
                </div>
              </div>
              <div className="project-info">
                <h3>Task Management App</h3>
                <p>A productivity app with drag-and-drop task organization, reminders, and team collaboration features.</p>
                <div className="project-tech">
                  <span>Vue.js</span>
                  <span>Firebase</span>
                  <span>Vuex</span>
                  <span>SCSS</span>
                </div>
              </div>
            </div>
            <div className="project-card fade-in-up">
              <div className="project-img">
                <img src="https://via.placeholder.com/600x400" alt="Project" />
                <div className="project-overlay">
                  <div className="project-links">
                    <a href="#" className="project-link">🔗</a>
                    <a href="#" className="project-github">🔗</a>
                  </div>
                </div>
              </div>
              <div className="project-info">
                <h3>Restaurant Website</h3>
                <p>A responsive website for a local restaurant featuring online ordering, reservations, and menu management.</p>
                <div className="project-tech">
                  <span>HTML/CSS</span>
                  <span>JavaScript</span>
                  <span>PHP</span>
                  <span>MySQL</span>
                </div>
              </div>
            </div>
          </div>
          <div className="view-more">
            <a href="#" className="btn secondary">View All Projects</a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact section">
        <div className="container">
          <h2 className="section-title">Contact Me</h2>
          <div className="contact-content">
            <div className="contact-info fade-in-left">
              <div className="contact-item">
                <div className="contact-icon">
                  <i>📍</i>
                </div>
                <div className="contact-details">
                  <h3>Location</h3>
                  <p>New York, NY, USA</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <i>📧</i>
                </div>
                <div className="contact-details">
                  <h3>Email</h3>
                  <p>john@example.com</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <i>📞</i>
                </div>
                <div className="contact-details">
                  <h3>Phone</h3>
                  <p>+1 234 567 890</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">
                  <i>🔗</i>
                </div>
                <div className="contact-details">
                  <h3>Social Profiles</h3>
                  <div className="social-links">
                    <a href="#" className="social-icon">
                      <i>🔗</i>
                    </a>
                    <a href="#" className="social-icon">
                      <i>🔗</i>
                    </a>
                    <a href="#" className="social-icon">
                      <i>🔗</i>
                    </a>
                    <a href="#" className="social-icon">
                      <i>🔗</i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="contact-form fade-in-right">
              <div className="form-group">
                <input type="text" id="name" required />
                <label htmlFor="name">Your Name</label>
              </div>
              <div className="form-group">
                <input type="email" id="email" required />
                <label htmlFor="email">Your Email</label>
              </div>
              <div className="form-group">
                <input type="text" id="subject" required />
                <label htmlFor="subject">Subject</label>
              </div>
              <div className="form-group">
                <textarea id="message" required></textarea>
                <label htmlFor="message">Your Message</label>
              </div>
              <button type="submit" className="submit-btn">
                Send Message <i>📤</i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>John Doe</h3>
              <p>
                A passionate front-end developer with expertise in creating
                beautiful and functional web applications.
              </p>
              <div className="social-links">
                <a href="#" className="social-icon">
                  <i>🔗</i>
                </a>
                <a href="#" className="social-icon">
                  <i>🔗</i>
                </a>
                <a href="#" className="social-icon">
                  <i>🔗</i>
                </a>
                <a href="#" className="social-icon">
                  <i>🔗</i>
                </a>
              </div>
            </div>
            <div className="footer-column">
              <h3>Quick Links</h3>
              <div className="footer-links">
                <a href="#home">Home</a>
                <a href="#about">About</a>
                <a href="#skills">Skills</a>
                <a href="#projects">Projects</a>
                <a href="#contact">Contact</a>
              </div>
            </div>
            <div className="footer-column">
              <h3>Contact Info</h3>
              <div className="footer-contact">
                <p><i>📧</i> john@example.com</p>
                <p><i>📞</i> +1 234 567 890</p>
                <p><i>📍</i> New York, NY, USA</p>
              </div>
            </div>
          </div>
          <div className="footer-divider"></div>
          <div className="copyright">
            © 2025 <a href="#">John Doe</a>. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* Scroll Top Button */}
      <a href="#" className={`scroll-top ${isScrolled ? 'show' : ''}`}>
        ↑
      </a>
    </>
  );
};

export default Index;
