import { Link } from "react-router-dom";
import logo from "../assets/traveleaselogo.png";

function Register() {
  return (
    <div className="container">
      <div className="left-side">
        <img src={logo} alt="TravelEase Logo" className="logo"/>
        <h1>Welcome To TravelEase</h1>
        <p>Explore Freely, Travel Easily.</p>
      </div>

      <div id="signup" className="right-side form-section">
        <div className="form-box">
          <h2>Register here</h2>
          <form>
            <input type="text" placeholder="First Name" required />
            <input type="text" placeholder="Last Name" required />
            <input type="email" placeholder="Email" required />
            <input type="text" placeholder="Contact No." required />
            <input type="password" placeholder="Password" required />
            <label>Upload Picture:</label>
            <input type="file" accept="image/*" />
            <button type="submit" className="btn">Sign up</button>
          </form>
          <p className="link">
            Already have an account? <Link to="/">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;