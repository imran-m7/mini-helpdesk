def test_register_creates_regular_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "new@test.com",
            "full_name": "New User",
            "password": "Secret123!",
            "role": "agent",  # must be ignored
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new@test.com"
    assert body["role"] == "user"
    assert "hashed_password" not in body # check if the hashed password is not returned in the response
    assert "password" not in body


def test_register_duplicate_email_returns_409(client):
    data = {"email": "dup@test.com", "full_name": "Dup", "password": "Secret123!"}
    client.post("/api/auth/register", json=data)

    response = client.post("/api/auth/register", json=data)

    assert response.status_code == 409
    assert response.json() == {"detail": "Email is already registered"}


def test_login_returns_token(client):
    client.post(
        "/api/auth/register",
        json={"email": "imran@test.com", "full_name": "Imran", "password": "Secret123!"},
    )

    response = client.post(
        "/api/auth/login", json={"email": "imran@test.com", "password": "Secret123!"}
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_login_with_wrong_password_returns_401(client):
    client.post(
        "/api/auth/register",
        json={"email": "imran@test.com", "full_name": "Imran", "password": "Secret123!"},
    )

    response = client.post(
        "/api/auth/login", json={"email": "imran@test.com", "password": "wrong-password"}
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}


def test_me_without_token_returns_401(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401