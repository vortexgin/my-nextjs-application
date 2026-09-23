export default class ExpectationFailedException extends Error {

    data: any;
    code: number;

    constructor(message: string | undefined, data: any = null) {
        super(message);
        this.name = "Expectation failed";
        this.data = data;
        this.code = 417;
    }
}
