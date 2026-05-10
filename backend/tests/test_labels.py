def test_create_label(client, auth_headers, board_id):
    resp = client.post(f"/api/boards/{board_id}/labels", headers=auth_headers, json={
        "name": "Bug", "color": "#ef4444"
    })
    assert resp.status_code == 201
    label = resp.json()
    assert label["name"] == "Bug"
    assert label["color"] == "#ef4444"
    assert label["board_id"] == board_id


def test_create_label_default_color(client, auth_headers, board_id):
    resp = client.post(f"/api/boards/{board_id}/labels", headers=auth_headers, json={
        "name": "Feature"
    })
    assert resp.status_code == 201
    assert resp.json()["color"] == "#6366f1"


def test_list_labels(client, auth_headers, board_id):
    # Create two labels
    client.post(f"/api/boards/{board_id}/labels", headers=auth_headers, json={"name": "A"})
    client.post(f"/api/boards/{board_id}/labels", headers=auth_headers, json={"name": "B"})

    resp = client.get(f"/api/boards/{board_id}/labels", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_update_label(client, auth_headers, board_id):
    create = client.post(f"/api/boards/{board_id}/labels", headers=auth_headers, json={"name": "Old"})
    label_id = create.json()["id"]

    resp = client.patch(f"/api/boards/{board_id}/labels/{label_id}", headers=auth_headers, json={
        "name": "Updated", "color": "#22c55e"
    })
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"
    assert resp.json()["color"] == "#22c55e"


def test_delete_label(client, auth_headers, board_id):
    create = client.post(f"/api/boards/{board_id}/labels", headers=auth_headers, json={"name": "Temp"})
    label_id = create.json()["id"]

    resp = client.delete(f"/api/boards/{board_id}/labels/{label_id}", headers=auth_headers)
    assert resp.status_code == 204


def test_label_not_found(client, auth_headers, board_id):
    resp = client.patch(f"/api/boards/{board_id}/labels/9999", headers=auth_headers, json={"name": "X"})
    assert resp.status_code == 404


def test_label_board_not_found(client, auth_headers):
    resp = client.get("/api/boards/9999/labels", headers=auth_headers)
    assert resp.status_code == 404


def test_label_no_auth(client, board_id):
    resp = client.get(f"/api/boards/{board_id}/labels")
    assert resp.status_code == 401


def test_create_card_with_labels(client, auth_headers):
    # Create board + label
    board_resp = client.post("/api/boards", headers=auth_headers, json={"name": "Label Card Board"})
    bid = board_resp.json()["id"]

    label_resp = client.post(f"/api/boards/{bid}/labels", headers=auth_headers, json={"name": "Bug"})
    lid = label_resp.json()["id"]

    # Get first column
    detail = client.get(f"/api/boards/{bid}", headers=auth_headers)
    col_id = detail.json()["columns"][0]["id"]

    # Create card with label
    card_resp = client.post(f"/api/boards/{bid}/cards", headers=auth_headers, json={
        "column_id": col_id, "title": "Fix bug", "label_ids": [lid]
    })
    assert card_resp.status_code == 201
    card = card_resp.json()
    assert len(card["labels"]) == 1
    assert card["labels"][0]["name"] == "Bug"


def test_update_card_labels(client, auth_headers):
    # Create board + labels
    board_resp = client.post("/api/boards", headers=auth_headers, json={"name": "Update Label Board"})
    bid = board_resp.json()["id"]

    l1 = client.post(f"/api/boards/{bid}/labels", headers=auth_headers, json={"name": "Bug"}).json()["id"]
    l2 = client.post(f"/api/boards/{bid}/labels", headers=auth_headers, json={"name": "Feature"}).json()["id"]

    detail = client.get(f"/api/boards/{bid}", headers=auth_headers)
    col_id = detail.json()["columns"][0]["id"]

    # Create card with one label
    card = client.post(f"/api/boards/{bid}/cards", headers=auth_headers, json={
        "column_id": col_id, "title": "Test", "label_ids": [l1]
    }).json()

    # Update to different label
    updated = client.patch(f"/api/cards/{card['id']}", headers=auth_headers, json={
        "label_ids": [l2]
    })
    assert updated.status_code == 200
    assert len(updated.json()["labels"]) == 1
    assert updated.json()["labels"][0]["name"] == "Feature"

    # Update to no labels
    cleared = client.patch(f"/api/cards/{card['id']}", headers=auth_headers, json={
        "label_ids": []
    })
    assert cleared.status_code == 200
    assert len(cleared.json()["labels"]) == 0
