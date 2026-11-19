from datetime import datetime, timedelta, timezone

# packages for hashing passwords and creating/verifying JWTs
import bcrypt
import jwt

# config values for JWTs and other security settings
from app.core.config import settings

# security helper functions for hashing passwords and creating/verifying JWTs
# used for registration, login, and protecting routes that require authentication
def hash_password(password: str) -> str:
    """Turn a plain password into a bcrypt hash (salt included)."""
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()) # gensalt generates a random salt and hashes the password with it
    return hashed.decode("utf-8")

# commpare a plain password to a hashed password, return True if they match, False otherwise
def verify_password(password: str, hashed_password: str) -> bool:
    """Check a plain password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except ValueError:
        # e.g. password longer than 72 bytes: treat as a wrong password
        return False

def create_access_token(user_id: int, role: str) -> str:
    """Create a signed JWT that identifies the user."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now, # issued at time
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes), # expiration time
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def decode_access_token(token: str) -> dict:
    """Verify the signature and expiry, and return the payload.

    Raises jwt.InvalidTokenError if the token is invalid or expired.
    """
    # decode the token using the secret and algorithm, which will raise an exception 401 Unauthorized if the token is invalid or expired
    # if everything valid (not changed) and not expired, return the dictionary payload (sub, role, iat, exp)
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])