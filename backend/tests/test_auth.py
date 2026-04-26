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
