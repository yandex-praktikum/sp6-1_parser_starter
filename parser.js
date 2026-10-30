// Парсер страницы товара: собирает данные со страницы в один объект.
// Готовы функция getMeta() — это образец — и помощник parsePrice().
// Ваша задача — написать getProduct(), getSuggested() и getReviews().

// Коды валют по символу
const CURRENCIES = {
    '₽': 'RUB',
    '$': 'USD',
    '€': 'EUR',
};

// Помощник: разбирает цену вида «₽4990».
// Первый символ — валюта, остальное — число.
// parsePrice('₽4990') → { currency: 'RUB', amount: 4990 }
function parsePrice(text) {
    const price = text.trim();
    return {
        currency: CURRENCIES[price[0]],
        // slice(1) у строки работает как у массива: всё, кроме первого символа
        amount: Number(price.slice(1)),
    };
}

// Помощник для getMeta(): значение атрибута content у метатега
function getMetaContent(selector) {
    return document.querySelector(selector).getAttribute('content');
}

// Образец: данные из <head> и тега <html>
function getMeta() {
    // В заголовке после «—» идёт название магазина, оно не нужно
    const title = document.querySelector('title').textContent.split('—')[0].trim();

    // Ключевые слова записаны через запятую: делим строку и убираем пробелы у каждого слова
    const keywords = getMetaContent('meta[name="keywords"]')
        .split(',')
        .map(word => word.trim());

    return {
        title: title,
        description: getMetaContent('meta[name="description"]'),
        keywords: keywords,
        language: document.querySelector('html').lang,
        opengraph: {
            title: getMetaContent('meta[property="og:title"]').split('—')[0].trim(),
            image: getMetaContent('meta[property="og:image"]'),
            type: getMetaContent('meta[property="og:type"]'),
        },
    };
}

// Данные товара: id, название, лайк, теги, цены, свойства, описание, фотографии
function getProduct() {
    // Ваш код

    return {};
}

// Массив дополнительных товаров из блока «С этим товаром покупают»
function getSuggested() {
    // Ваш код

    return [];
}

// Массив отзывов
function getReviews() {
    // Ваш код

    return [];
}

// Собирает все данные страницы в один объект
function parsePage() {
    return {
        meta: getMeta(),
        product: getProduct(),
        suggested: getSuggested(),
        reviews: getReviews(),
    };
}
