// lib/getProdi.ts
import { userToNim } from "shared";

export function getProdi(userKey: number, email: string): string {
    const nim = userToNim[String(userKey)];
    return nim
        ? nim.slice(0, 3).toUpperCase()
        : email.match(/^([a-zA-Z0-9]+)@/)![1].toUpperCase().slice(0, 3);
}