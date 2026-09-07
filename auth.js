// Переменные подключения к вашей базе (настройки из вашего старого кода)
const SUPABASE_URL = "https://nizchphlxxhvlpzlfqjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_ro2cNY3wuyas9GlfJIZ3MA_W3OTmBst";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ========================================================
// SUPABASE RLS ADMIN ACCESS
// UI-проверка не заменяет RLS: INSERT/UPDATE/DELETE
// должны быть разрешены только политиками Supabase.
// ========================================================
async function requireAdminAccess({ adminPanel = null, pAuthZone = null, onSuccess = null } = {}) {
    try {
        const { data: { user }, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError || !user) {
            alert("Сначала войдите в аккаунт.");
            return false;
        }

        const { data: isAdmin, error } =
            await supabaseClient.rpc('is_admin');

        if (error) {
            console.error("Ошибка проверки прав администратора:", error);
            alert("НЕ УДАЛОСЬ ПРОВЕРИТЬ ПРАВА АДМИНИСТРАТОРА");
            return false;
        }

        if (isAdmin !== true) {
            alert("ОТКАЗ В ДОСТУПЕ");
            return false;
        }

        if (typeof window.isAdminActive !== "undefined") {
            window.isAdminActive = true;
        }

        if (adminPanel) adminPanel.classList.remove('hidden-panel');
        if (pAuthZone) {
            pAuthZone.innerHTML =
                `<span style="color:#39ff6a; font-size:12px; font-weight:bold;">[АДМИНИСТРАТОР]</span>`;
        }

        if (typeof onSuccess === 'function') {
            await onSuccess();
        }

        return true;
    } catch (err) {
        console.error("Admin access error:", err);
        alert("ОШИБКА ПРОВЕРКИ АДМИН-ДОСТУПА");
        return false;
    }
}


// Вспомогательная функция безопасности (чтобы пользователи не ломали сайт тегами)
function safe(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
// Элементы интерфейса
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const authZone = document.getElementById('authZone');
const cabinetSection = document.getElementById('cabinetSection');
const welcomeUser = document.getElementById('welcomeUser');
const notesContainer = document.getElementById('notesContainer');
const createNewNoteBtn = document.getElementById('createNewNoteBtn');

// 1. Проверка, вошел ли уже пользователь (работает при обновлении страницы)
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    // Берем часть почты до собаки (из test@m.ru получаем чистый логин "test")
    const cleanUsername = session.user.email.split('@')[0];
    initUserCabinet(session.user, cleanUsername);
  } else {
    clearCabinet();
  }
}

