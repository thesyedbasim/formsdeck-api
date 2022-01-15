class UserError extends Error {
	constructor(public message: string) {
		super(message);
	}
}

export default UserError;
