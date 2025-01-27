import { useAuth, useSignin } from "../../API/authService";

const Login = () => {
  useAuth();
  const mutation = useSignin();

  function test(e) {
    e.preventDefault();
    mutation.mutate({ login: "qwe", password: "qwe12345" });
  }

  return (
    <form>
      <label>
        Login
        <input type="text" name="login" style={{ display: "block" }} />
      </label>
      <label>
        Pass
        <input type="text" name="password" style={{ display: "block" }} />
      </label>
      <button onClick={test}>{"log in"}</button>
    </form>
  );
};

export default Login;
