function filterHeroes() {
    let input = document.getElementById('heroSearch').value.toLowerCase();
    let cards = document.getElementsByClassName('hero-card');
    
    for (let i = 0; i < cards.length; i++) {
        let nameData = cards[i].getAttribute('data-name').toLowerCase();
        if (nameData.includes(input)) {
            cards[i].style.display = "flex";
        } else {
            cards[i].style.display = "none";
        }
    }
}

function filterRole(role, btn) {
    let buttons = document.getElementsByClassName('filter-btn');
    for (let b of buttons) {
        b.classList.remove('active');
    }
    btn.classList.add('active');

    let cards = document.getElementsByClassName('hero-card');
    for (let i = 0; i < cards.length; i++) {
        let cardRole = cards[i].getAttribute('data-role');
        if (role === 'all' || cardRole === role) {
            cards[i].style.display = "flex";
        } else {
            cards[i].style.display = "none";
        }
    }
}
