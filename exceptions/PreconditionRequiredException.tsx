export default class PreconditionRequiredException extends Error {

    data: any;
    code: number;

    constructor(message: string | undefined, data: any = null) {
        super(message);
        this.name = "Precondition Required";
        this.data = data;
        this.code = 428;
    }
}
