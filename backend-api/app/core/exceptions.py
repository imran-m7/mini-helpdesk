# our own exception class inherited from Python Exception class
class AppError(Exception):
    """Base class for errors the API returns on purpose."""

    status_code = 400 # default status code for this error

    def __init__(self, detail: str):
        super().__init__(detail)
        self.detail = detail # when Error is raised, number is from child class, but details from this constructor


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


class UnauthorizedError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403