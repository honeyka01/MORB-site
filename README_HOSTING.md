ВАЖНО
=====
Я исправил предыдущую ошибку: publishable key Supabase возвращён, потому что это публичный ключ клиента, и без него фронтенд не может подключиться к Supabase.
Секретные service_role/secret ключи в проект не добавляются.

Структура восстановлена по исходному TXT:
index.html
archive.html
login.html
para.html
personal.html
prot.html
index.css
auth.js
main.js
anomaly.js
para.js
personal.js
prot.js
config.js

Положи папку sounds/ и fonts/ из исходного проекта рядом с HTML, если они у тебя есть.
Важное условие безопасности: реальные права на INSERT/UPDATE/DELETE должны быть защищены RLS в Supabase.
