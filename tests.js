// Проверка практической работы «Парсер страницы». Менять этот файл не нужно.
// Тест собирает правильный ответ со страницы и сравнивает его с результатом parsePage().
// Если на исходной странице всё верно, тест меняет страницу (убирает скидку, теги,
// часть карточек, меняет валюту), проверяет ещё раз и возвращает страницу как было.

(function () {
    const CURRENCY_CODES = { '₽': 'RUB', '$': 'USD', '€': 'EUR' };
    const SECTIONS = {
        meta: 'Метаданные (meta)',
        product: 'Товар (product)',
        suggested: 'Дополнительные товары (suggested)',
        reviews: 'Отзывы (reviews)',
    };
    const MAX_ERRORS = 8;

    // ---------- Правильный ответ ----------

    function textOf(root, selector) {
        const element = root.querySelector(selector);
        return element ? element.textContent.trim() : '';
    }

    function price(text) {
        const value = text.trim();
        return { currency: CURRENCY_CODES[value[0]], amount: Number(value.slice(1)) };
    }

    function content(selector) {
        return document.querySelector(selector).getAttribute('content');
    }

    function expectedPage() {
        const product = document.querySelector('.product');
        const current = price(textOf(product, '.price .current'));
        const oldElement = product.querySelector('.price .old');
        const oldPrice = oldElement ? price(oldElement.textContent).amount : null;
        const properties = {};
        product.querySelectorAll('.properties li').forEach((item) => {
            properties[item.children[0].textContent.trim()] = item.children[1].textContent.trim();
        });
        const tags = (color) => Array.from(product.querySelectorAll('.tags .' + color))
            .map((tag) => tag.textContent.trim());

        return {
            meta: {
                title: document.querySelector('title').textContent.split('—')[0].trim(),
                description: content('meta[name="description"]'),
                keywords: content('meta[name="keywords"]').split(',').map((word) => word.trim()),
                language: document.querySelector('html').lang,
                opengraph: {
                    title: content('meta[property="og:title"]').split('—')[0].trim(),
                    image: content('meta[property="og:image"]'),
                    type: content('meta[property="og:type"]'),
                },
            },
            product: {
                id: product.dataset.id,
                name: textOf(product, 'h1'),
                isLiked: product.querySelector('.like').classList.contains('active'),
                tags: { category: tags('green'), label: tags('blue'), discount: tags('red') },
                price: current.amount,
                oldPrice: oldPrice,
                discount: oldPrice === null ? 0 : oldPrice - current.amount,
                currency: current.currency,
                properties: properties,
                description: product.querySelector('.description').innerHTML.trim(),
                images: Array.from(product.querySelectorAll('.preview nav img')).map((image) => ({
                    preview: image.src,
                    full: image.dataset.src,
                    alt: image.alt,
                })),
            },
            suggested: Array.from(document.querySelectorAll('.suggested article')).map((card) => {
                const cardPrice = price(textOf(card, 'b'));
                return {
                    name: textOf(card, 'h3'),
                    description: textOf(card, 'p'),
                    image: card.querySelector('img').src,
                    price: cardPrice.amount,
                    currency: cardPrice.currency,
                };
            }),
            reviews: Array.from(document.querySelectorAll('.reviews article')).map((card) => ({
                rating: card.querySelectorAll('.rating .filled').length,
                author: {
                    avatar: card.querySelector('.author img').src,
                    name: textOf(card, '.author span'),
                },
                title: textOf(card, 'h3'),
                description: textOf(card, 'p'),
                date: textOf(card, '.author i').split('/').join('.'),
            })),
        };
    }

    // ---------- Сравнение ----------

    function typeName(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'массив';
        return {
            string: 'строка', number: 'число', boolean: 'логическое значение',
            object: 'объект', undefined: 'undefined', function: 'функция',
        }[typeof value];
    }

    function show(value) {
        if (typeof value === 'string') {
            // Переносы и отступы показываем одним пробелом, чтобы сообщение было в одну строку
            const oneLine = value.split('\n').map((line) => line.trim()).join(' ');
            const short = oneLine.length > 60 ? oneLine.slice(0, 60) + '…' : oneLine;
            return `строка "${short}"`;
        }
        if (Array.isArray(value)) return `массив из ${value.length} эл.`;
        if (value !== null && typeof value === 'object') return 'объект';
        return `${typeName(value)} ${value}`;
    }

    function compare(expected, actual, path, errors) {
        if (Object.is(expected, actual)) return;
        if (typeName(expected) !== typeName(actual)) {
            errors.push(`${path}: ожидается ${show(expected)}, получено: ${show(actual)}`);
            return;
        }
        if (Array.isArray(expected)) {
            if (expected.length !== actual.length) {
                errors.push(`${path}: ожидается массив из ${expected.length} эл., получен массив из ${actual.length} эл.`);
            }
            const length = Math.min(expected.length, actual.length);
            for (let i = 0; i < length; i++) compare(expected[i], actual[i], `${path}[${i}]`, errors);
            return;
        }
        if (typeof expected === 'object') {
            Object.keys(expected).forEach((key) => {
                if (!(key in actual)) {
                    errors.push(`${path}.${key}: нет поля, ожидается ${show(expected[key])}`);
                } else {
                    compare(expected[key], actual[key], `${path}.${key}`, errors);
                }
            });
            Object.keys(actual).forEach((key) => {
                if (!(key in expected)) errors.push(`${path}.${key}: лишнее поле, в задании его нет`);
            });
            return;
        }
        errors.push(`${path}: ожидается ${show(expected)}, получено: ${show(actual)}`);
    }

    function isEmpty(value) {
        if (Array.isArray(value)) return value.length === 0;
        return value !== null && typeof value === 'object' && Object.keys(value).length === 0;
    }

    // Проверяет одну версию страницы. Возвращает true, если все разделы верны
    function checkPage(parsePage, title) {
        console.log(`\n${title}`);
        const expected = expectedPage();
        let actual;
        try {
            actual = parsePage();
        } catch (error) {
            console.log(`❌ parsePage() завершилась с ошибкой: ${error.message}`);
            console.log('   Если ошибка про null — код ищет элемент, которого на этой версии страницы нет.');
            return false;
        }
        if (actual === null || typeof actual !== 'object') {
            console.log(`❌ parsePage() должна вернуть объект, получено: ${show(actual)}`);
            return false;
        }

        let allPassed = true;
        Object.keys(SECTIONS).forEach((key) => {
            if (!(key in actual) || isEmpty(actual[key])) {
                console.log(`⬜ ${SECTIONS[key]} — пока не заполнено`);
                allPassed = false;
                return;
            }
            const errors = [];
            compare(expected[key], actual[key], key, errors);
            if (errors.length === 0) {
                console.log(`✅ ${SECTIONS[key]}`);
                return;
            }
            allPassed = false;
            console.log(`❌ ${SECTIONS[key]} — ошибок: ${errors.length}`);
            errors.slice(0, MAX_ERRORS).forEach((error) => console.log(`   ${error}`));
            if (errors.length > MAX_ERRORS) console.log(`   …и ещё ${errors.length - MAX_ERRORS}`);
        });
        return allPassed;
    }

    // ---------- Изменённые версии страницы ----------

    // Каждое изменение запоминает, как его отменить
    function remove(element, undo) {
        const parent = element.parentNode;
        const next = element.nextSibling;
        parent.removeChild(element);
        undo.push(() => parent.insertBefore(element, next));
    }

    function setText(element, text, undo) {
        const old = element.textContent;
        element.textContent = text;
        undo.push(() => { element.textContent = old; });
    }

    function setClass(element, className, undo) {
        const old = element.className;
        element.className = className;
        undo.push(() => { element.className = old; });
    }

    const VARIANTS = [
        {
            title: 'Версия 2: товар без скидки и тегов, цены в долларах, лайк поставлен',
            change(undo) {
                remove(document.querySelector('.product .price .old'), undo);
                setText(document.querySelector('.product .price .current'), '$59', undo);
                document.querySelectorAll('.product .tags span').forEach((tag) => remove(tag, undo));
                setClass(document.querySelector('.product .like'), 'like active', undo);
                document.querySelectorAll('.suggested article b').forEach((cardPrice, i) => {
                    setText(cardPrice, '$' + (i + 1) * 10, undo);
                });
            },
        },
        {
            title: 'Версия 3: другие теги, цены в евро, меньше фотографий, карточек и отзывов',
            change(undo) {
                setText(document.querySelector('.product .price .current'), '€80', undo);
                setText(document.querySelector('.product .price .old'), '€100', undo);
                document.querySelectorAll('.product .tags span').forEach((tag) => setClass(tag, 'green', undo));
                const images = document.querySelectorAll('.product .preview nav button');
                remove(images[images.length - 1], undo);
                const cards = document.querySelectorAll('.suggested article');
                remove(cards[0], undo);
                remove(cards[1], undo);
                remove(document.querySelector('.reviews article'), undo);
                document.querySelectorAll('.reviews article .rating span')
                    .forEach((star) => setClass(star, 'empty', undo));
            },
        },
    ];

    function checkVariant(parsePage, variant) {
        const undo = [];
        try {
            variant.change(undo);
            return checkPage(parsePage, variant.title);
        } finally {
            undo.reverse().forEach((step) => step());
        }
    }

    window.makeTests = function makeTests(parsePage = window.parsePage) {
        if (typeof parsePage !== 'function') {
            console.log('❌ Не найдена функция parsePage(). Проверьте, что файл parser.js подключён и функция объявлена.');
            return;
        }
        console.log('Проверка парсера');
        if (!checkPage(parsePage, 'Версия 1: страница как есть')) {
            console.log('\nИТОГ: есть ошибки. Исправьте их — потом тест проверит другие версии страницы.');
            return;
        }
        const variantsPassed = VARIANTS.every((variant) => checkVariant(parsePage, variant));
        console.log(variantsPassed
            ? '\nИТОГ: все проверки пройдены 🎉'
            : '\nИТОГ: на исходной странице всё верно, но код не справился с другой версией страницы.');
    };
})();
