def test_get_activities(client):
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_unregister(client):
    email = "alice@test.com"
    # signup
    res = client.post("/activities/Chess Club/signup", params={"email": email})
    assert res.status_code == 200
    assert "Signed up" in res.json()["message"]

    # verify present
    res2 = client.get("/activities")
    assert email in res2.json()["Chess Club"]["participants"]

    # unregister
    res3 = client.delete("/activities/Chess Club/unregister", params={"email": email})
    assert res3.status_code == 200
    assert "Unregistered" in res3.json()["message"]

    # verify removed
    res4 = client.get("/activities")
    assert email not in res4.json()["Chess Club"]["participants"]


def test_signup_duplicate(client):
    # michael is already registered in the default data
    email = "michael@mergington.edu"
    res = client.post("/activities/Chess Club/signup", params={"email": email})
    assert res.status_code == 400
    assert res.json()["detail"] == "Student already signed up for this activity"


def test_unregister_not_registered(client):
    email = "notregistered@example.com"
    res = client.delete("/activities/Chess Club/unregister", params={"email": email})
    assert res.status_code == 400
    assert res.json()["detail"] == "Student not registered for this activity"


def test_activity_not_found(client):
    res = client.get("/activities/NoSuchActivity")
    # GET /activities/NoSuchActivity is not defined; ensure signup returns 404
    res2 = client.post("/activities/NoSuchActivity/signup", params={"email": "x@x.com"})
    assert res2.status_code == 404
    res3 = client.delete("/activities/NoSuchActivity/unregister", params={"email": "x@x.com"})
    assert res3.status_code == 404
