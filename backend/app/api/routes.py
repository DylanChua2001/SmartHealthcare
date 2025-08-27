from fastapi import APIRouter
from app.schemas.user import UserCreate, UserOut

router = APIRouter()

_fake_db = []

@router.get("/health", summary="Health check")
def health_check():
    return {"status": "ok"}

@router.post("/users", response_model=UserOut, summary="Create user")
def create_user(user: UserCreate):
    new_user = {**user.dict(), "id": len(_fake_db) + 1}
    _fake_db.append(new_user)
    return new_user

@router.get("/users", response_model=list[UserOut], summary="List users")
def list_users():
    return _fake_db
