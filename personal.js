// ========================================================
// VAULT-07 // PERSONNEL DATABASE
// Supabase
// ========================================================

const staffContainer = document.getElementById('staffContainer');
const adminPanel = document.getElementById('adminPanel');
const adminUnlockBtn = document.getElementById('adminUnlockBtn');
const pAuthZone = document.getElementById('p-auth-zone');
const addStaffBtn = document.getElementById('addStaffBtn');

window.isAdminActive = false;
let activeDeleteStaffId = null; // Глобальное объявление переменной удаления

function safe(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ========================================================
// ЗАГРУЗКА ПЕРСОНАЛА ИЗ SUPABASE
// ========================================================
async function loadStaff() {
    if (!staffContainer) return;

    const { data, error } = await supabaseClient
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Ошибка загрузки персонала:", error);
        staffContainer.innerHTML = `
            <div style="grid-column:1/-1; padding:30px; color:#ff3939; border:1px solid #ff3939; text-align:center;">
                ERROR // ОШИБКА БАЗЫ ПЕРСОНАЛА
                <br><br>
                ${safe(error.message)}
            </div>
        `;
        return;
    }

    renderStaffList(data || []);
}

// ========================================================
// ОТОБРАЖЕНИЕ КАРТОЧЕК
// ========================================================
function renderStaffList(staff = []) {
    if (!staffContainer) return;
    staffContainer.innerHTML = "";

    if (!staff.length) {
        staffContainer.innerHTML = `
            <div style="grid-column:1/-1; padding:80px 20px; text-align:center; color:var(--muted);">
                <div style="color:var(--green); font-size:40px; margin-bottom:15px;">[ EMPTY ]</div>
                БАЗА ПЕРСОНАЛА ПУСТА
            </div>
        `;
        return;
    }

    staff.forEach(item => {
        const card = document.createElement('div');
        card.className = 'staff-card';

        const avatar = item.avatar_url
            ? `<img class="staff-avatar" src="${safe(item.avatar_url)}" alt="avatar">`
            : `<div class="staff-avatar" style="display:flex; align-items:center; justify-content:center; font-size:45px; color:var(--green);">?</div>`;

        card.innerHTML = `
            <button class="delete-staff-btn" data-id="${safe(item.id)}" style="display:${window.isAdminActive ? 'block' : 'none'};">[×]</button>
            ${avatar}
            <span style="font-size:11px; color:var(--muted);">ID: #V07-${safe(item.id)}</span>
            <strong style="display:block; color:var(--green-bright); margin-top:5px; font-size:16px;">${safe(item.name)}</strong>
            <p style="color:var(--text); margin-top:3px; font-size:13px;">${safe(item.role)}</p>
        `;

        const deleteButton = card.querySelector('.delete-staff-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                const id = deleteButton.dataset.id;
                deleteStaff(id);
            });
        }
        staffContainer.appendChild(card);
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
                await loadStaff();
            }
        });
    });
}

// ========================================================
// ДОБАВЛЕНИЕ КАРТОЧКИ
// ========================================================
if (addStaffBtn) {
    addStaffBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!window.isAdminActive) { alert("Сначала включите режим редактирования."); return; }

        const name = document.getElementById('staffName')?.value.trim();
        const role = document.getElementById('staffRole')?.value.trim();
        const avatarUrl = document.getElementById('staffImg')?.value.trim();

        if (!name) { alert("Введите имя участника."); return; }

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) { alert("Вы не авторизованы в Supabase. Войдите в аккаунт."); return; }

        addStaffBtn.disabled = true;
        addStaffBtn.textContent = "[ СОХРАНЕНИЕ... ]";

        const { error } = await supabaseClient.from('staff').insert([{ name: name, role: role || null, avatar_url: avatarUrl || null }]);

        addStaffBtn.disabled = false;
        addStaffBtn.textContent = "[ Внести запись в архив ]";

        if (error) { console.error("Ошибка Supabase:", error); alert("ОШИБКА СОХРАНЕНИЯ:\n\n" + error.message); return; }

        document.getElementById('staffName').value = "";
        document.getElementById('staffRole').value = "";
        document.getElementById('staffImg').value = "";

        const successSound = document.getElementById('success-sound');
        if (successSound) { successSound.volume = 0.05; successSound.currentTime = 0; successSound.play().catch(() => {}); }
        await loadStaff();
    });
}

// ========================================================
// УДАЛЕНИЕ (КАСТОМНОЕ ОКНО)
// ========================================================
function deleteStaff(id) {
    if (!window.isAdminActive) return;
    activeDeleteStaffId = id;
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
        modal.classList.remove('hidden-panel');
        modal.style.display = 'flex'; 
    }
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!activeDeleteStaffId) return;
    
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) {
        modal.classList.add('hidden-panel');
        modal.style.display = 'none';
    }
    
    const { error } = await supabaseClient.from('staff').delete().eq('id', activeDeleteStaffId);
    if (error) {
        console.error("Ошибка удаления:", error);
        alert("ОШИБКА УДАЛЕНИЯ:\n\n" + error.message);
    } else {
        await loadStaff(); 
    }
    activeDeleteStaffId = null;
});

// ========================================================
// ЗАПУСК
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    loadStaff();
});
