import axios from 'axios';
import dompurify from 'dompurify';

const searchResultsHTML = (stores) => {
    return stores.map(store => {
        return `
            <a href="/store/${store.slug}" class="search__result">
                <strong>${store.name}</strong>
            </a>
        `;
    }).join('');
}

const typeAhead = (search) => {
    if (!search) return;
    const searchInput = search.querySelector('input[name=search]');
    const searchResult = search.querySelector('.search__results');
    searchInput.on('input', function() {
        // if there is no value, return
        if (!this.value) {
            searchResult.style.display = 'none';
            return;
        }
        searchResult.style.display = 'block';
        axios
            .get(`/api/search?q=${this.value}`)
            .then((res) => {
                if (res.data.length) {
                    searchResult.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
                    return;
                }
                // else if nothing is found
                searchResult.innerHTML = dompurify.sanitize(`
                    <div class="search__result"> No result for ${this.value} found.</div>
                `);
            })
            .catch(err => console.error(err));
    });

    // handle keyboard inputs
    searchInput.on('keyup', (e) => {
        //if not up, down or enter, exit (up=38, down=40, enter=13)
        if (![38, 40, 13].includes(e.keyCode)) return;
        const activeClass = 'search__result--active';
        const current = search.querySelector(`.${activeClass}`);
        const items = search.querySelectorAll('.search__result');
        let next;
        if (e.keyCode === 40 && current) {
            next = current.nextElementSibling || items[0];
        } else if (e.keyCode === 40) {
            next = items[0];
        } else if (e.keyCode === 38 && current) {
            next = current.previousElementSibling || items[items.length - 1];
        } else if (e.keyCode === 38) {
            next = items[items.length - 1];
        } else if (e.keyCode === 13 && current.href) {
            window.location = current.href;
            return;
        }
        if (current) current.classList.remove(activeClass);
        next.classList.add(activeClass);
        console.log(search);
        console.log(next);
        console.log(current);
    });
}

export default typeAhead;