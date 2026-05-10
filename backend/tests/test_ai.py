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