// 2. Вход в личный кабинет — БОКСЫ САЙТА ОСТАЮТСЯ НЕИЗМЕННЫМИ
async function initUserCabinet(user, username) {
  const authModal = document.getElementById('authModal');
  const userDashboard = document.getElementById('userDashboard');
  const userWelcome = document.getElementById('userWelcome');
  const authZone = document.getElementById('auth-zone');

  if (authModal) {
    authModal.classList.add('hidden');
    authModal.style.display = 'none'; 
  }

  // Настраиваем кабинет как автономный левый виджет
  if (userDashboard) {
    userDashboard.classList.remove('hidden');
    
    userDashboard.style.setProperty('display', 'flex', 'important');
    userDashboard.style.setProperty('flex-direction', 'column', 'important');
    userDashboard.style.setProperty('position', 'fixed', 'important');
    
    // Позиционируем в левый край экрана с небольшим отступом
    userDashboard.style.setProperty('left', '20px', 'important');
    userDashboard.style.setProperty('top', '110px', 'important');
    userDashboard.style.setProperty('width', '280px', 'important');
    userDashboard.style.setProperty('height', 'calc(100vh - 140px)', 'important');
    userDashboard.style.setProperty('z-index', '100', 'important');
    userDashboard.style.setProperty('box-shadow', '0 0 25px rgba(57, 255, 106, 0.25)', 'important');
  }
  
  if (userWelcome) {
    userWelcome.textContent = `Оператор: ${username}`;
  }

  // Отрисовка аватара из базы
  updateAvatarUI(user);

  // Обновляем шапку
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


function updateAvatarUI(user) {
  const avatarImg = document.getElementById('userAvatarImg');
  if (!avatarImg) return;
  const avatarPlaceholder = document.getElementById('avatarPlaceholder');
  // Проверяем, сохранена ли ссылка в метаданных профиля Supabase
  const avatarUrl = user.user_metadata?.avatar_url;

  if (avatarUrl && avatarImg && avatarPlaceholder) {
    avatarImg.src = avatarUrl;
    avatarImg.classList.remove('hidden');
    avatarImg.style.display = 'block';
    avatarPlaceholder.style.display = 'none';
  } else if (avatarImg && avatarPlaceholder) {
    avatarImg.classList.add('hidden');
    avatarImg.style.display = 'none';
    avatarPlaceholder.style.display = 'block';
  }
}
// 1. Открытие нового окна вместо prompt
document.addEventListener('click', (event) => {
  if (event.target && (event.target.id === 'changeAvatarBtn' || event.target.closest('#userAvatarContainer'))) {
    event.preventDefault();
    const currentUrl = document.getElementById('userAvatarImg')?.src || "";
    
    // Вставляем текущую ссылку в текстовое поле внутри нового окна
    document.getElementById('avatarInput').value = currentUrl.includes(window.location.origin) ? "" : currentUrl;
    
    // Показываем наше зелёное окно
    document.getElementById('avatarModal').classList.remove('hidden');
  }
});

// 2. Обработка кнопки "Сохранить" внутри нового окна
document.getElementById('saveAvatarBtn')?.addEventListener('click', async () => {
  const newAvatarUrl = document.getElementById('avatarInput').value.trim();
  
  // Прячем окно обратно
  document.getElementById('avatarModal').classList.add('hidden');
  
  // Отправляем данные в базу Supabase
  const { data, error } = await supabaseClient.auth.updateUser({
    data: { avatar_url: newAvatarUrl }
  });
  
  if (error) {
    // Если ошибка, показываем наше окно ошибки (которое мы настроили раньше)
    document.getElementById('errorModal').classList.remove('hidden');
  } else {
    // Если всё ок, обновляем аватар на экране
    updateAvatarUI(data.user);
  }
});

async function loadUserNotes() {
  const userNotesContainer = document.getElementById('userNotes');
  if (!userNotesContainer || userNotesContainer.parentElement.style.display === 'none') return; 
  
  const { data: notes, error } = await supabaseClient
    .from('user_notes')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Ошибка загрузки заметок:", error);
    return;
  }
  
  userNotesContainer.innerHTML = notes.length === 0 
    ? `<p style="color: var(--muted); font-size: 12px; margin: 10px 0; text-align: center;">Личный архив пуст.</p>`
    : notes.map(note => {
        const noteDate = new Date(note.created_at).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return `
          <div class="note-item" style="border: 1px solid rgba(57, 255, 106, 0.4); padding: 10px; background: rgba(0, 11, 5, 0.6); position: relative; box-shadow: inset 0 0 10px rgba(57, 255, 106, 0.05); transition: border-color 0.2s;">
            <div style="display: flex; justify-content: space-between; font-size: 9px; color: var(--muted); margin-bottom: 6px; padding-right: 20px; letter-spacing: 0.5px;">
              <span>LOG #${note.id.slice(0,4).toUpperCase()}</span>
              <span>${noteDate}</span>
            </div>
            <strong style="display: block; font-size: 13px; color: var(--green-bright); margin-bottom: 4px; text-shadow: 0 0 5px rgba(57, 255, 106, 0.5);">${safe(note.title)}</strong>
            <p style="color: rgba(57, 255, 106, 0.85); font-size: 12px; margin: 0; white-space: pre-line; max-height: 70px; overflow-y: auto; line-height: 1.3; font-family: monospace;">${safe(note.content)}</p>
            <button onclick="deleteNote('${note.id}')" style="position: absolute; top: 6px; right: 8px; background: transparent; border: none; color: #ff3939; font-size: 13px; cursor: pointer; padding: 0; transition: color 0.2s;" onmouseenter="this.style.color='#ff6666'" onmouseleave="this.style.color='#ff3939'">[×]</button>
          </div>
        `;
      }).join("");
}


