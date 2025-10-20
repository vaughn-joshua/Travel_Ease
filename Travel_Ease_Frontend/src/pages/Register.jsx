import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import logo from "../assets/traveleaselogo.png";

function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log("Register data:", data);
  };

  return (
    <div className="container">
      <div className="left-side">
      </div>

      <div id="signup" className="right-side form-section">
        <div className="form-box">
          <h2>Register here</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <input
              type="text"
              placeholder="First Name"
              {...register("firstName", { required: "First name is required" })}
            />
            {errors.firstName && <p className="error">{errors.firstName.message}</p>}

            <input
              type="text"
              placeholder="Last Name"
              {...register("lastName", { required: "Last name is required" })}
            />
            {errors.lastName && <p className="error">{errors.lastName.message}</p>}

            <input
              type="email"
              placeholder="Email"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" },
              })}
            />
            {errors.email && <p className="error">{errors.email.message}</p>}

            <input
              type="text"
              placeholder="Contact No."
              {...register("contact", {
                required: "Contact number is required",
                pattern: { value: /^[0-9]+$/, message: "Numbers only" },
              })}
            />
            {errors.contact && <p className="error">{errors.contact.message}</p>}

            <input
              type="password"
              placeholder="Password"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <p className="error">{errors.password.message}</p>}

            <label>Upload Picture:</label>
            <input type="file" accept="image/*" {...register("picture")} />

            <button type="submit" className="btn">Sign up</button>
          </form>

          <p className="link">
            Already have an account? <Link to="/login">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
