from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str # check is only at database level, no need for validation here

# api returns token and token type (bearer) to the client after successful login
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"