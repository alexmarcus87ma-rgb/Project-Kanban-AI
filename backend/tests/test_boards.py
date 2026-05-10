def test_list_boards(client, auth_headers):
    resp = client.get("/api/boards", headers=auth_headers)
    assert resp.status_code == 200
    boards = resp.json()
    assert len(boards) >= 1
    assert boards[0]["name"] == "Project Workflow"


def test_list_boards_no_auth(client):
    resp = client.get("/api/boards")
    assert resp.status_code == 401


def test_get_board(client, auth_headers, board_id):
    resp = client.get(f"/api/boards/{board_id}", headers=auth_headers)
    assert resp.status_code == 200
    board = resp.json()
    assert board["name"] == "Project Workflow"
    assert len(board["columns"]) == 6


def test_get_board_columns_ordered(client, auth_headers, board_id):
    resp = client.get(f"/api/boards/{board_id}", headers=auth_headers)
    columns = resp.json()["columns"]
    assert columns[0]["name"] == "Ideas/Backlog"
    assert columns[5]["name"] == "Done"


def test_get_board_not_found(client, auth_headers):
    resp = client.get("/api/boards/9999", headers=auth_headers)
    assert resp.status_code == 404


def test_get_board_no_auth(client, board_id):
    resp = client.get(f"/api/boards/{board_id}")
    assert resp.status_code == 401


def test_get_board_has_labels_field(client, auth_headers, board_id):
    resp = client.get(f"/api/boards/{board_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert "labels" in resp.json()


def test_create_board(client, auth_headers):
    resp = client.post("/api/boards", headers=auth_headers, json={"name": "New Board"})
    assert resp.status_code == 201
    board = resp.json()
    assert board["name"] == "New Board"

    # Verify it has default columns
    detail = client.get(f"/api/boards/{board['id']}", headers=auth_headers)
    assert detail.status_code == 200
    columns = detail.json()["columns"]
    assert len(columns) == 5
    assert columns[0]["name"] == "Backlog"
    assert columns[4]["name"] == "Done"


def test_create_board_no_auth(client):
    resp = client.post("/api/boards", json={"name": "Test"})
    assert resp.status_code == 401


def test_create_board_empty_name(client, auth_headers):
    resp = client.post("/api/boards", headers=auth_headers, json={"name": ""})
    assert resp.status_code == 422


def test_update_board(client, auth_headers, board_id):
    resp = client.patch(f"/api/boards/{board_id}", headers=auth_headers, json={"name": "Renamed Board"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed Board"


def test_update_board_not_found(client, auth_headers):
    resp = client.patch("/api/boards/9999", headers=auth_headers, json={"name": "X"})
    assert resp.status_code == 404


def test_delete_board(client, auth_headers):
    # Create a board to delete
    create_resp = client.post("/api/boards", headers=auth_headers, json={"name": "To Delete"})
    assert create_resp.status_code == 201
    bid = create_resp.json()["id"]

    resp = client.delete(f"/api/boards/{bid}", headers=auth_headers)
    assert resp.status_code == 204

    # Verify it's gone
    get_resp = client.get(f"/api/boards/{bid}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_delete_board_not_found(client, auth_headers):
    resp = client.delete("/api/boards/9999", headers=auth_headers)
    assert resp.status_code == 404
