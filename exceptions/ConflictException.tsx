export default class ConflictException extends Error {

    data: any;
    code: number;

    constructor(message: string | undefined, data: any = null) {
        super(message);
        this.name = "Conflict";
        this.data = data;
        this.code = 409;
    }
}
