// ========================================================
// VAULT-07 // PROTOCOL DATABASE
// Supabase
// ========================================================

const protContainer = document.getElementById('protContainer');
const adminPanel = document.getElementById('adminPanel');
const adminUnlockBtn = document.getElementById('adminUnlockBtn');
const pAuthZone = document.getElementById('p-auth-zone');
const addProtBtn = document.getElementById('addProtBtn');

let isAdminActive = false;
window.isAdminActive = false;
let activeDeleteProtId = null; // Глобальное объявление переменной удаления

function safe(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ========================================================
// ЗАГРУЗКА ПРОТОКОЛОВ ИЗ SUPABASE
// ========================================================
async function loadProt() {
    if (!protContainer) return;

    const { data, error } = await supabaseClient
        .from('prot')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Ошибка загрузки протоколов:", error);
        protContainer.innerHTML = `
            <div style="grid-column:1/-1; padding:30px; color:#ff3939; border:1px solid #ff3939; text-align:center;">
                ERROR // ОШИБКА БАЗЫ ПРОТОКОЛОВ
                <br><br>
                ${safe(error.message)}
            </div>
        `;
        return;
    }

    renderProtList(data || []);
}

// ========================================================
// ОТОБРАЖЕНИЕ КАРТОЧЕК
// ========================================================
function renderProtList(protList = []) {
    if (!protContainer) return;
    protContainer.innerHTML = "";

    if (!protList.length) {
        protContainer.innerHTML = `
            <div style="grid-column:1/-1; padding:80px 20px; text-align:center; color:var(--muted);">
                <div style="color:var(--green); font-size:40px; margin-bottom:15px;">[ EMPTY ]</div>
                БАЗА ПРОТОКОЛОВ ПУСТА
            </div>
        `;
        return;
    }

    protList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'staff-card';

        const avatar = item.avatar_url
            ? `<img class="staff-avatar" src="${safe(item.avatar_url)}" alt="avatar">`
            : `<div class="staff-avatar" style="display:flex; align-items:center; justify-content:center; font-size:45px; color:var(--green);">?</div>`;

        card.innerHTML = `
            <button class="delete-staff-btn" data-id="${safe(item.id)}" style="display:${isAdminActive ? 'block' : 'none'};">[×]</button>
            ${avatar}
            <span style="font-size:11px; color:var(--muted);">ID: #V07-PR${safe(item.id)}</span>
            <strong style="display:block; color:var(--green-bright); margin-top:5px; font-size:16px;">${safe(item.name)}</strong>
            <p style="color:var(--text); margin-top:3px; font-size:13px;">${safe(item.role)}</p>
        `;

        const deleteButton = card.querySelector('.delete-staff-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                const id = deleteButton.dataset.id;
                deleteProt(id);
            });
        }
        protContainer.appendChild(card);
    });
}

// ========================================================
// РЕЖИМ РЕДАКТИРОВАНИЯ
// ========================================================
if (adminUnlockBtn) {
    adminUnlockBtn.addEventListener('click', async () => {
        await requireAdminAccess({
            adminPanel,
            pAuthZone,
            onSuccess: async () => {
                await loadProt();
            }
        });
    });
}

// ========================================================
// ДОБАВЛЕНИЕ КАРТОЧКИ
// ========================================================
if (addProtBtn) {
    addProtBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!isAdminActive) { alert("Сначала включите режим редактирования."); return; }

        const name = document.getElementById('protName')?.value.trim();
        const role = document.getElementById('protRole')?.value.trim();
        const avatarUrl = document.getElementById('protImg')?.value.trim();

        if (!name) { alert("Введите наименование протокола."); return; }

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) { alert("Вы не авторизованы в Supabase. Войдите в аккаунт."); return; }

        addProtBtn.disabled = true;
        addProtBtn.textContent = "[ СОХРАНЕНИЕ... ]";

        const { error } = await supabaseClient.from('prot').insert([{ name: name, role: role || null, avatar_url: avatarUrl || null }]);

        addProtBtn.disabled = false;
        addProtBtn.textContent = "[ Внести запись в архив ]";

        if (error) { console.error("Ошибка Supabase:", error); alert("ОШИБКА СОХРАНЕНИЯ:\n\n" + error.message); return; }

        document.getElementById('protName').value = "";
        document.getElementById('protRole').value = "";
        document.getElementById('protImg').value = "";

        const successSound = document.getElementById('success-sound');
        if (successSound) { successSound.volume = 0.05; successSound.currentTime = 0; successSound.play().catch(() => {}); }
        await loadProt();
    });
}

// ========================================================
// УДАЛЕНИЕ (КАСТОМНОЕ ОКНО)
// ========================================================
function deleteProt(id) {
    if (!isAdminActive) return;
    activeDeleteProtId = id;
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
        modal.classList.remove('hidden-panel');
        modal.style.display = 'flex'; 
    }
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!activeDeleteProtId) return;
    
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
        modal.classList.add('hidden-panel');
        modal.style.display = 'none';
    }
    
    const { error } = await supabaseClient.from('prot').delete().eq('id', activeDeleteProtId);
    if (error) {
        console.error("Ошибка удаления:", error);
        alert("ОШИБКА УДАЛЕНИЯ:\n\n" + error.message);
    } else {
        await loadProt(); 
    }
    activeDeleteProtId = null;
});

// ========================================================
// ЗАПУСК
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    loadProt();
});
