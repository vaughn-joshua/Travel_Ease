function register(req, res) {
  try {
    res.send("here are at the register");
  } catch (e) {
    res.send({ error: e });
  }
}

function login(req, res) {
  try {
    res.send("here are at the login");
  } catch (e) {
    res.send({ error: e });
  }
}

function favorite(req, res) {
  try {
    res.send("here are at the favorite");
  } catch (e) {
    res.send({ error: e });
  }
}

function favorite_id(req, res) {
  try {
    res.send("here are at the favorite_id");
  } catch (e) {
    res.send({ error: e });
  }
}

function user_id(req, res) {
  try {
    res.send("here are at the user_id");
  } catch (e) {
    res.send({ error: e });
  }
}

export { register, login, favorite, favorite_id, user_id };
