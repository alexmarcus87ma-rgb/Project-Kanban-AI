from unittest.mock import AsyncMock, patch, MagicMock


def make_mock_response(content: str):
    """Create a mock httpx response object."""
    mock = MagicMock()
    mock.raise_for_status = MagicMock()
    mock.json.return_value = {
        "choices": [{"message": {"content": content}}]
    }
    return mock


def test_ai_test_success(client, auth_headers):
    """Test successful AI test endpoint call with mocked OpenRouter."""
    with patch("services.ai_service.settings") as mock_settings, \
         patch("services.ai_service.httpx.AsyncClient") as mock_client_cls:

        # Configure mocks
        mock_settings.openrouter_api_key = "test-key"
        mock_settings.openrouter_base_url = "https://openrouter.ai/api/v1"
        mock_settings.openrouter_model = "google/gemma-4-31b-it:free"

        # Setup AsyncClient mock
        mock_instance = AsyncMock()
        mock_instance.post = AsyncMock(return_value=make_mock_response("4"))
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        # Make request
        resp = client.post(
            "/api/ai/test",
            headers=auth_headers,
            json={"prompt": "What is 2+2?"}
        )

        # Verify response
        assert resp.status_code == 200
        data = resp.json()
        assert data["result"] == "4"
        assert "model" in data


def test_ai_test_no_auth(client):
    """Test AI endpoint requires authentication."""
    resp = client.post("/api/ai/test", json={"prompt": "test"})
    assert resp.status_code == 401


def test_ai_test_no_api_key(client, auth_headers):
    """Test AI endpoint when OpenRouter API key is not configured."""
    with patch("routes.ai.settings") as mock_settings:
        mock_settings.openrouter_api_key = ""

        resp = client.post(
            "/api/ai/test",
            headers=auth_headers,
            json={"prompt": "test"}
        )

        assert resp.status_code == 503
        assert "not configured" in resp.json()["detail"]


# Chat endpoint tests

def test_ai_chat_success(client, auth_headers, board_id, db):
    """Test chat endpoint returns reply and persists conversation history."""
    with patch("services.ai_service.settings") as ms, \
         patch("services.ai_service.httpx.AsyncClient") as mc:

        # Configure mocks
        ms.openrouter_api_key = "test-key"
        ms.openrouter_base_url = "https://openrouter.ai/api/v1"
        ms.openrouter_model = "google/gemma-4-31b-it:free"

        # Setup AsyncClient mock
        mock_instance = AsyncMock()
        mock_instance.post = AsyncMock(return_value=make_mock_response("Try moving it to In Progress."))
        mc.return_value.__aenter__ = AsyncMock(return_value=mock_instance)
        mc.return_value.__aexit__ = AsyncMock(return_value=None)

        # Make request
        resp = client.post(
            "/api/ai/chat",
            headers=auth_headers,
            json={"message": "Where should I put my task?", "board_id": board_id}
        )

        # Verify response
        assert resp.status_code == 200
        data = resp.json()
        assert data["reply"] == "Try moving it to In Progress."
        assert "model" in data

        # Verify both turns persisted
        from models import ConversationHistory
        rows = db.query(ConversationHistory).filter(
            ConversationHistory.board_id == board_id
        ).all()
        assert len(rows) == 2
        assert rows[0].role == "user"
        assert rows[0].message == "Where should I put my task?"
        assert rows[1].role == "assistant"
        assert rows[1].message == "Try moving it to In Progress."


def test_ai_chat_no_auth(client, board_id):
    """Test chat endpoint requires authentication."""
    resp = client.post(
        "/api/ai/chat",
        json={"message": "hi", "board_id": board_id}
    )
    assert resp.status_code == 401


def test_ai_chat_board_not_found(client, auth_headers):
    """Test chat endpoint returns 404 for non-existent board."""
    with patch("routes.ai.settings") as ms:
        ms.openrouter_api_key = "test-key"

        resp = client.post(
            "/api/ai/chat",
            headers=auth_headers,
            json={"message": "hi", "board_id": 9999}
        )
        assert resp.status_code == 404


