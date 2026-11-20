import math
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models import Ticket, TicketStatus, User, UserRole
from app.schemas.ticket import TicketCreate, TicketFilters, TicketPage, TicketUpdate

AGENT_ONLY_FIELDS = {"status", "priority"}

# most important def in this file, _ means it is internal
# important because it is used by all the other functions to get the base query for tickets that a user is allowed to see
def _base_query(user: User):
    """Tickets this user is allowed to see (never soft-deleted ones)."""
    query = (
        select(Ticket)
        .where(Ticket.deleted_at.is_(None))
        # load created_by and assigned_to relationships in the same query, so we don't have to make a separate query for each ticket
        .options(selectinload(Ticket.created_by), selectinload(Ticket.assigned_to))
    )
    if user.role != UserRole.agent:
        query = query.where(Ticket.created_by_id == user.id)
    return query

def get_ticket(db: Session, ticket_id: int, user: User) -> Ticket:
    ticket = db.scalar(_base_query(user).where(Ticket.id == ticket_id))
    if ticket is None:
        # also used when the ticket belongs to someone else: we don't reveal it exists
        raise NotFoundError("Ticket not found")
    return ticket

def create_ticket(db: Session, data: TicketCreate, user: User) -> Ticket:
    ticket = Ticket(
        title=data.title.strip(),
        description=data.description.strip(),
        priority=data.priority,
        created_by_id=user.id,
    )
    db.add(ticket)
    db.commit()
    return get_ticket(db, ticket.id, user)

def list_tickets(db: Session, filters: TicketFilters, user: User) -> TicketPage:
    query = _base_query(user)

    # building query
    if filters.status is not None: # if status open
        query = query.where(Ticket.status == filters.status)
    if filters.priority is not None: # if priority none just skip since we filter
        query = query.where(Ticket.priority == filters.priority)
    if filters.assigned_to_id is not None:
        query = query.where(Ticket.assigned_to_id == filters.assigned_to_id)
    if filters.search:
        query = query.where(Ticket.title.ilike(f"%{filters.search.strip()}%"))

    # get total count of tickets matching the filters, for pagination
    total = db.scalar(select(func.count()).select_from(query.subquery()))

    # newer tickets first, if same created_at, then by id
    items = db.scalars(
        query.order_by(Ticket.created_at.desc(), Ticket.id.desc())
        .offset((filters.page - 1) * filters.page_size)
        .limit(filters.page_size)
    ).all()

    # what will frontend show: items, total, page, page_size, pages
    return TicketPage(
        items=items,
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        pages=math.ceil(total / filters.page_size) if total else 0, # if no tickets that match, pages are zero
    )

def update_ticket(db: Session, ticket_id: int, data: TicketUpdate, user: User) -> Ticket:
    ticket = get_ticket(db, ticket_id, user)
    changes = data.model_dump(exclude_unset=True) # only fields that were sent by the client
    for text_field in ("title", "description"):
        if text_field in changes:
            changes[text_field] = changes[text_field].strip()
    
    if user.role != UserRole.agent:
        # only block agent-only fields whose value would actually change
        forbidden = {
            field
            for field in AGENT_ONLY_FIELDS
            if field in changes and changes[field] != getattr(ticket, field)
        }
        if forbidden:
            raise ForbiddenError(f"Only agents can change: {', '.join(sorted(forbidden))}")
        if ticket.status != TicketStatus.open:
            raise ForbiddenError("You can only edit tickets that are still open")

    for field, value in changes.items():
        setattr(ticket, field, value) # ticket.<field> = value

    db.commit()
    return get_ticket(db, ticket.id, user)

# check if agent inside router, since only agent can assign tickets to themselves
def assign_to_me(db: Session, ticket_id: int, agent: User) -> Ticket:
    ticket = get_ticket(db, ticket_id, agent)
    ticket.assigned_to = agent  # set the relationship, so ticket.assigned_to is updated too (not only id)
    db.commit()
    return get_ticket(db, ticket.id, agent)

# check if agent here, because both can delete but under different rules
def delete_ticket(db: Session, ticket_id: int, user: User) -> None:
    ticket = get_ticket(db, ticket_id, user)
    if user.role != UserRole.agent and ticket.status != TicketStatus.open:
        raise ForbiddenError("You can only delete tickets that are still open")

    ticket.deleted_at = datetime.now(timezone.utc)  # soft delete: row stays in the DB
    db.commit()