// 3. Очистка экрана при выходе
// 3. Выход из аккаунта
function clearCabinet() {
  const userDashboard = document.getElementById('userDashboard');
  const authZone = document.getElementById('auth-zone');
  const authModal = document.getElementById('authModal');

  if (userDashboard) {
    userDashboard.classList.add('hidden');
    userDashboard.style.display = 'none';
  }
  
  if (authZone) {
    authZone.innerHTML = `<button class="button" id="loginButton">Войти в terminal</button>`;
    
    const loginButton = document.getElementById('loginButton');
    if (loginButton && authModal) {
      loginButton.addEventListener('click', () => {
        authModal.classList.remove('hidden');
        authModal.style.setProperty('display', 'flex', 'important');
      });
    }
  }
}

// 4. Логика отправки формы (приклеиваем скрытый хвост @m.ru)
// НАЙДИТЕ И ЗАМЕНИТЕ ПУНКТ 4 В auth.js НА ЭТОТ КУСОК:
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const hiddenEmail = `${username}@m.ru`; 

    console.log("=== ПОПЫТКА ВХОДА ===");
    console.log("Введенный логин на сайте:", username);
    console.log("Отправляем в Supabase email:", hiddenEmail);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: hiddenEmail,
      password: password
    });

    if (error) {
      console.error("ОТВЕТ СЕРВЕРА (ОШИБКА):", error);
      console.log("Код ошибки (status):", error.status);
      console.log("Текст ошибки (message):", error.message);
      const errorSound = document.getElementById('error-sound');
const errorModal = document.getElementById('errorModal');
if (errorSound) {
  errorSound.currentTime = 0;
  errorSound.play().catch(err => console.log("Звук заблокирован:", err));
  // Устанавливает громкость на 10% от максимума
errorSound.volume = 0.1; 
errorSound.play();

}
if (errorModal) {
  errorModal.classList.remove('hidden');
}

    } else {
      console.log("УСПЕШНЫЙ ВХОД! Данные юзера:", data.user);
      initUserCabinet(data.user, username);
    }
  });
}

// 5. Функция выхода из системы
async function handleLogout() {
  await supabaseClient.auth.signOut();
  clearCabinet();
}

// 6. Загрузка личных заметок из Supabase

// 7. Создание новой заметки
document.addEventListener('click', async (event) => {
  // Проверяем, нажали ли мы именно на кнопку создания заметки
  if (event.target && event.target.id === 'addNoteButton') {
    event.preventDefault();
    
    const title = prompt("Введите заголовок записи:");
    if (!title) return; // Если передумали и нажали отмену
    
    const content = prompt("Введите текст заметки:");

    console.log("=== СОЗДАНИЕ ЗАМЕТКИ ===");
    console.log("Заголовок:", title);

    // Получаем текущего авторизованного пользователя
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      alert("Ошибка: сессия пользователя истекла. Пожалуйста, войдите заново.");
      return;
    }

    // Отправляем заметку в таблицу user_notes
    const { error } = await supabaseClient
      .from('user_notes')
      .insert([{ title, content, user_id: user.id }]);

    if (error) {
      console.error("Ошибка сохранения в БД:", error);
      alert("Не удалось сохранить заметку: " + error.message);
    } else {
      console.log("Заметка успешно сохранена!");
      loadUserNotes(); // Перерисовываем список заметок на экране
    }
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


// Запуск проверки при загрузке страницы
// Находим этот блок в самом низу auth.js и приводим его к такому виду:
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем, авторизован ли уже пользователь
  checkAuth();
  
  // Кнопка закрытия модального окна (крестик)
  const closeAuthBtn = document.getElementById('closeAuthBtn');
  if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', () => {
      if (authModal) authModal.classList.add('hidden');
    });
  }

  // ДОБАВЬТЕ ЭТОТ КОД: Кнопка открытия модального окна
  // Ищем кнопку по ID, который сейчас прописан в вашей шапке
  const openAuthBtn = document.getElementById('openAuthBtn') || document.getElementById('loginButton');
  if (openAuthBtn) {
    openAuthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (authModal) {
        authModal.classList.remove('hidden');
      } else {
        console.error("Ошибка: Элемент #authModal не найден в HTML!");
      }
    });
  }
});
