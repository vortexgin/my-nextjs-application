export default class NotAuthorizedException extends Error {

    data: any;
    code: number;

    constructor(message: string | undefined, data: any = null) {
        super(message);
        this.name = "Not authorized";
        this.data = data;
        this.code = 401;
    }
}
