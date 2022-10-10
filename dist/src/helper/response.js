"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResponseHandler {
    constructor(success, data, message, code) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.code = code;
        this.success = success;
        this.data = data;
        this.message = message;
        this.code = code;
    }
    static success(data, message) {
        return new ResponseHandler(true, data, message, 200);
    }
    static error(data, message) {
        return new ResponseHandler(false, data, message, 500);
    }
    static un_autorized(data, message) {
        return new ResponseHandler(false, data, message, 401);
    }
    static not_found(data, message) {
        return new ResponseHandler(false, data, message, 404);
    }
}
exports.default = ResponseHandler;
