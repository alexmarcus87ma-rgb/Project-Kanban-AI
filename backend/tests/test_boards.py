def test_list_boards(client, auth_headers):
    resp = client.get("/api/boards", headers=auth_headers)
    assert resp.status_code == 200
    boards = resp.json()
    assert len(boards) == 1
    assert boards[0]["name"] == "My Board"


def test_list_boards_no_auth(client):
    resp = client.get("/api/boards")
    assert resp.status_code == 401


def test_get_board(client, auth_headers, board_id):
    resp = client.get(f"/api/boards/{board_id}", headers=auth_headers)
    assert resp.status_code == 200
    board = resp.json()
    assert board["name"] == "My Board"
    assert len(board["columns"]) == 5


def test_get_board_columns_ordered(client, auth_headers, board_id):
    resp = client.get(f"/api/boards/{board_id}", headers=auth_headers)
    columns = resp.json()["columns"]
    assert columns[0]["name"] == "Backlog"
    assert columns[4]["name"] == "Done"


def test_get_board_not_found(client, auth_headers):
    resp = client.get("/api/boards/9999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_board_no_auth(client, board_id):
    resp = client.get(f"/api/boards/{board_id}")
    assert resp.status_code == 401
