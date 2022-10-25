import fs from "fs";

export const readJSON = (path: string) =>
  JSON.parse(fs.readFileSync(path).toString());

export const saveJSON = (path: string, obj: any) =>
  fs.writeFileSync(path, JSON.stringify(obj, null, 2));
