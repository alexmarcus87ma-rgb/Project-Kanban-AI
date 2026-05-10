def test_update_column_name(client, auth_headers, board_id, db):
    from models import KanbanColumn
    column = db.query(KanbanColumn).filter(KanbanColumn.board_id == board_id).first()

    resp = client.patch(f"/api/columns/{column.id}", headers=auth_headers, json={"name": "Renamed"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed"


def test_update_column_no_auth(client, board_id):
    resp = client.patch(f"/api/columns/1", json={"name": "Test"})
    assert resp.status_code == 401


def test_update_column_not_found(client, auth_headers):
    resp = client.patch(f"/api/columns/9999", headers=auth_headers, json={"name": "Test"})
    assert resp.status_code == 404


def test_column_isolation(client, auth_headers, board_id, db):
    # Create another user + board
    from models import User, Board, KanbanColumn
    from auth import hash_password

    other_user = User(username="other", password_hash=hash_password("pwd"))
    db.add(other_user)
    db.flush()

    other_board = Board(user_id=other_user.id, name="Other")
    db.add(other_board)
    db.flush()

    other_col = KanbanColumn(board_id=other_board.id, name="Other Col", position=0)
    db.add(other_col)
    db.commit()

    # Try to update other user's column
    resp = client.patch(f"/api/columns/{other_col.id}", headers=auth_headers, json={"name": "Hacked"})
    assert resp.status_code == 404


def test_create_column(client, auth_headers, board_id):
    resp = client.post(f"/api/boards/{board_id}/columns", headers=auth_headers, json={"name": "New Column"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "New Column"
    assert data["board_id"] == board_id
    assert data["position"] >= 0


def test_create_column_no_auth(client, board_id):
    resp = client.post(f"/api/boards/{board_id}/columns", json={"name": "Test"})
    assert resp.status_code == 401


def test_create_column_board_not_found(client, auth_headers):
    resp = client.post("/api/boards/9999/columns", headers=auth_headers, json={"name": "Test"})
    assert resp.status_code == 404


def test_delete_column(client, auth_headers, board_id, db):
    from models import KanbanColumn

    # Create a new column to delete
    col = KanbanColumn(board_id=board_id, name="To Delete", position=99)
    db.add(col)
    db.commit()
    db.refresh(col)

    resp = client.delete(f"/api/columns/{col.id}", headers=auth_headers)
    assert resp.status_code == 204

    # Verify deleted
    assert db.query(KanbanColumn).filter(KanbanColumn.id == col.id).first() is None


def test_delete_column_not_found(client, auth_headers):
    resp = client.delete("/api/columns/9999", headers=auth_headers)
    assert resp.status_code == 404


def test_delete_column_no_auth(client):
    resp = client.delete("/api/columns/1")
    assert resp.status_code == 401
