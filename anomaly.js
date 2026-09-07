// ========================================================
// VAULT-07 // ANOMALY DATABASE
// Supabase
// ========================================================

const anomalyContainer = document.getElementById('anomalyContainer');
const adminPanel = document.getElementById('adminPanel');
const adminUnlockBtn = document.getElementById('adminUnlockBtn');
const pAuthZone = document.getElementById('p-auth-zone');
const addAnomalyBtn = document.getElementById('addAnomalyBtn');

window.isAdminActive = false;
let activeDeleteAnomalyId = null; // Глобальное объявление переменной удаления

function safe(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ========================================================
// ЗАГРУЗКА АНОМАЛИЙ ИЗ SUPABASE
// ========================================================
async function loadAnomaly() {
    if (!anomalyContainer) return;

    const { data, error } = await supabaseClient
        .from('anomaly')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Ошибка загрузки аномалий:", error);
        anomalyContainer.innerHTML = `
            <div style="grid-column:1/-1; padding:30px; color:#ff3939; border:1px solid #ff3939; text-align:center;">
                ERROR // ОШИБКА БАЗЫ АНОМАЛИЙ
                <br><br>
                ${safe(error.message)}
            </div>
        `;
        return;
    }

    renderAnomalyList(data || []);
}

// ========================================================
// ОТОБРАЖЕНИЕ КАРТОЧЕК
// ========================================================
function renderAnomalyList(anomalyList = []) {
    if (!anomalyContainer) return;
    anomalyContainer.innerHTML = "";

    if (!anomalyList.length) {
        anomalyContainer.innerHTML = `
            <div style="grid-column:1/-1; padding:80px 20px; text-align:center; color:var(--muted);">
                <div style="color:var(--green); font-size:40px; margin-bottom:15px;">[ EMPTY ]</div>
                БАЗА АНОМАЛИЙ ПУСТА
            </div>
        `;
        return;
    }

    anomalyList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'staff-card';

        const avatar = item.avatar_url
            ? `<img class="staff-avatar" src="${safe(item.avatar_url)}" alt="avatar">`
            : `<div class="staff-avatar" style="display:flex; align-items:center; justify-content:center; font-size:45px; color:var(--green);">?</div>`;

        card.innerHTML = `
            <button class="delete-staff-btn" data-id="${safe(item.id)}" style="display:${window.isAdminActive ? 'block' : 'none'};">[×]</button>
            ${avatar}
            <span style="font-size:11px; color:var(--muted);">ID: #V07-A${safe(item.id)}</span>
            <strong style="display:block; color:var(--green-bright); margin-top:5px; font-size:16px;">${safe(item.name)}</strong>
            <p style="color:var(--text); margin-top:3px; font-size:13px;">${safe(item.role)}</p>
        `;

        const deleteButton = card.querySelector('.delete-staff-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                const id = deleteButton.dataset.id;
                deleteAnomaly(id);
            });
        }
        anomalyContainer.appendChild(card);
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
                await loadAnomaly();
            }
        });
    });
}

// ========================================================
// ДОБАВЛЕНИЕ КАРТОЧКИ
// ========================================================
if (addAnomalyBtn) {
    addAnomalyBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!window.isAdminActive) { alert("Сначала включите режим редактирования."); return; }

        const name = document.getElementById('anomalyName')?.value.trim();
        const role = document.getElementById('anomalyRole')?.value.trim();
        const avatarUrl = document.getElementById('anomalyImg')?.value.trim();

        if (!name) { alert("Введите наименование аномалии."); return; }

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) { alert("Вы не авторизованы в Supabase. Войдите в аккаунт."); return; }

        addAnomalyBtn.disabled = true;
        addAnomalyBtn.textContent = "[ СОХРАНЕНИЕ... ]";

        const { error } = await supabaseClient.from('anomaly').insert([{ name: name, role: role || null, avatar_url: avatarUrl || null }]);

        addAnomalyBtn.disabled = false;
        addAnomalyBtn.textContent = "[ Внести запись в архив ]";

        if (error) { console.error("Ошибка Supabase:", error); alert("ОШИБКА СОХРАНЕНИЯ:\n\n" + error.message); return; }

        document.getElementById('anomalyName').value = "";
        document.getElementById('anomalyRole').value = "";
        document.getElementById('anomalyImg').value = "";

        const successSound = document.getElementById('success-sound');
        if (successSound) { successSound.volume = 0.05; successSound.currentTime = 0; successSound.play().catch(() => {}); }
        await loadAnomaly();
    });
}

// ========================================================
// УДАЛЕНИЕ (КАСТОМНОЕ ОКНО)
// ========================================================
function deleteAnomaly(id) {
    if (!window.isAdminActive) return;
    activeDeleteAnomalyId = id;
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
        modal.classList.remove('hidden-panel');
        modal.style.display = 'flex'; 
    }
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!activeDeleteAnomalyId) return;
    
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
        modal.classList.add('hidden-panel');
        modal.style.display = 'none';
    }
    
    const { error } = await supabaseClient.from('anomaly').delete().eq('id', activeDeleteAnomalyId);
    if (error) {
        console.error("Ошибка удаления:", error);
        alert("ОШИБКА УДАЛЕНИЯ:\n\n" + error.message);
    } else {
        await loadAnomaly(); 
    }
    activeDeleteAnomalyId = null;
});

// ========================================================
// ЗАПУСК
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    loadAnomaly();
});
