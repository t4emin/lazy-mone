import "server-only";
import { getDb } from "@/lib/db";
export function listSocialAccounts(userId:string) { return getDb().socialAccount.findMany({where:{userId},select:{id:true,platform:true,accountName:true,externalAccountId:true,expiresAt:true,status:true,createdAt:true},orderBy:{createdAt:"desc"}}); }
