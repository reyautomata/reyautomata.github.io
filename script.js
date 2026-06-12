// Mobile menu toggle
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  const hamburger = document.querySelector('.hamburger');
  navLinks.classList.toggle('active');
  hamburger.classList.toggle('active');
}

// Close menu on link click (mobile)
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const menu = document.querySelector('.nav-links');
      const hamburger = document.querySelector('.hamburger');
      menu.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });
});