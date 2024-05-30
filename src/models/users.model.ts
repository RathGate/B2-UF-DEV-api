class User {
    constructor(
        public email: string,
        public username: string,
        public password: string,
        public role_id?: number
    ) {}

    isValid(): boolean {
        return !this.email
            || !this.password
            || !this.username
    }
}

export default User;