def test_ai_chat_no_api_key(client, auth_headers, board_id):
    """Test chat endpoint when API key is not configured."""
    with patch("routes.ai.settings") as ms:
        ms.openrouter_api_key = ""

        resp = client.post(
            "/api/ai/chat",
            headers=auth_headers,
            json={"message": "hi", "board_id": board_id}
        )
        assert resp.status_code == 503


# Clear chat history tests

def test_clear_chat_history(client, auth_headers, board_id, db):
    """Test clearing conversation history for a board."""
    from models import ConversationHistory

    # Add some conversation history
    db.add(ConversationHistory(user_id=1, board_id=board_id, role="user", message="hello"))
    db.add(ConversationHistory(user_id=1, board_id=board_id, role="assistant", message="hi"))
    db.commit()

    # Verify history exists
    count = db.query(ConversationHistory).filter(ConversationHistory.board_id == board_id).count()
    assert count == 2

    # Clear history
    resp = client.delete(f"/api/ai/chat/{board_id}/history", headers=auth_headers)
    assert resp.status_code == 204

    # Verify history is cleared
    count = db.query(ConversationHistory).filter(ConversationHistory.board_id == board_id).count()
    assert count == 0


def test_clear_chat_history_no_auth(client, board_id):
    """Test clearing chat history requires authentication."""
    resp = client.delete(f"/api/ai/chat/{board_id}/history")
    assert resp.status_code == 401


def test_clear_chat_history_board_not_found(client, auth_headers):
    """Test clearing chat history for non-existent board."""
    resp = client.delete("/api/ai/chat/9999/history", headers=auth_headers)
    assert resp.status_code == 404


def test_parse_ai_response_json():
    """Test AI response parsing with valid JSON."""
    from routes.ai import _parse_ai_response

    raw = '{"response": "Hello!", "actions": []}'
    text, actions = _parse_ai_response(raw)
    assert text == "Hello!"
    assert actions == []


def test_parse_ai_response_with_actions():
    """Test AI response parsing extracts actions."""
    from routes.ai import _parse_ai_response

    raw = '{"response": "Done!", "actions": [{"type": "create_card", "column_name": "Backlog", "title": "Test"}]}'
    text, actions = _parse_ai_response(raw)
    assert text == "Done!"
    assert len(actions) == 1
    assert actions[0]["type"] == "create_card"


def test_parse_ai_response_fallback():
    """Test AI response parsing falls back to raw text."""
    from routes.ai import _parse_ai_response

    raw = "Just a plain text response"
    text, actions = _parse_ai_response(raw)
    assert text == "Just a plain text response"
    assert actions == []


def test_parse_ai_response_markdown_fences():
    """Test AI response parsing strips markdown fences."""
    from routes.ai import _parse_ai_response

    raw = '```json\n{"response": "Hello!", "actions": []}\n```'
    text, actions = _parse_ai_response(raw)
    assert text == "Hello!"
    assert actions == []


# Server-side action guard tests

def test_user_requested_action_create():
    """Action keywords are detected."""
    from routes.ai import _user_requested_action

    assert _user_requested_action("Create a card called Test") is True
    assert _user_requested_action("add a task to backlog") is True
    assert _user_requested_action("make a new card") is True
    assert _user_requested_action("delete that card") is True
    assert _user_requested_action("move it to Done") is True
    assert _user_requested_action("rename the column") is True


def test_user_requested_action_greetings_blocked():
    """Greetings and questions should NOT trigger actions."""
    from routes.ai import _user_requested_action

    assert _user_requested_action("Hello") is False
    assert _user_requested_action("Hi there!") is False
    assert _user_requested_action("Hey") is False
    assert _user_requested_action("What's on my board?") is False
    assert _user_requested_action("Show me my tasks") is False
    assert _user_requested_action("How are you?") is False
    assert _user_requested_action("Good morning") is False
    assert _user_requested_action("What should I work on?") is False


def test_user_requested_action_romanian():
    """Romanian action keywords are detected."""
    from routes.ai import _user_requested_action

    assert _user_requested_action("Creează un card nou") is True
    assert _user_requested_action("Șterge cardul ăla") is True
    assert _user_requested_action("Mută cardul în Done") is True
    assert _user_requested_action("Salut!") is False
    assert _user_requested_action("Ce am pe board?") is False
