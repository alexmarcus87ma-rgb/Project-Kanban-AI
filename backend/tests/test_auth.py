def test_login_success(client):
    resp = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_wrong_password(client):
    resp = client.post("/api/auth/login", json={"username": "user", "password": "wrong"})
    assert resp.status_code == 401


def test_login_wrong_username(client):
    resp = client.post("/api/auth/login", json={"username": "wrong", "password": "password"})
    assert resp.status_code == 401


def test_logout_success(client, auth_headers):
    resp = client.post("/api/auth/logout", headers=auth_headers)
    assert resp.status_code == 204


def test_logout_no_token(client):
    resp = client.post("/api/auth/logout")
    assert resp.status_code == 401


def test_token_invalid_after_logout(client, auth_headers):
    client.post("/api/auth/logout", headers=auth_headers)
    resp = client.get("/api/boards", headers=auth_headers)
    assert resp.status_code == 401


# Registration tests

def test_register_success(client):
    resp = client.post("/api/auth/register", json={"username": "newuser", "password": "newpass123"})
    assert resp.status_code == 201
    assert "token" in resp.json()

    # Verify can use token
    token = resp.json()["token"]
    boards = client.get("/api/boards", headers={"Authorization": f"Bearer {token}"})
    assert boards.status_code == 200
    # New user gets a default board
    assert len(boards.json()) == 1
    assert boards.json()[0]["name"] == "My First Board"


def test_register_duplicate_username(client):
    # "user" is seeded
    resp = client.post("/api/auth/register", json={"username": "user", "password": "newpass123"})
    assert resp.status_code == 409


def test_register_short_username(client):
    resp = client.post("/api/auth/register", json={"username": "ab", "password": "newpass123"})
    assert resp.status_code == 422


def test_register_short_password(client):
    resp = client.post("/api/auth/register", json={"username": "validuser", "password": "12345"})
    assert resp.status_code == 422


def test_get_current_user(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "user"
    assert "id" in data


def test_get_current_user_no_auth(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_register_creates_default_board_with_columns(client):
    resp = client.post("/api/auth/register", json={"username": "boardtest", "password": "password123"})
    assert resp.status_code == 201
    token = resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    boards = client.get("/api/boards", headers=headers)
    assert len(boards.json()) == 1
    board_id = boards.json()[0]["id"]

    detail = client.get(f"/api/boards/{board_id}", headers=headers)
    columns = detail.json()["columns"]
    assert len(columns) == 5
    assert columns[0]["name"] == "Backlog"
