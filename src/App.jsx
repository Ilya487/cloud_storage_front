import { useEffect, useRef, useState } from "react";

function App() {
  const SERVER_URL = "http://localhost:8000";

  const [auth, setAuth] = useState(false);
  const [dirName, setDirName] = useState("");
  const [dirContent, setDirContent] = useState([]);
  const userId = useRef("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const response = await fetch(SERVER_URL + "/check-auth", {
      credentials: "include",
    });

    const data = await response.json();
    userId.current = data.userId;
    setAuth(data.authenticated);
  }

  async function signIn(e) {
    e.preventDefault();
    const response = await fetch(SERVER_URL + "/signin", {
      method: "POST",
      credentials: "include",
      body: new FormData(e.target),
    });

    if (response.ok) {
      setAuth(true);
    } else {
      const { message } = await response.json();
      console.log(message);
    }
  }

  async function logOut() {
    const response = await fetch(SERVER_URL + "/logout", {
      credentials: "include",
      method: "POST",
    });

    if (response.ok) {
      setDirContent([]);
      setAuth(false);
    } else {
      const data = await response.json();
      console.log(data);
    }
  }

  async function createDir() {
    const response = await fetch(SERVER_URL + "/folder", {
      credentials: "include",
      method: "POST",
      body: JSON.stringify({
        dirName: dirName,
      }),
    });
    const json = await response.json();
    console.log(json);
  }

  async function getCatalogContent() {
    const response = await fetch(SERVER_URL + `/folder?dirId=${""}`, {
      credentials: "include",
    });

    const data = await response.json();

    if (response.ok) {
      setDirContent(data.contents);
    } else console.log(data);
  }

  return (
    <>
      {auth ? (
        <p>Ваш айди {userId.current}</p>
      ) : (
        <p style={{ marginBottom: "20px" }}>Войдите в аккаунт</p>
      )}

      {!auth && (
        <form onSubmit={signIn}>
          <label>
            Login
            <input type="text" name="login" style={{ display: "block" }} />
          </label>
          <label>
            Pass
            <input type="text" name="password" style={{ display: "block" }} />
          </label>
          <button>{"log in"}</button>
        </form>
      )}

      {auth && (
        <button onClick={logOut} style={{ display: "block" }}>
          {"Выйти"}
        </button>
      )}

      {auth && (
        <>
          <label htmlFor="">
            Введите название папки
            <input
              type="text"
              style={{ display: "block" }}
              value={dirName}
              onChange={(e) => setDirName(e.target.value)}
            />
          </label>
          <button onClick={createDir}>Создать папку</button>
          <button
            onClick={getCatalogContent}
            style={{ display: "block", marginTop: "15px" }}
          >
            Получить папки
          </button>
        </>
      )}

      {dirContent.length > 0 &&
        auth &&
        dirContent.map((item) => (
          <p key={item.id}>{item.name + " path:" + item.path}</p>
        ))}
    </>
  );
}

export default App;
