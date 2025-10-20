import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import logo from "../assets/traveleaselogo.png";

function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm(); 

  const onSubmit = (data) => {
    console.log("Login data:", data);
  };

  return (
    <div className="container">
      <div className="left-side">
        <img src={logo} alt="TravelEase Logo" className="logo" />
        <h1>Welcome To TravelEase</h1>
        <p>Explore Freely, Travel Easily.</p>
      </div>

      <div id="login" className="right-side form-section active">
        <div className="form-box">
          <h2>Log in here</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <input
              type="text"
              placeholder="Email or username"
              {...register("username", { required: "Email or username is required" })}
            />
            {errors.username && <p className="error">{errors.username.message}</p>}

            <input
              type="password"
              placeholder="Password"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <p className="error">{errors.password.message}</p>}

            <p className="link">
              Don’t have an account? <Link to="/register">Sign up here</Link>
            </p>

            <button type="submit" className="btn">Log in</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

