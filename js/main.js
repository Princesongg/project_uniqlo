const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionControllers = [];
let motionPaused = false;

const createMotionController = (element, { start, stop, pauseOnHover = true }) => {
    let visible = false;
    let hovered = false;
    let running;
    const sync = () => {
        const focused = element.contains(document.activeElement);
        const shouldRun = visible && !hovered && !focused && !document.hidden && !document.querySelector('dialog[open]') && !reducedMotion.matches;
        if (running === shouldRun) return;
        running = shouldRun;
        if (running) start();
        else stop();
    };
    motionControllers.push(sync);
    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
    });
    observer.observe(element);
    element.addEventListener('pointerenter', (event) => {
        if (pauseOnHover && event.pointerType === 'mouse') hovered = true;
        sync();
    });
    element.addEventListener('pointerleave', () => { hovered = false; sync(); });
    element.addEventListener('focusin', sync);
    element.addEventListener('focusout', () => queueMicrotask(sync));
    sync();
    return sync;
};

const initMotionControls = () => {
    const button = document.querySelector('.motion-control');
    const sync = () => {
        const paused = reducedMotion.matches;
        document.documentElement.toggleAttribute('data-motion-paused', paused);
        motionControllers.forEach((controller) => controller());
    };
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    sync();
};

const initPortfolioNotice = () => {
    const dialog = document.querySelector('.portfolio-notice');
    const title = dialog.querySelector('h2');
    const description = dialog.querySelector('#portfolioNoticeDescription');
    const link = dialog.querySelector('a');
    const defaultDescription = description.innerHTML;
    const stories = {
        '4134:366': ['super-non-iron-slim-fit-shirt', '면 100% 소재에 주름 방지 가공을 더해 세탁 후 관리가 편리한 셔츠입니다. 칼라와 소맷단, 포켓까지 세심하게 설계했습니다. 세탁 환경에 따라 가벼운 다림질이 필요할 수 있습니다.'],
        '4134:367': ['colorful-50-socks', '계절과 스타일에 맞춰 업데이트하는 50가지 컬러의 양말입니다. 소재 배합과 염색을 세밀하게 조절해 깊이 있는 색감을 만들고, 마찰 테스트로 매일 신기 좋은 내구성을 확인합니다.'],
        '4134:368': ['sweat-oversized-pullover-hoodie', '독자적인 3층 구조의 원단으로 편안함과 탄탄한 실루엣을 함께 구현했습니다. 후드의 비율과 스티치, 포켓의 위치까지 다듬어 깔끔하고 절제된 디자인을 완성했습니다.'],
        '4134:362': ['flannel-shirt', '체크 패턴의 연결과 단추, 스티치까지 균형을 고려해 만든 플란넬 셔츠입니다. 바깥쪽은 두 번, 안쪽은 한 번 기모 가공해 포근한 외관과 부드러운 착용감을 살렸습니다.'],
        '4134:363': ['rayon-blouse', '레이온의 매끄러운 촉감과 자연스러운 광택에 관리의 편리함을 더했습니다. 폴리에스터를 레이온으로 감싼 원사로 주름과 수축에 강하도록 설계했습니다. 세탁 후 형태를 정돈해 옷걸이에 걸어 말려 주세요.'],
        '4134:364': ['pocketable-uv-protection-parka', 'UPF50+ 자외선 차단 기능과 가벼운 원단을 갖춘 휴대용 파카입니다. 작게 접어 파우치에 넣을 수 있으며, 발수 가공으로 가벼운 물방울을 튕겨냅니다. 발수 효과는 영구적이지 않으며 강한 물살에는 누수될 수 있습니다.'],
    };
    let trigger;
    let pointerOpened = false;
    const show = (element, label, fromPointer = false) => {
        trigger = element;
        pointerOpened = fromPointer;
        const card = element.closest('.body4-card');
        const story = card && stories[card.dataset.nodeId];
        title.textContent = story ? card.querySelector('h3').textContent : '포트폴리오 안내';
        if (story) description.textContent = story[1];
        else {
            description.innerHTML = defaultDescription;
            description.querySelector('[data-notice-feature]').textContent = label;
        }
        link.href = story ? `https://www.uniqlo.com/kr/ko/contents/feature/masterpiece/product/${story[0]}/` : 'https://www.uniqlo.com/kr/ko/';
        link.textContent = story ? '공식 제품 스토리 보기' : '유니클로 공식 사이트';
        dialog.showModal();
        motionControllers.forEach((controller) => controller());
    };
    document.addEventListener('click', (event) => {
        const element = event.target.closest('[data-demo-feature]');
        if (!element) return;
        event.preventDefault();
        show(element, element.dataset.demoFeature || element.getAttribute('aria-label') || element.textContent.trim(), event.detail > 0);
    });
    document.querySelector('.site-header__search').addEventListener('submit', (event) => {
        event.preventDefault();
        show(document.querySelector('#headerSearch'), '상품 검색');
    });
    dialog.addEventListener('close', () => {
        trigger?.focus({ preventScroll: true });
        if (pointerOpened && trigger?.closest('.body4-card')) trigger.blur();
        motionControllers.forEach((controller) => controller());
    });
};

