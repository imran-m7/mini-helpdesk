from tests.conftest import create_user, login

# this file contains tests for the tickets endpoints, which require authentication
def create_ticket(client, headers, title="Printer broken"):
    return client.post(
        "/api/tickets",
        json={"title": title, "description": "It prints blank pages", "priority": "high"},
        headers=headers,
    )


def test_create_ticket(client, user_headers):
    response = create_ticket(client, user_headers)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Printer broken"
    assert body["status"] == "open"
    assert body["priority"] == "high"
    assert body["created_by"]["full_name"] == "user"
    assert body["assigned_to"] is None


def test_create_ticket_without_token_returns_401(client):
    response = create_ticket(client, headers={})

    assert response.status_code == 401


def test_user_cannot_change_status(client, user_headers):
    ticket_id = create_ticket(client, user_headers).json()["id"]

    response = client.patch(
        f"/api/tickets/{ticket_id}", json={"status": "closed"}, headers=user_headers
    )

    assert response.status_code == 403


def test_agent_can_assign_and_change_status(client, user_headers, agent_headers):
    ticket_id = create_ticket(client, user_headers).json()["id"]

    assign = client.post(f"/api/tickets/{ticket_id}/assign", headers=agent_headers)
    update = client.patch(
        f"/api/tickets/{ticket_id}", json={"status": "in_progress"}, headers=agent_headers
    )

    assert assign.status_code == 200
    assert assign.json()["assigned_to"]["full_name"] == "agent"
    assert update.status_code == 200
    assert update.json()["status"] == "in_progress"


def test_user_sees_only_own_tickets(client, db, user_headers, agent_headers):
    create_user(db, "other@test.com", "Other123!")
    other_headers = login(client, "other@test.com", "Other123!")
    create_ticket(client, user_headers, title="My ticket")
    create_ticket(client, other_headers, title="Someone else's ticket")

    mine = client.get("/api/tickets", headers=user_headers).json()
    everything = client.get("/api/tickets", headers=agent_headers).json()

    assert mine["total"] == 1
    assert mine["items"][0]["title"] == "My ticket"
    assert everything["total"] == 2


def test_deleted_ticket_is_hidden(client, user_headers):
    ticket_id = create_ticket(client, user_headers).json()["id"]

    delete = client.delete(f"/api/tickets/{ticket_id}", headers=user_headers)
    get_after = client.get(f"/api/tickets/{ticket_id}", headers=user_headers)

    assert delete.status_code == 204
    assert get_after.status_code == 404