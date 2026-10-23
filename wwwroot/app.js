const API_URL = '/api/items';

const gamesContainer = document.getElementById('gamesContainer');
const itemsCount = document.getElementById('itemsCount');
const addGameForm = document.getElementById('addGameForm');
const searchInput = document.getElementById('searchInput');
const genreFilter = document.getElementById('genreFilter');

const editModalElement = document.getElementById('editModal');
const editModal = new bootstrap.Modal(editModalElement);
const editGameForm = document.getElementById('editGameForm');

// 1. Загрузка списка игр с сервера (GET /api/items)
async function loadGames() {
    const search = searchInput.value.trim();
    const genre = genreFilter.value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (genre && genre !== 'All') params.append('genre', genre);

    try {
        const response = await fetch(`${API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Ошибка при загрузке данных');
        
        const games = await response.json();
        renderGames(games);
    } catch (error) {
        console.error(error);
        gamesContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">Не удалось загрузить каталог игр.</div></div>`;
    }
}

// Отрисовка карточек
function renderGames(games) {
    itemsCount.textContent = `Найдено игр: ${games.length}`;

    if (games.length === 0) {
        gamesContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-secondary text-center py-4">
                    По вашему запросу ничего не найдено.
                </div>
            </div>`;
        return;
    }

    gamesContainer.innerHTML = games.map(game => `
        <div class="col">
            <div class="card h-100 shadow-sm border-0 game-card">
                <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0 fw-bold">${escapeHtml(game.title)}</h5>
                            <span class="badge bg-primary genre-badge">${escapeHtml(game.genre)}</span>
                        </div>
                        <p class="card-text text-muted mb-3">Год выпуска: <strong>${game.year}</strong></p>
                    </div>
                    <div class="d-flex gap-2 mt-2">
                        <button class="btn btn-sm btn-outline-secondary w-50" onclick="openEditModal(${game.id})">
                            ✏️ Изменить
                        </button>
                        <button class="btn btn-sm btn-outline-danger w-50" onclick="deleteGame(${game.id})">
                            🗑️ Удалить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 2. Добавление новой игры (POST /api/items)
addGameForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newGame = {
        title: document.getElementById('titleInput').value,
        year: parseInt(document.getElementById('yearInput').value, 10),
        genre: document.getElementById('genreInput').value
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
    });

    if (response.ok) {
        addGameForm.reset();
        document.getElementById('yearInput').value = 2024;
        await loadGames();
    } else {
        const err = await response.json();
        alert(err.message || 'Ошибка добавления');
    }
});

// 3. Получение данных одной игры (GET /api/items/{id}) и открытие окна
window.openEditModal = async function(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        alert('Не удалось загрузить данные игры');
        return;
    }

    const game = await response.json();
    document.getElementById('editId').value = game.id;
    document.getElementById('editTitle').value = game.title;
    document.getElementById('editYear').value = game.year;
    document.getElementById('editGenre').value = game.genre;

    editModal.show();
};

// 4. Обновление игры (PUT /api/items/{id})
editGameForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const updatedGame = {
        title: document.getElementById('editTitle').value,
        year: parseInt(document.getElementById('editYear').value, 10),
        genre: document.getElementById('editGenre').value
    };

    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGame)
    });

    if (response.ok) {
        editModal.hide();
        await loadGames();
    } else {
        alert('Ошибка при обновлении игры');
    }
});

// 5. Удаление игры (DELETE /api/items/{id})
window.deleteGame = async function(id) {
    if (!confirm('Вы уверены, что хотите удалить эту игру из каталога?')) return;

    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        await loadGames();
    } else {
        alert('Ошибка при удалении');
    }
};

// Защита от XSS при рендеринге текста
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Интерактивный поиск и фильтрация в реальном времени
searchInput.addEventListener('input', loadGames);
genreFilter.addEventListener('change', loadGames);

// Первичная загрузка при открытии страницы
document.addEventListener('DOMContentLoaded', loadGames);