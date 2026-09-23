export default class BadParameterException extends Error {

    data: any;
    code: number;

    constructor(message: string | undefined, data: any = null) {
        super(message);
        this.name = "Bad parameter";
        this.data = data;
        this.code = 400;
    }
}
