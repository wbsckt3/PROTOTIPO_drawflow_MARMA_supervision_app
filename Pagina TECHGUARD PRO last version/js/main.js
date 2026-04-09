/* MENÚ HAMBURGUESA */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
});

/* DROPDOWN */
const solutionsBtn = document.getElementById("solutionsBtn");
const solutionsMenu = document.getElementById("solutionsMenu");

solutionsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    solutionsMenu.classList.toggle("open");
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-item--dropdown")) {
        solutionsMenu.classList.remove("open");
    }
});

/* MODAL CONTACTO */
const contactBtn = document.getElementById("contactBtn");
const openContact = document.getElementById("openContact");
const contactModal = document.getElementById("contactModal");
const closeModal = document.getElementById("closeModal");

contactBtn.onclick = () => contactModal.style.display = "block";
openContact.onclick = (e) => {
    e.preventDefault();
    contactModal.style.display = "block";
};
closeModal.onclick = () => contactModal.style.display = "none";
document.querySelector(".modal-backdrop").onclick = () => contactModal.style.display = "none";

/* ANIMACIÓN SCROLL */
const reveals = document.querySelectorAll(".reveal");

const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, { threshold: 0.2 });

reveals.forEach(el => obs.observe(el));
