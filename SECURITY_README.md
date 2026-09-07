# Vault-07 — подготовка к хостингу

В исходном TXT действительно были разделены несколько самостоятельных файлов. Я восстановил их по границам HTML/JS/CSS, не смешивая содержимое.

Файлы:
- index.html
- archive.html
- login.html
- para.html
- personal.html
- prot.html
- index.css
- auth.js
- main.js
- anomaly.js
- personal.js
- para.js
- personal-page.js
- prot.js
- config.js

Что изменено:
1. Убраны все 4 проверки `accessKey === "07"` из браузерного JavaScript.
2. Supabase URL и publishable key больше не зашиты в несколько JS-файлов.
3. Publishable key вынесен в `config.js` как placeholder.
4. Админский режим теперь не открывается по паролю из JavaScript: он проверяет авторизованного пользователя и `user.app_metadata.role === "admin"`.
5. Secret/service_role ключи в клиентский код не добавлялись.

Перед загрузкой:
- В `config.js` вставьте ваш Supabase publishable key.
- Не вставляйте туда `service_role`/secret key.
- В Supabase настройте RLS для таблиц, особенно для операций INSERT/DELETE/UPDATE.
- Для администратора назначьте `app_metadata.role = "admin"` серверным способом.

Важно: RLS — это фактическая граница безопасности базы. Клиентский JavaScript нельзя считать секретным.
