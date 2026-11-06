import type { FinanceState } from './model';
/** New databases start empty. Existing databases are never reset by an update. */
export function seed():FinanceState {
 return {accounts:[],movements:[],investments:[],goals:[],subscriptions:[]};
}
