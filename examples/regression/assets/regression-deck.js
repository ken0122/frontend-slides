const slides = [...document.querySelectorAll(".slide")];
const buttons = [...document.querySelectorAll(".nav-dots button")];
const progressBar = document.querySelector(".progress-bar");
let activeIndex = 0;
let wheelLock = false;
let touchStartY = 0;

window.__frontendSlidesSpec = {
    progress: Boolean(progressBar),
    touch: true,
    intersectionObserver: "IntersectionObserver" in window,
    reducedMotion: true,
    reveal: document.querySelectorAll(".reveal").length > 0
};

function setActive(index) {
    activeIndex = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("visible", slideIndex === activeIndex);
    });
    slides[activeIndex].scrollIntoView({ block: "start", behavior: "auto" });
    buttons.forEach((button, buttonIndex) => {
        button.setAttribute("aria-current", String(buttonIndex === activeIndex));
    });
    if (progressBar) {
        progressBar.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
    }
}

buttons.forEach((button, index) => {
    button.addEventListener("click", () => setActive(index));
});

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        setActive(activeIndex + 1);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setActive(activeIndex - 1);
    }
});

document.addEventListener("wheel", (event) => {
    if (wheelLock || Math.abs(event.deltaY) < 8) {
        return;
    }
    wheelLock = true;
    setActive(activeIndex + (event.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => {
        wheelLock = false;
    }, 180);
}, { passive: true });

document.addEventListener("touchstart", (event) => {
    touchStartY = event.changedTouches[0]?.clientY || 0;
}, { passive: true });

document.addEventListener("touchend", (event) => {
    const endY = event.changedTouches[0]?.clientY || touchStartY;
    const deltaY = touchStartY - endY;
    if (Math.abs(deltaY) < 32) {
        return;
    }
    setActive(activeIndex + (deltaY > 0 ? 1 : -1));
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            const index = slides.indexOf(entry.target);
            if (index >= 0) {
                activeIndex = index;
                slides.forEach((slide, slideIndex) => {
                    slide.classList.toggle("visible", slideIndex === index);
                });
            }
        }
    }
}, { threshold: 0.5 });

for (const slide of slides) {
    observer.observe(slide);
}

setActive(0);