const initSliderKeyboard = (slider, previous, next) => {
    slider.addEventListener('keydown', (event) => {
        if (event.target !== slider || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'ArrowLeft') previous();
        else next();
    });
};

const initHeroSlider = () => {
    const slider = document.querySelector('.hero__slider');

    if (!slider) return;

    let videoEnabled = false;

    const playActiveVideo = (activeSlide) => {
        slider.querySelectorAll('.hero__video').forEach((video) => {
            const shouldPlay = videoEnabled && video.closest('.hero__slide') === activeSlide;

            video.loop = true;
            video.muted = true;

            if (shouldPlay) {
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
                enabled: !reducedMotion.matches,
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
            },
            keyboard: {
                enabled: false,
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
        initSliderKeyboard(slider, () => heroSwiper.slidePrev(), () => heroSwiper.slideNext());
        createMotionController(slider, {
            pauseOnHover: false,
            start: () => {
                videoEnabled = true;
                heroSwiper.autoplay.start();
                playActiveVideo(slider.querySelector('.swiper-slide-active'));
            },
            stop: () => {
                videoEnabled = false;
                heroSwiper.autoplay.stop();
                playActiveVideo(null);
            },
        });
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

    createMotionController(slider, {
            pauseOnHover: false,
        start: () => { videoEnabled = true; startAutoplay(); playActiveVideo(slides[activeIndex]); },
        stop: () => { videoEnabled = false; window.clearInterval(autoplayTimer); playActiveVideo(null); },
    });
    window.addEventListener('resize', () => setSlide(activeIndex, false));

    setSlide(0, false);
    initSliderKeyboard(slider, () => setSlide(activeIndex - 1), () => setSlide(activeIndex + 1));
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
                    enabled: !reducedMotion.matches,
                    delay: 2000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                },
                keyboard: {
                    enabled: false,
                    onlyInViewport: true,
                },
                a11y: {
                    enabled: true,
                    containerMessage: `${slider.getAttribute('aria-label') || '상품'} 자동 재생 배너`,
                    itemRoleDescriptionMessage: '배너 슬라이드',
                },
            });

            createMotionController(slider, {
                start: () => bodySwiper.autoplay.start(),
                stop: () => bodySwiper.autoplay.stop(),
            });
            initSliderKeyboard(slider, () => bodySwiper.slidePrev(), () => bodySwiper.slideNext());
            return;
        }

        const slides = Array.from(slider.querySelectorAll('.body1__banner-slide'));
        let activeIndex = 0;

        if (slides.length < 2) return;

        const showSlide = (index) => {
            activeIndex = (index + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => {
                const isActive = slideIndex === activeIndex;
                slide.hidden = !isActive;
                slide.setAttribute('aria-hidden', String(!isActive));
            });
        };

        showSlide(0);
        initSliderKeyboard(slider, () => showSlide(activeIndex - 1), () => showSlide(activeIndex + 1));
        let timer;
        createMotionController(slider, {
            start: () => { window.clearInterval(timer); timer = window.setInterval(() => showSlide(activeIndex + 1), 2000); },
            stop: () => window.clearInterval(timer),
        });
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
        const productName = product.querySelector('h4')?.textContent.trim() || '상품';

        swatches.forEach((swatch) => {
            swatch.addEventListener('click', () => {
                swatches.forEach((item) => {
                    const isSelected = item === swatch;

                    item.classList.toggle('is-selected', isSelected);
                    item.setAttribute('aria-pressed', String(isSelected));
                });

                if (productImage && swatch.dataset.imageSrc) {
                    productImage.src = swatch.dataset.imageSrc;
                    productImage.alt = `${productName}, ${swatch.getAttribute('aria-label').replace(' 선택', '')}`;
                }
            });
        });
    });
};

