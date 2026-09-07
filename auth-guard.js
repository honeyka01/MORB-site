// ========================================================
// НИИФО // AUTH GUARD
// Защита страницы от неавторизованных пользователей
// ========================================================

(function () {

  const SUPABASE_URL =
    "https://nizchphlxxhvlpzlfqjc.supabase.co/";

  const SUPABASE_KEY =
    "sb_publishable_ro2cNY3wuyas9GlfJIZ3MA_W3OTmBst";


  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


  // Скрываем страницу до завершения проверки.
  // Это не даёт гостю увидеть содержимое защищённой страницы.
  document.documentElement.style.visibility = "hidden";


  // ========================================================
  // СТРАНИЦА ВХОДА
  // ========================================================

  function getLoginUrl() {

    const current =
      location.pathname +
      location.search +
      location.hash;

    const encoded =
      encodeURIComponent(current);

    return `./login.html?next=${encoded}`;
  }


  // ========================================================
  // ПРОВЕРКА SUPABASE SESSION
  // ========================================================

  async function protectPage() {

    try {

      const {
        data: { session },
        error
      } = await client.auth.getSession();


      // Пользователь не вошёл
      if (error || !session?.user) {

        location.replace(
          getLoginUrl()
        );

        return;
      }


      // Пользователь авторизован
      document.documentElement.style.visibility =
        "visible";
// ====================================================
      // ЕСЛИ ПОЛЬЗОВАТЕЛЬ ВЫШЕЛ В ДРУГОЙ ВКЛАДКЕ
      // ====================================================

      client.auth.onAuthStateChange(
        (event, newSession) => {

          if (
            event === "SIGNED_OUT" ||
            !newSession?.user
          ) {

            location.replace(
              getLoginUrl()
            );

          }

        }
      );


    } catch (error) {

      console.error(
        "Auth guard error:",
        error
      );


      location.replace(
        getLoginUrl()
      );

    }

  }


  // Запускаем проверку
  protectPage();

})();