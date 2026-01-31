import type { AccountsApi, CategoriesApi, TransactionsApi } from "./types"
import { accountsApi } from "./apiBridges/accounts.api"
import { categoriesApi } from "./apiBridges/categories.api"
import { transactionsApi } from "./apiBridges/transactions.api"

export type Api = {
  accounts: AccountsApi
  categories: CategoriesApi
  transactions: TransactionsApi
}

export const api: Api = {
  accounts: accountsApi,
  categories: categoriesApi,
  transactions: transactionsApi,
}