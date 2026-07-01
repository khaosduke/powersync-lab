import { wrapPowerSyncWithKysely } from "@powersync/kysely-driver";
import { OPSqliteOpenFactory } from "@powersync/op-sqlite";
import { PowerSyncDatabase } from "@powersync/react-native";
import { Kysely } from "kysely";
import { createContext, useContext } from "react";
import { AppSchema, Database } from './powersync_app_schema';
import { SupabaseConnector } from "./powersync_supabase_connector";

export class System {
    supabaseConnector: SupabaseConnector;
    powersync: PowerSyncDatabase;
    db: Kysely<Database>;;

    constructor() {
        this.powersync = new PowerSyncDatabase({
            schema: AppSchema,
            database: new OPSqliteOpenFactory({
                dbFilename: "app.sqlite",
            }),
        })

        this.supabaseConnector = new SupabaseConnector();
        this.db = wrapPowerSyncWithKysely(this.powersync) as unknown as Kysely<Database>;
    }

    async init() {
        await this.powersync.init();
        await this.powersync.connect(this.supabaseConnector);
    }
}

export const system = new System();
console.log('PowerSync System initialized:', system);
export const SystemContext = createContext<System>(system);
export const useSystem = () => useContext(SystemContext);