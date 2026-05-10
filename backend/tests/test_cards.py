def test_create_card(client, auth_headers, board_id, db):
    from models import KanbanColumn
    # Use a column that has no cards initially (e.g., create a new board for isolation)
    resp = client.post("/api/boards", headers=auth_headers, json={"name": "Card Test Board"})
    assert resp.status_code == 201
    test_board_id = resp.json()["id"]
    board_detail = client.get(f"/api/boards/{test_board_id}", headers=auth_headers)
    col_id = board_detail.json()["columns"][0]["id"]

    resp = client.post(f"/api/boards/{test_board_id}/cards", headers=auth_headers, json={
        "column_id": col_id, "title": "Test card", "description": "test"
    })
    assert resp.status_code == 201
    card = resp.json()
    assert card["title"] == "Test card"
    assert card["position"] == 0
    assert card["labels"] == []


def test_create_card_with_priority(client, auth_headers):
    resp = client.post("/api/boards", headers=auth_headers, json={"name": "Priority Board"})
    test_board_id = resp.json()["id"]
    board_detail = client.get(f"/api/boards/{test_board_id}", headers=auth_headers)
    col_id = board_detail.json()["columns"][0]["id"]

    resp = client.post(f"/api/boards/{test_board_id}/cards", headers=auth_headers, json={
        "column_id": col_id, "title": "Urgent task", "priority": "high"
    })
    assert resp.status_code == 201
    assert resp.json()["priority"] == "high"


def test_create_card_invalid_priority(client, auth_headers):
    resp = client.post("/api/boards", headers=auth_headers, json={"name": "Bad Priority Board"})
    test_board_id = resp.json()["id"]
    board_detail = client.get(f"/api/boards/{test_board_id}", headers=auth_headers)
    col_id = board_detail.json()["columns"][0]["id"]

    resp = client.post(f"/api/boards/{test_board_id}/cards", headers=auth_headers, json={
        "column_id": col_id, "title": "Bad", "priority": "critical"
    })
    assert resp.status_code == 400


def test_create_card_with_due_date(client, auth_headers):
    resp = client.post("/api/boards", headers=auth_headers, json={"name": "Due Date Board"})
    test_board_id = resp.json()["id"]
    board_detail = client.get(f"/api/boards/{test_board_id}", headers=auth_headers)
    col_id = board_detail.json()["columns"][0]["id"]

    resp = client.post(f"/api/boards/{test_board_id}/cards", headers=auth_headers, json={
        "column_id": col_id, "title": "Due soon", "due_date": "2026-06-01T00:00:00"
    })
    assert resp.status_code == 201
    assert resp.json()["due_date"] is not None


def test_create_card_no_auth(client, board_id):
    resp = client.post(f"/api/boards/{board_id}/cards", json={
        "column_id": 1, "title": "Test", "description": ""
    })
    assert resp.status_code == 401


def test_update_card_title(client, auth_headers, board_id, db):
    from models import KanbanColumn, Card
    col = db.query(KanbanColumn).filter(KanbanColumn.board_id == board_id).first()
    card = Card(column_id=col.id, title="Old", description="", position=0)
    db.add(card)
    db.commit()
    db.refresh(card)

    resp = client.patch(f"/api/cards/{card.id}", headers=auth_headers, json={"title": "New"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "New"


def test_update_card_priority(client, auth_headers, board_id, db):
    from models import KanbanColumn, Card
    col = db.query(KanbanColumn).filter(KanbanColumn.board_id == board_id).first()
    card = Card(column_id=col.id, title="Test", description="", position=0)
    db.add(card)
    db.commit()
    db.refresh(card)

    resp = client.patch(f"/api/cards/{card.id}", headers=auth_headers, json={"priority": "urgent"})
    assert resp.status_code == 200
    assert resp.json()["priority"] == "urgent"


def test_delete_card(client, auth_headers, board_id, db):
    from models import KanbanColumn, Card
    col = db.query(KanbanColumn).filter(KanbanColumn.board_id == board_id).first()
    card = Card(column_id=col.id, title="Delete me", description="", position=0)
    db.add(card)
    db.commit()

    resp = client.delete(f"/api/cards/{card.id}", headers=auth_headers)
    assert resp.status_code == 204

    deleted_card = db.query(Card).filter(Card.id == card.id).first()
    assert deleted_card is None


def test_delete_card_no_auth(client, board_id):
    resp = client.delete(f"/api/cards/1")
    assert resp.status_code == 401
