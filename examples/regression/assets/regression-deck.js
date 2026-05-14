const slides = [...document.querySelectorAll(".slide")];
const buttons = [...document.querySelectorAll(".nav-dots button")];
let activeIndex = 0;
let wheelLock = false;

function setActive(index) {
    activeIndex = Math.max(0, Math.min(index, slides.length - 1));
    slides[activeIndex].scrollIntoView({ block: "start", behavior: "auto" });
    buttons.forEach((button, buttonIndex) => {
        button.setAttribute("aria-current", String(buttonIndex === activeIndex));
    });
}

buttons.forEach((button, index) => {
    button.addEventListener("click", () => setActive(index));
});

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        setActive(activeIndex + 1);
    }
    if (event.key === "ArrowUp" || event.key === "PageUp") {
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

setActive(0);
