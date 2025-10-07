import logo from "../assets/traveleaselogo.png"
function Login() {
  return (
    <div className="container">
      <div className="left-side">
      <img src={logo} alt="TravelEase Logo" className="logo"/>
      <h1>Welcome To TravelEase</h1>
      <p>Explore Freely, Travel Easily.</p>
    </div>

    <div id="login" className="right-side form-section active">
      <div className="form-box">
        <h2>Log in here</h2>
        <form>
          <input type="text" placeholder="Email or username" required/>
          <input type="password" placeholder="Password" required/>
          <p className="link">Don’t have an account? <a href="#" id="toSignup">Sign up here</a></p>
          <button type="submit" className="btn">Log in</button>
        </form>
      </div>
    </div>
    </div>
  );
}

export default Login;