const initBody3Hero = () => {
    const slider = document.querySelector('.body3-hero');

    if (!slider) return;

    if (typeof Swiper !== 'undefined') {
        const body3HeroSwiper = new Swiper(slider, {
            slidesPerView: 1,
            initialSlide: 0,
            loop: true,
            speed: 700,
            autoplay: {
                enabled: !reducedMotion.matches,
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
            },
            keyboard: {
                enabled: false,
                onlyInViewport: true,
            },
            a11y: {
                enabled: true,
                containerMessage: '시즌 컬렉션 자동 재생 이미지',
                itemRoleDescriptionMessage: '이미지 슬라이드',
            },
        });

        createMotionController(slider, {
            start: () => body3HeroSwiper.autoplay.start(),
            stop: () => body3HeroSwiper.autoplay.stop(),
        });
        initSliderKeyboard(slider, () => body3HeroSwiper.slidePrev(), () => body3HeroSwiper.slideNext());
        return;
    }

    const slides = Array.from(slider.querySelectorAll('.body3-hero__slide'));
    let activeIndex = 0;

    if (slides.length < 2) return;

    const showSlide = (index) => {
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;

            slide.hidden = !isActive;
            slide.setAttribute('aria-hidden', String(!isActive));
        });
    };

    showSlide(0);
    initSliderKeyboard(slider, () => showSlide(activeIndex - 1), () => showSlide(activeIndex + 1));
    let timer;
    createMotionController(slider, {
        start: () => { window.clearInterval(timer); timer = window.setInterval(() => showSlide(activeIndex + 1), 3000); },
        stop: () => window.clearInterval(timer),
    });
};

const initShowcaseVideo = () => {
    const video = document.querySelector('.body4-hero__video');
    if (!video) return;
    createMotionController(video.closest('section'), {
        pauseOnHover: false,
        start: () => video.play().catch(() => {}),
        stop: () => video.pause(),
    });
};

const initBody4Rolling = () => {
    document.querySelectorAll('.body4-showcase__rail').forEach((rail) => {
        const originalSet = rail.querySelector('.body4-showcase__set');

        if (!originalSet || rail.querySelector('[data-rolling-clone]')) return;

        const clonedSet = originalSet.cloneNode(true);

        clonedSet.setAttribute('aria-hidden', 'true');
        clonedSet.dataset.rollingClone = '';
        clonedSet.querySelectorAll('button, a, [tabindex]').forEach((element) => {
            element.setAttribute('tabindex', '-1');
        });
        clonedSet.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
        rail.appendChild(clonedSet);
        createMotionController(rail.closest('.body4-showcase__column'), {
            start: () => { rail.style.animationPlayState = 'running'; },
            stop: () => { rail.style.animationPlayState = 'paused'; },
        });
    });
};

const initPreFooterRolling = () => {
    const track = document.querySelector('.pre-footer__track');
    const originalSet = track?.querySelector('.pre-footer__set');

    if (!track || !originalSet || track.querySelector('[data-pre-footer-clone]')) return;

    const clonedSet = originalSet.cloneNode(true);

    clonedSet.setAttribute('aria-hidden', 'true');
    clonedSet.inert = true;
    clonedSet.dataset.preFooterClone = '';
    clonedSet.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    track.appendChild(clonedSet);
    createMotionController(track.closest('.pre-footer'), {
        pauseOnHover: false,
        start: () => { track.style.animationPlayState = 'running'; },
        stop: () => { track.style.animationPlayState = 'paused'; },
    });
};

document.addEventListener('DOMContentLoaded', () => {
    initPortfolioNotice();
    initHeroSlider();
    initBody1Slider();
    initBody1Interactions();
    initBody3Hero();
    initShowcaseVideo();
    initBody4Rolling();
    initPreFooterRolling();
    initMotionControls();
});
