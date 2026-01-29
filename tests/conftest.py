import copy
import importlib.util
from fastapi.testclient import TestClient
import pytest

spec = importlib.util.spec_from_file_location("app_module", "src/app.py")
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)

_original_activities = copy.deepcopy(app_module.activities)

@pytest.fixture(autouse=False)
def client():
    # yield a TestClient and restore activities after the test
    client = TestClient(app_module.app)
    try:
        yield client
    finally:
        app_module.activities.clear()
        app_module.activities.update(copy.deepcopy(_original_activities))
