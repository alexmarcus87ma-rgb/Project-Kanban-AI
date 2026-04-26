def test_create_card(client, auth_headers, board_id, db):
    column = db.query(lambda: None).first() or None  # Get first column
    from models import KanbanColumn
    column = db.query(KanbanColumn).filter(KanbanColumn.board_id == board_id).first()

    resp = client.post(f"/api/boards/{board_id}/cards", headers=auth_headers, json={
        "column_id": column.id, "title": "Test card", "description": "test"
    })
    assert resp.status_code == 201
    card = resp.json()
    assert card["title"] == "Test card"
    assert card["position"] == 0


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


def test_delete_card(client, auth_headers, board_id, db):
    from models import KanbanColumn, Card
    col = db.query(KanbanColumn).filter(KanbanColumn.board_id == board_id).first()
    card = Card(column_id=col.id, title="Delete me", description="", position=0)
    db.add(card)
    db.commit()

    resp = client.delete(f"/api/cards/{card.id}", headers=auth_headers)
    assert resp.status_code == 204

    # Verify deleted
    deleted_card = db.query(Card).filter(Card.id == card.id).first()
    assert deleted_card is None


def test_delete_card_no_auth(client, board_id):
    resp = client.delete(f"/api/cards/1")
    assert resp.status_code == 401
