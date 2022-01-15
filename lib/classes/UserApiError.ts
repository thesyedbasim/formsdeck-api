import UserError from './UserError';

class UserApiError extends UserError {
	constructor(public message: string, public statusCode: number) {
		super(message);
	}
}

export default UserApiError;
