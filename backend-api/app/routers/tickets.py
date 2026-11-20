from typing import Annotated

from fastapi import APIRouter, Query, status

from app.deps import AgentUser, CurrentUser, DbSession
from app.models import Ticket
from app.schemas.ticket import (
    TicketCreate,
    TicketFilters,
    TicketOut,
    TicketPage,
    TicketUpdate,
)
from app.services import ticket_service

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(data: TicketCreate, db: DbSession, current_user: CurrentUser) -> Ticket:
    return ticket_service.create_ticket(db, data, current_user)

@router.get("", response_model=TicketPage)
def list_tickets(
    filters: Annotated[TicketFilters, Query()], # build ticket filters from query parameters (URL)
    db: DbSession,
    current_user: CurrentUser,
) -> TicketPage:
    return ticket_service.list_tickets(db, filters, current_user)

# path parameter
@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: DbSession, current_user: CurrentUser) -> Ticket:
    return ticket_service.get_ticket(db, ticket_id, current_user)

@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int, data: TicketUpdate, db: DbSession, current_user: CurrentUser
) -> Ticket:
    return ticket_service.update_ticket(db, ticket_id, data, current_user)

# here is the check if the user is an agent, because only agents can assign tickets to themselves
@router.post("/{ticket_id}/assign", response_model=TicketOut)
def assign_ticket_to_me(ticket_id: int, db: DbSession, agent: AgentUser) -> Ticket:
    return ticket_service.assign_to_me(db, ticket_id, agent)

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: DbSession, current_user: CurrentUser) -> None:
    ticket_service.delete_ticket(db, ticket_id, current_user)