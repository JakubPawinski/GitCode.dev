from app.api.endpoints.health import health_check


def test_health_check_smoke():
    response = health_check()
    assert response["status"] == "ok"
    assert response["service"] == "AI Service"
