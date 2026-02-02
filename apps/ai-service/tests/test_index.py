from ai_service import index


def test_index():
    assert index.hello() == "Hello ai-service"
