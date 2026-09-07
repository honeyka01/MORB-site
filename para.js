// ========================================================
// VAULT-07 // PAIR DATABASE
// Supabase
// ========================================================

const paraContainer = document.getElementById('paraContainer');
const adminPanel = document.getElementById('adminPanel');
const adminUnlockBtn = document.getElementById('adminUnlockBtn');
const pAuthZone = document.getElementById('p-auth-zone');
const addParaBtn = document.getElementById('addParaBtn');

window.isAdminActive = false;
let activeDeleteParaId = null; // Глобальное объявление переменной удаления

function safe(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ========================================================
// ЗАГРУЗКА ДАННЫХ ИЗ SUPABASE
// ========================================================
async function loadPara() {
    if (!paraContainer) return;

    const { data, error } = await supabaseClient
        .from('para')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Ошибка загрузки пар:", error);
        paraContainer.innerHTML = `
            <div style="grid-column:1/-1; padding:30px; color:#ff3939; border:1px solid #ff3939; text-align:center;">
                ERROR // ОШИБКА БАЗЫ ДАННЫХ ПАР
                <br><br>
                ${safe(error.message)}
            </div>
        `;
        return;
    }

    renderParaList(data || []);
}

// ========================================================
// ОТОБРАЖЕНИЕ КАРТОЧЕК
// ========================================================
function renderParaList(paraList = []) {
    if (!paraContainer) return;
    paraContainer.innerHTML = "";

    if (!paraList.length) {
        paraContainer.innerHTML = `
            <div style="grid-column:1/-1; padding:80px 20px; text-align:center; color:var(--muted);">
                <div style="color:var(--green); font-size:40px; margin-bottom:15px;">[ EMPTY ]</div>
                БАЗА ПАР ПУСТА
            </div>
        `;
        return;
    }

    paraList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'staff-card';

        const avatar = item.avatar_url
            ? `<img class="staff-avatar" src="${safe(item.avatar_url)}" alt="avatar">`
            : `<div class="staff-avatar" style="display:flex; align-items:center; justify-content:center; font-size:45px; color:var(--green);">?</div>`;

        card.innerHTML = `
            <button class="delete-staff-btn" data-id="${safe(item.id)}" style="display:${window.isAdminActive ? 'block' : 'none'};">[×]</button>
            ${avatar}
            <span style="font-size:11px; color:var(--muted);">ID: #V07-P${safe(item.id)}</span>
            <strong style="display:block; color:var(--green-bright); margin-top:5px; font-size:16px;">${safe(item.name)}</strong>
            <p style="color:var(--text); margin-top:3px; font-size:13px;">${safe(item.role)}</p>
        `;

        const deleteButton = card.querySelector('.delete-staff-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                const id = deleteButton.dataset.id;
                deletePara(id);
            });
        }
        paraContainer.appendChild(card);
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
                await loadPara();
            }
        });
    });
}

// ========================================================
// ДОБАВЛЕНИЕ КАРТОЧКИ
// ========================================================
if (addParaBtn) {
    addParaBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!window.isAdminActive) { alert("Сначала включите режим редактирования."); return; }

        const name = document.getElementById('paraName')?.value.trim();
        const role = document.getElementById('paraRole')?.value.trim();
        const avatarUrl = document.getElementById('paraImg')?.value.trim();

        if (!name) { alert("Введите название пары."); return; }

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) { alert("Вы не авторизованы в Supabase. Войдите в аккаунт."); return; }

        addParaBtn.disabled = true;
        addParaBtn.textContent = "[ СОХРАНЕНИЕ... ]";

        const { error } = await supabaseClient.from('para').insert([{ name: name, role: role || null, avatar_url: avatarUrl || null }]);

        addParaBtn.disabled = false;
        addParaBtn.textContent = "[ Внести запись в архив ]";

        if (error) { console.error("Ошибка Supabase:", error); alert("ОШИБКА СОХРАНЕНИЯ:\n\n" + error.message); return; }

        document.getElementById('paraName').value = "";
        document.getElementById('paraRole').value = "";
        document.getElementById('paraImg').value = "";

        const successSound = document.getElementById('success-sound');
        if (successSound) { successSound.volume = 0.05; successSound.currentTime = 0; successSound.play().catch(() => {}); }
        await loadPara();
    });
}

// ========================================================
// УДАЛЕНИЕ (КАСТОМНОЕ ОКНО)
// ========================================================
function deletePara(id) {
    if (!window.isAdminActive) return;
    activeDeleteParaId = id;
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
        modal.classList.remove('hidden-panel');
        modal.style.display = 'flex'; 
    }
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!activeDeleteParaId) return;
    
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
        modal.classList.add('hidden-panel');
        modal.style.display = 'none';
    }
    
    const { error } = await supabaseClient.from('para').delete().eq('id', activeDeleteParaId);
    if (error) {
        console.error("Ошибка удаления:", error);
        alert("ОШИБКА УДАЛЕНИЯ:\n\n" + error.message);
    } else {
        await loadPara(); 
    }
    activeDeleteParaId = null;
});

// ========================================================
// ЗАПУСК
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    loadPara();
});
