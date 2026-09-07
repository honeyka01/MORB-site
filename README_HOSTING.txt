CAQT / SARKTIS — HOSTING READY

Структура:
- HTML: index.html, login.html, anomaly.html, para.html, personal.html, prot.html
- JS: auth.js, auth-guard.js, main.js, anomaly.js, para.js, personal.js, prot.js
- CSS: index.css, font-override.css
- assets: fonts/, sounds/
- supabase_admin_rls.sql — настройка RLS и администраторов

ВАЖНО:
1. Опубликуйте содержимое этой папки на обычном статическом хостинге.
2. В Supabase SQL Editor выполните supabase_admin_rls.sql.
3. В Supabase Authentication -> Users создайте/используйте аккаунт администратора.
4. Получите UUID этого пользователя и добавьте его в public.admin_users:
   insert into public.admin_users (user_id) values ('UUID');
5. Код больше не использует хардкод админ-ключа "07".
6. Реальная защита INSERT/UPDATE/DELETE выполняется Supabase RLS.
7. Publishable/anon ключ Supabase может находиться во frontend. service_role/secret key в frontend помещать нельзя.

Примечание:
auth-guard.js сохранён как исходный файл проекта; проверка админа реализована в auth.js,
который уже подключается на административных страницах.
