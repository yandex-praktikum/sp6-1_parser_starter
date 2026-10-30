// Этот файл оживляет страницу: переключает фотографии, лайк и описание. Менять его не нужно.

const mainImage = document.querySelector('.preview figure img');
document.querySelector('.preview nav').addEventListener('click', (e) => {
    let img, btn;
    if (e.target.nodeName === 'BUTTON') {
        img = e.target.children[0];
        btn = e.target;
    }
    if (e.target.nodeName === 'IMG') {
        img = e.target;
        btn = e.target.parentNode;
    }
    mainImage.src = img.dataset.src;
    e.currentTarget.querySelectorAll('button').forEach(el => el.removeAttribute("disabled"));
    btn.setAttribute("disabled", "disabled");
})

document.querySelector('#app .product .description').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('opened');
})

document.querySelector('.product .preview .like').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('active');
})
