const initHeaderMenu = () => {
    const header = document.querySelector('.site-header');
    const menuButton = document.querySelector('.site-header__menu-button');

    if (!header || !menuButton) return;

    menuButton.addEventListener('click', () => {
        const isOpen = header.classList.toggle('is-menu-open');
        menuButton.setAttribute('aria-expanded', String(isOpen));
        menuButton.setAttribute('aria-label', isOpen ? '모바일 메뉴 닫기' : '모바일 메뉴 열기');
    });
};

const initHeroSlider = () => {
    const slider = document.querySelector('.hero__slider');

    if (!slider) return;

    const playActiveVideo = (activeSlide) => {
        slider.querySelectorAll('.hero__video').forEach((video) => {
            const shouldPlay = video.closest('.hero__slide') === activeSlide;

            video.loop = true;
            video.muted = true;

            if (shouldPlay) {
                video.currentTime = 0;
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    };

    if (typeof Swiper !== 'undefined') {
        const heroSwiper = new Swiper(slider, {
            slidesPerView: 'auto',
            centeredSlides: true,
            spaceBetween: 50,
            initialSlide: 0,
            loop: false,
            rewind: true,
            watchSlidesProgress: true,
            speed: 700,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            keyboard: {
                enabled: true,
                onlyInViewport: true,
            },
            a11y: {
                enabled: true,
                containerMessage: 'UT 컬렉션 자동 재생 슬라이드',
                itemRoleDescriptionMessage: '슬라이드',
            },
        });

        const syncActiveSlide = () => {
            const activeSlide = slider.querySelector('.swiper-slide-active');

            slider.querySelectorAll('.hero__slide').forEach((slide) => {
                slide.setAttribute('aria-hidden', String(slide !== activeSlide));
            });

            playActiveVideo(activeSlide);
        };

        heroSwiper.on('slideChangeTransitionStart', () => playActiveVideo(null));
        heroSwiper.on('slideChangeTransitionEnd', syncActiveSlide);
        slider.addEventListener('focusin', () => heroSwiper.autoplay.stop());
        slider.addEventListener('focusout', () => heroSwiper.autoplay.start());
        heroSwiper.slideTo(0, 0, false);
        syncActiveSlide();
        return;
    }

    const list = slider.querySelector('.hero__list');
    const slides = Array.from(slider.querySelectorAll('.hero__slide'));
    let activeIndex = 0;
    let autoplayTimer;

    if (!list || !slides.length) return;

    list.style.gap = '50px';

    const setSlide = (nextIndex, animate = true) => {
        activeIndex = (nextIndex + slides.length) % slides.length;
        const activeSlide = slides[activeIndex];
        const offset = slider.clientWidth / 2 - (activeSlide.offsetLeft + activeSlide.offsetWidth / 2);

        list.style.transition = animate ? 'transform 0.7s ease' : 'none';
        list.style.transform = `translateX(${offset}px)`;

        slides.forEach((slide, index) => {
            slide.classList.toggle('swiper-slide-active', index === activeIndex);
            slide.setAttribute('aria-hidden', String(index !== activeIndex));
        });

        playActiveVideo(activeSlide);
    };

    const startAutoplay = () => {
        window.clearInterval(autoplayTimer);
        autoplayTimer = window.setInterval(() => setSlide(activeIndex + 1), 3000);
    };

    slider.addEventListener('pointerenter', () => window.clearInterval(autoplayTimer));
    slider.addEventListener('pointerleave', startAutoplay);
    slider.addEventListener('focusin', () => window.clearInterval(autoplayTimer));
    slider.addEventListener('focusout', startAutoplay);
    window.addEventListener('resize', () => setSlide(activeIndex, false));

    setSlide(0, false);
    startAutoplay();
};

const initBody1Slider = () => {
    const sliders = document.querySelectorAll('.body1__banner');

    if (!sliders.length) return;

    sliders.forEach((slider) => {
        if (typeof Swiper !== 'undefined') {
            const bodySwiper = new Swiper(slider, {
                slidesPerView: 1,
                initialSlide: 0,
                loop: true,
                speed: 600,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                },
                keyboard: {
                    enabled: true,
                    onlyInViewport: true,
                },
                a11y: {
                    enabled: true,
                    containerMessage: `${slider.getAttribute('aria-label') || '상품'} 자동 재생 배너`,
                    itemRoleDescriptionMessage: '배너 슬라이드',
                },
            });

            slider.addEventListener('focusin', () => bodySwiper.autoplay.stop());
            slider.addEventListener('focusout', () => bodySwiper.autoplay.start());
            return;
        }

        const slides = Array.from(slider.querySelectorAll('.body1__banner-slide'));
        let activeIndex = 0;

        if (slides.length < 2) return;

        const showSlide = (index) => {
            activeIndex = index % slides.length;
            slides.forEach((slide, slideIndex) => {
                const isActive = slideIndex === activeIndex;
                slide.hidden = !isActive;
                slide.setAttribute('aria-hidden', String(!isActive));
            });
        };

        showSlide(0);
        window.setInterval(() => showSlide(activeIndex + 1), 2000);
    });
};

const initBody1Interactions = () => {
    document.querySelectorAll('.body1__favorite').forEach((button) => {
        const icon = button.querySelector('img');
        const defaultLabel = button.getAttribute('aria-label') || '상품 찜하기';

        if (!icon) return;

        button.addEventListener('click', () => {
            const isActive = button.classList.toggle('is-active');

            button.setAttribute('aria-pressed', String(isActive));
            button.setAttribute('aria-label', isActive ? defaultLabel.replace('찜하기', '찜 해제') : defaultLabel);
            icon.src = isActive ? 'images/icon-heart-filled.svg' : 'images/icon-heart.svg';
        });
    });

    document.querySelectorAll('.body1__product').forEach((product) => {
        const swatches = product.querySelectorAll('.body1__swatch');
        const productImage = product.querySelector('.body1__product-photo > img');

        swatches.forEach((swatch) => {
            swatch.addEventListener('click', () => {
                swatches.forEach((item) => {
                    const isSelected = item === swatch;

                    item.classList.toggle('is-selected', isSelected);
                    item.setAttribute('aria-pressed', String(isSelected));
                });

                if (productImage && swatch.dataset.imageSrc) {
                    productImage.src = swatch.dataset.imageSrc;
                }
            });
        });
    });
};

const initCategoryTabs = () => {
    const buttons = document.querySelectorAll('[data-category-tab]');
    const cards = document.querySelectorAll('[data-category]');

    if (!buttons.length || !cards.length) return;

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedCategory = button.dataset.categoryTab;

            buttons.forEach((tab) => {
                tab.classList.toggle('is-active', tab === button);
            });

            cards.forEach((card) => {
                const shouldShow = selectedCategory === 'all' || card.dataset.category === selectedCategory;
                card.classList.toggle('is-hidden', !shouldShow);
            });
        });
    });
};

const initBody3Rolling = () => {
    document.querySelectorAll('.body3-showcase__rail').forEach((rail) => {
        const originalSet = rail.querySelector('.body3-showcase__set');

        if (!originalSet || rail.querySelector('[data-rolling-clone]')) return;

        const clonedSet = originalSet.cloneNode(true);

        clonedSet.setAttribute('aria-hidden', 'true');
        clonedSet.dataset.rollingClone = '';
        clonedSet.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
        rail.appendChild(clonedSet);
    });
};

const initPreFooterRolling = () => {
    const track = document.querySelector('.pre-footer__track');
    const originalSet = track?.querySelector('.pre-footer__set');

    if (!track || !originalSet || track.querySelector('[data-pre-footer-clone]')) return;

    const clonedSet = originalSet.cloneNode(true);

    clonedSet.setAttribute('aria-hidden', 'true');
    clonedSet.dataset.preFooterClone = '';
    clonedSet.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    track.appendChild(clonedSet);
};

document.addEventListener('DOMContentLoaded', () => {
    initHeaderMenu();
    initHeroSlider();
    initBody1Slider();
    initBody1Interactions();
    initCategoryTabs();
    initBody3Rolling();
    initPreFooterRolling();
});
