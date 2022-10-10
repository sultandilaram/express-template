class ResponseHandler {
  constructor(
    private success: boolean,
    private data: any,
    private message: string,
    private code: number
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.code = code;
  }

  public static success(data: any, message: string) {
    return new ResponseHandler(true, data, message, 200);
  }

  public static error(data: any, message: string) {
    return new ResponseHandler(false, data, message, 500);
  }

  public static un_autorized(data: any, message: string) {
    return new ResponseHandler(false, data, message, 401);
  }

  public static not_found(data: any, message: string) {
    return new ResponseHandler(false, data, message, 404);
  }
}

export default ResponseHandler;
