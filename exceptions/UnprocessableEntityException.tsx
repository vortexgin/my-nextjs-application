export default class UnprocessableEntityException extends Error {

    data: any;
    code: number;

    constructor(message: string | undefined, data: any = null) {
        super(message);
        this.name = "Unprocessable Entity";
        this.data = data;
        this.code = 422;
    }
}
