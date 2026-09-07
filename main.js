// Автоматически подгружаем конфигурацию
const SUPABASE_URL = "https://nizchphlxxhvlpzlfqjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_ro2cNY3wuyas9GlfJIZ3MA_W3OTmBst";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Экранирование спецсимволов для безопасности
function safe(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 1. Проверка сессии при загрузке страницы
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    const cleanUsername = session.user.email.split('@')[0];
    initUserCabinet(session.user, cleanUsername);
  } else {
    clearCabinet();
  }
}

// 2. Вход в личный кабинет и переключение элементов
async function initUserCabinet(user, username) {
  const authModal = document.getElementById('authModal');
  const userDashboard = document.getElementById('userDashboard');
  const userWelcome = document.getElementById('userWelcome');
  const authZone = document.getElementById('auth-zone');

  if (authModal) authModal.classList.add('hidden');
  if (userDashboard) userDashboard.classList.remove('hidden');
  if (userWelcome) userWelcome.textContent = `Добро пожаловать, ${username}`;

  // Обновляем шапку в соответствии с вашим id="auth-zone"
  if (authZone) {
    authZone.innerHTML = `
      <span style="margin-right: 15px; color: var(--green-bright); font-size: 14px;">[${username}]</span>
      <button class="secondary" id="logoutButton">Выйти</button>
    `;
    
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
  }

  loadUserNotes();
}

// 3. Выход из аккаунта и очистка
function clearCabinet() {
  const userDashboard = document.getElementById('userDashboard');
  const authZone = document.getElementById('auth-zone');
  const authModal = document.getElementById('authModal');

  if (userDashboard) userDashboard.classList.add('hidden');
  
  if (authZone) {
    authZone.innerHTML = `<button class="button" id="loginButton">Войти в терминал</button>`;
    
    const loginButton = document.getElementById('loginButton');
    if (loginButton && authModal) {
      loginButton.addEventListener('click', () => authModal.classList.remove('hidden'));
    }
  }
}

// 4. Отправка формы логина с маскировкой под почту @m.ru
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const hiddenEmail = `${username}@m.ru`; 

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: hiddenEmail,
      password: password
    });

    if (error) {
      alert("Доступ отклонен: неверный логин или пароль");
    } else {
      initUserCabinet(data.user, username);
    }
  });
}

// 5. Функция выхода
async function handleLogout() {
  await supabaseClient.auth.signOut();
  clearCabinet();
}

// 6. Загрузка личных заметок из созданной вами таблицы user_notes
async function loadUserNotes() {
  const userNotesContainer = document.getElementById('userNotes');
  if (!userNotesContainer) return;

  const { data: notes, error } = await supabaseClient
    .from('user_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Ошибка загрузки заметок:", error);
    return;
  }

  userNotesContainer.innerHTML = notes.length === 0 
    ? `<p style="color: var(--muted); grid-column: 1/-1;">Личный блокнот пуст.</p>`
    : notes.map(note => `
        <div class="info" style="border: 1px solid var(--green); padding: 15px; background: rgba(0,20,9,0.8); position: relative;">
          <span style="font-size: 10px;">${new Date(note.created_at).toLocaleDateString('ru-RU')}</span>
          <strong style="display: block; margin: 5px 0 10px 0; color: var(--green-bright);">${safe(note.title)}</strong>
          <p style="color: var(--muted); font-size: 14px; margin: 0; white-space: pre-line;">${safe(note.content)}</p>
          <button onclick="deleteNote('${note.id}')" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: #ff3939; cursor: pointer;">[×]</button>
        </div>
      `).join("");
}

// 7. Создание заметки
const addNoteButton = document.getElementById('addNoteButton');
// НОВЫЙ КОД (ВСТАВИТЬ СЮДА):
// 1. Открытие окна новой заметки по клику на "+"
document.addEventListener('click', (event) => {
  if (event.target && (event.target.id === 'addNoteButton' || event.target.id === 'createNewNoteBtn')) {
    event.preventDefault();
    document.getElementById('noteTitleInput').value = "";
    document.getElementById('noteContentInput').value = "";
    document.getElementById('noteModal').classList.remove('hidden');
  }
});

// 2. Обработка кнопки "Записать" внутри нового окна
document.getElementById('saveNoteBtn')?.addEventListener('click', async () => {
  const title = document.getElementById('noteTitleInput').value.trim();
  const content = document.getElementById('noteContentInput').value.trim();
  if (!title) return; // Если заголовок пустой, ничего не делаем

  document.getElementById('noteModal').classList.add('hidden');
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  const { error } = await supabaseClient.from('user_notes').insert([{ title, content, user_id: user.id }]);
  if (error) {
    document.getElementById('errorModal').classList.remove('hidden');
  } else {
    loadUserNotes(); // Перерисовываем список заметок
  }
});


// 8. Удаление заметки
// НОВЫЙ КОД УДАЛЕНИЯ (ВСТАВИТЬ СЮДА):
let activeDeleteNoteId = null; // Запоминаем, какую заметку хотим удалить

// 1. Открытие окна подтверждения вместо confirm
window.deleteNote = function(noteId) {
  activeDeleteNoteId = noteId;
  document.getElementById('confirmDeleteModal').classList.remove('hidden');
};

// 2. Обработка кнопки "Удалить" внутри нового окна
document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
  if (!activeDeleteNoteId) return;
  document.getElementById('confirmDeleteModal').classList.add('hidden');
  
  const { error } = await supabaseClient.from('user_notes').delete().eq('id', activeDeleteNoteId);
  if (error) {
    document.getElementById('errorModal').classList.remove('hidden');
  } else {
    loadUserNotes(); // Перерисовываем список заметок
  }
  activeDeleteNoteId = null; // Сбрасываем ID
});


// Запуск инициализации при полной загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  const closeAuthBtn = document.getElementById('closeAuthBtn');
  const authModal = document.getElementById('authModal');
  if (closeAuthBtn && authModal) {
    closeAuthBtn.addEventListener('click', () => authModal.classList.add('hidden'));
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const closeErrorBtn = document.getElementById('closeErrorBtn');
  const errorModal = document.getElementById('errorModal');
  if (closeErrorBtn && errorModal) {
    closeErrorBtn.addEventListener('click', () => errorModal.classList.add('hidden'));
  }
});


